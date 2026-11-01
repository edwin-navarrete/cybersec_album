import axios from 'axios'
import { Sticker } from './sticker'
import stickersDB from './data/es/stickerDB.json'
import { registerPlayer } from './gameMiddleware'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function newAlbum() {
    const stickerDAO = new Sticker.StickerDAO(stickersDB as Sticker.StickerDef[])
    return new Sticker.Album(stickerDAO, new Sticker.UserStickerDAO([]))
}

describe('registerPlayer', () => {
    beforeEach(() => {
        localStorage.clear()
        localStorage.setItem('albumId', '11111111-1111-4111-8111-111111111111')
    })

    it('keeps the name the server stored, not the one that was typed', async () => {
        // the typed name was taken, so the server gave it a suffix
        mockedAxios.post.mockResolvedValue({ data: { playerId: 7, playerName: 'Juan #4F7K', modifiedOn: '2026-11-01T00:00:00Z' } })

        const name = await newAlbum().registerPlayer('Juan', 'solo')

        expect(name).toBe('Juan #4F7K')
        expect(localStorage.getItem('playerName')).toBe('Juan #4F7K')
        expect(localStorage.getItem('playerId')).toBe('7')
    })

    it('keeps the typed name when the server did not change it', async () => {
        mockedAxios.post.mockResolvedValue({ data: { playerId: 8, playerName: 'Ana', modifiedOn: '2026-11-01T00:00:00Z' } })

        expect(await newAlbum().registerPlayer('Ana', 'solo')).toBe('Ana')
        expect(localStorage.getItem('playerName')).toBe('Ana')
    })

    it('hands the stored name to the screen, so the player is told when it changed', async () => {
        mockedAxios.post.mockResolvedValue({ data: { playerId: 9, playerName: 'Juan #4F7K', modifiedOn: '2026-11-01T00:00:00Z' } })

        const action = await registerPlayer({ playerName: 'Juan', gameMode: 'solo' })(jest.fn(), () => ({}), undefined)

        expect(action.payload).toBe('Juan #4F7K')
    })
})
