import axios from 'axios'
import { Game, Sticker } from './sticker'
import { Question } from './question'
import * as OfflineAlbums from './offlineAlbum'
import config from './gameConfig.json'
import stickersDB from './data/es/stickerDB.json'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const ALBUM = '11111111-1111-4111-8111-111111111111'

// An axios-like error: with a status when the server answered, without one for network failures
const httpError = (status?: number) =>
    Object.assign(new Error(status ? `HTTP ${status}` : 'Network Error'), status ? { response: { status } } : {})

// A page load: new DAOs and album over the same localStorage
function openGame() {
    const stickerDAO = new Sticker.StickerDAO(stickersDB as Sticker.StickerDef[])
    const album = new Sticker.Album(stickerDAO, new Sticker.UserStickerDAO([]))
    return {
        album,
        reward: new Sticker.Reward(config as Game.GameConfig, album, stickerDAO),
        answers: new Question.UserAnswerDAO()
    }
}
type Session = ReturnType<typeof openGame>

// One correct answer: the answer is stored, the sticker is won and claimed
async function winOne(game: Session, questionId: number) {
    const answer = { albumId: ALBUM, questionId, success: true, difficulty: 1.0 }
    await game.answers.put({ ...answer })
    await game.album.ownStickers(await game.reward.produceStickers([answer]))
    for (const sticker of (await game.album.getStickers()).values()) {
        if (!sticker.inAlbum) await game.album.glueSticker(sticker)
    }
}

async function claimedCount(game: Session) {
    return Array.from((await game.album.getStickers()).values()).filter(s => s.inAlbum).length
}

async function playUntilFull(game: Session) {
    let rounds = 0
    while ((await game.album.getAchievement()) < 1 && rounds < 60) await winOne(game, ++rounds)
    return rounds
}

beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('albumId', ALBUM)
    OfflineAlbums.retryDelays.ms = [0, 0]
    jest.spyOn(console, 'error').mockImplementation(() => { })
    jest.spyOn(console, 'warn').mockImplementation(() => { })
    mockedAxios.get.mockResolvedValue({ data: { results: [] } })
})

describe('when saving fails', () => {
    it('goes offline at once on a client error and still completes the album', async () => {
        mockedAxios.post.mockRejectedValue(httpError(400)) // e.g. the album no longer exists

        const game = openGame()
        const rounds = await playUntilFull(game)

        expect(await game.album.getAchievement()).toBe(1)
        expect(rounds).toBeLessThan(60)
        expect(OfflineAlbums.isOffline(ALBUM)).toBe(true)
        expect(mockedAxios.post).toHaveBeenCalledTimes(1) // no retries, and nothing after going offline
    })

    it('retries a network failure twice before going offline', async () => {
        mockedAxios.post.mockRejectedValue(httpError())

        await winOne(openGame(), 1)

        expect(mockedAxios.post).toHaveBeenCalledTimes(3)
        expect(OfflineAlbums.isOffline(ALBUM)).toBe(true)
    })

    it('stays online when the failure was transient', async () => {
        mockedAxios.post
            .mockRejectedValueOnce(httpError(503))
            .mockResolvedValue({ data: { userStickerId: 7, userAnswerId: 8 } })

        await winOne(openGame(), 1)

        expect(OfflineAlbums.isOffline(ALBUM)).toBe(false)
    })

    it('completes the album even when the server does not answer at all', async () => {
        mockedAxios.get.mockRejectedValue(httpError())
        mockedAxios.post.mockRejectedValue(httpError())

        const game = openGame()
        await playUntilFull(game)

        expect(await game.album.getAchievement()).toBe(1)
    })

    it('records why the album went offline', async () => {
        mockedAxios.post.mockRejectedValue(httpError(400))

        await winOne(openGame(), 1)

        const reason = JSON.parse(localStorage.getItem(`offline:${ALBUM}`) as string)
        expect(reason).toMatchObject({ status: 400, message: 'HTTP 400' })
    })
})

describe('refreshing the page while offline', () => {
    it('keeps the stickers and the answers, and does not ask the API', async () => {
        mockedAxios.post.mockRejectedValue(httpError(400))
        const before = openGame()
        for (let round = 1; round <= 5; round++) await winOne(before, round)
        mockedAxios.get.mockClear()

        const after = openGame() // a refresh: memory is gone, localStorage stays

        expect(await claimedCount(after)).toBe(5)
        expect(await after.answers.findAll({ filter: { albumId: ALBUM } })).toHaveLength(5)
        expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('keeps saving locally after the refresh', async () => {
        mockedAxios.post.mockRejectedValue(httpError(400))
        const first = openGame()
        for (let round = 1; round <= 2; round++) await winOne(first, round)

        const second = openGame()
        await winOne(second, 3)
        await winOne(second, 4)

        expect(await claimedCount(openGame())).toBe(4)
    })

    it('shows the local progress instead of the older history kept by the API', async () => {
        mockedAxios.post.mockRejectedValue(httpError(400))
        const stale = { userStickerId: 1, albumId: ALBUM, stickerId: 1, inAlbum: true, addedOn: 1 }
        mockedAxios.get.mockResolvedValue({ data: { results: [stale] } })
        const before = openGame()
        for (let round = 1; round <= 4; round++) await winOne(before, round)

        expect(await claimedCount(openGame())).toBeGreaterThan(1)
    })
})

describe('team albums', () => {
    it('never go offline: the error is raised to the player', async () => {
        localStorage.setItem('groupId', '5')
        localStorage.setItem('isLeader', '1')
        mockedAxios.post.mockRejectedValue(httpError(400))
        const game = openGame()
        const won = await game.reward.produceStickers([{ albumId: ALBUM, questionId: 1, success: true, difficulty: 1.0 }])

        await expect(game.album.ownStickers(won)).rejects.toThrow('HTTP 400')

        expect(OfflineAlbums.isOffline(ALBUM)).toBe(false)
    })
})

describe('creating the album', () => {
    beforeEach(() => localStorage.removeItem('albumId'))

    it('fails, without keeping an album id, when the API cannot create it', async () => {
        mockedAxios.post.mockRejectedValue(httpError(500))

        await expect(openGame().album.getAlbumId()).rejects.toThrow('ALBUM_UNAVAILABLE')

        expect(localStorage.getItem('albumId')).toBeNull()
        expect(mockedAxios.post).toHaveBeenCalledTimes(3) // it retried first
    })

    it('replaces the "undefined" id an earlier version stored', async () => {
        localStorage.setItem('albumId', 'undefined')
        mockedAxios.post.mockResolvedValue({ data: {} })

        const albumId = await openGame().album.getAlbumId()

        expect(albumId).not.toBe('undefined')
        expect(localStorage.getItem('albumId')).toBe(albumId)
    })

    it('fails for a team member whose team has no album yet', async () => {
        localStorage.setItem('groupId', '5')
        mockedAxios.get.mockResolvedValue({ data: { results: [] } })

        await expect(openGame().album.getAlbumId()).rejects.toThrow('ALBUM_UNAVAILABLE')

        expect(localStorage.getItem('albumId')).toBeNull()
    })
})
