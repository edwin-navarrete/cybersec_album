
import { Question } from "./question";
import { Game, Sticker } from "./sticker";
import questionDB from './test/sampleQuestions.json';
import stickersDB from './test/sampleStickers.json';
import axios from 'axios'

// Mock de Axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('UserStickerDAO', () => {

    var userStickerDAO: Sticker.UserStickerDAO

    beforeEach(() => {
        userStickerDAO = new Sticker.UserStickerDAO([])
        mockedAxios.post.mockClear()
    })


    it('should upsert', async () => {
        let sticker = await userStickerDAO.upsert({
            albumId: "juan",
            stickerId: 1,
        })
        expect(sticker.id).toBeDefined()
        // "inAlbum must have default"
        expect(sticker.inAlbum).toBeFalsy()
        expect(sticker.addedOn).toBeDefined()
        let curId = sticker.id
        sticker.inAlbum = true
        sticker = await userStickerDAO.upsert(sticker)
        expect(sticker.id).toEqual(curId)
        //  "inAlbum must be updated"
        expect(sticker.inAlbum).toBeTruthy()
    });
});

describe('Album', () => {

    var userStickerDAO: Sticker.UserStickerDAO
    var album: Sticker.Album

    beforeEach(() => {  
        let stickerDAO = new Sticker.StickerDAO(stickersDB as Sticker.StickerDef[])
        userStickerDAO = new Sticker.UserStickerDAO([])
        // Disable remote access
        userStickerDAO.entrypoint = ""
        album = new Sticker.Album(stickerDAO, userStickerDAO)
        jest.spyOn(album, 'getAlbumId').mockResolvedValue('juan')
    })


    it('get all available spots', async () => {
        userStickerDAO.upsert({ albumId: "juan", stickerId: 1 })
        userStickerDAO.upsert({ albumId: "juan", stickerId: 2 })
        userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })
        let found = await album.getStickers()
        expect(found.size).toEqual(3)
        expect(await album.getAchievement()).toEqual(0)
        expect(await album.getAchievement(true)).toBeCloseTo(0.33)
    });


    it('get all available spots even with repeated stickers', async () => {
        userStickerDAO.upsert({ albumId: "juan", stickerId: 1 })
        userStickerDAO.upsert({ albumId: "juan", stickerId: 2 })
        userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })
        userStickerDAO.upsert({ albumId: "juan", stickerId: 2 })
        userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })
        let found = await album.getStickers()
        expect(found.size).toEqual(3)
        expect(await album.getAchievement()).toEqual(0)
        expect(await album.getAchievement(true)).toBeCloseTo(0.33)
    });


    it('allow to add stickers', async () => {
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 1 })
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 2 })
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 2 })
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })

        let found = await album.getStickers()
        expect(found.size).toEqual(3)
        const sticker0 = found.get("01B")
        let added = (sticker0 && await album.glueSticker(sticker0))
            || {} as Sticker.AlbumStiker
        expect(added && added.inAlbum).toBeTruthy()
        found = await album.getStickers()
        expect(found.size).toEqual(3)
        expect(found.get("01B")).toBeDefined()
        expect((found.get("01B") || {}).inAlbum).toBeTruthy()
        expect((found.get("01A") || {}).inAlbum).toBeFalsy()
        expect(added.id).toEqual((found.get("01B") || {}).id)
    });


    it('do not glue repeatedly a spot', async () => {
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ albumId: "juan", stickerId: 3 })

        let found = await album.getStickers()
        expect(found.size).toEqual(1)
        expect(found.get("01C")).toBeDefined()
        const sticker0 = found.get("01C")
        let added = (sticker0 && await album.glueSticker(sticker0))
            || {} as Sticker.AlbumStiker
        expect(added.inAlbum).toBeTruthy()
        found = await album.getStickers()
        expect(found.size).toEqual(1)
        expect(found.get("01C")).toBeDefined()
        expect((found.get("01C") || {}).inAlbum).toBeTruthy()
        expect(added.id).toEqual((found.get("01C") || {}).id)
    });
});


describe('Reward', () => {

    var questionDefDAO: Question.QuestionDefDAO
    var stickerDAO: Sticker.StickerDAO
    var userStickerDAO: Sticker.UserStickerDAO
    var album: Sticker.Album
    var reward: Sticker.Reward
    let quiz: Question.Quiz
    let userAnswerDAO: Question.UserAnswerDAO

    let config: Game.GameConfig = {
        quizStrategy: Game.QuizStrategy.randomUnseen,
        rewardSchema: Game.RewardSchema.latency,
        rewardStrategy: Game.RewardStrategy.sequential,
        soloTokenStrategy: Game.PlayTokenStrategy.unlimited,
        coopTokenStrategy: Game.PlayTokenStrategy.unlimited,
        leaderTimeout: 100
    }

    beforeEach(() => {
        questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
        questionDefDAO.entrypoint=""
        stickerDAO = new Sticker.StickerDAO(stickersDB as Sticker.StickerDef[])
        stickerDAO.entrypoint = ""
        userStickerDAO = new Sticker.UserStickerDAO([])
        userStickerDAO.entrypoint = ""
        album = new Sticker.Album(stickerDAO, userStickerDAO)
        reward = new Sticker.Reward(config, album, stickerDAO)
        userAnswerDAO = new Question.UserAnswerDAO()
        userAnswerDAO.entrypoint = ""
    })

    it('no rewards when no answers', async () => {
        quiz = new Question.Quiz(config, userAnswerDAO, questionDefDAO, album)
        let rewards = await reward.produceStickers([])
        // "Waiting no rewards"
        expect(rewards.length).toEqual(0)
    });

    it('no rewards when all is wrong', async () => {
        quiz = new Question.Quiz(config, userAnswerDAO, questionDefDAO, album)
        let questions = await quiz.generate(3);
        for (const q of questions) {
            let wrong = q.options
                .map((_, idx) => q.solution.includes(idx) ? -1 : idx)
                .filter(i => i > 0)
            await quiz.putAnswer(q, wrong)
        }
        let rewards = await reward.produceStickers(quiz.getAnswers())
        // "Waiting no rewards"
        expect(rewards.length).toEqual(0)
    });


    it('reward by latency', async () => {
        quiz = new Question.Quiz(config, userAnswerDAO, questionDefDAO, album)
        let questions = await quiz.generate(3);
        let latencies = [1_000, 4_500, 5_500, 10_000].values()
        for (const q of questions) {
            await quiz.putAnswer(q, q.solution, latencies.next().value)
        }
        let expectedRewards = [5, 3, 2, 1].values()
        for (const a of quiz.getAnswers()) {
            let count = reward.stickerCountFor(a)
            // "Unexpected rewards"
            expect(count).toEqual(expectedRewards.next().value)
        }
    });


    it('reward by difficulty', async () => {
        quiz = new Question.Quiz(config, userAnswerDAO, questionDefDAO, album)
        let questions = await quiz.generate(6);
        let expected = []
        for (const q of questions) {
            await quiz.putAnswer(q, q.solution)
            if(q.difficulty <= 1.6) {
                expected.push(1);
            }
            else if(q.difficulty <= 2.1) {
                expected.push(2);
            }
            else {
                expected.push(3);
            }
        }
        let expectedRewards = expected.values()
        for (const a of quiz.getAnswers()) {
            let count = reward.stickerCountFor(a)
            //`Unexpected rewards for ${a.difficulty}`
            expect(count).toEqual(expectedRewards.next().value)
        }
    });


    it('max rewards on perfect quiz', async () => {
        quiz = new Question.Quiz(config, userAnswerDAO, questionDefDAO, album)
        let questions = await quiz.generate(3);
        for (const q of questions) {
            await quiz.putAnswer(q, q.solution, 1_000)
        }
        let expectedRewards = [5, 5, 5].values()
        for (const a of quiz.getAnswers()) {
            let count = reward.stickerCountFor(a)
            // "Unexpected rewards"
            expect(count).toEqual(expectedRewards.next().value)
        }
        let rewards = await reward.produceStickers(quiz.getAnswers())
        // "Waiting max rewards"
        expect(rewards.length).toEqual(15)
    });

    it('eventually fill the album', async () => {
        let maxIter = 100
        let filledPerc = 0
        while (filledPerc < 1 && maxIter--) {
            quiz = new Question.Quiz(config, userAnswerDAO, questionDefDAO, album)
            let questions = await quiz.generate(3);
            for (const q of questions) {
                const rndInt = Math.floor(Math.random() * q.options.length)
                await quiz.putAnswer(q, [rndInt], 15_000)
            }
            let rewards = await reward.produceStickers(quiz.getAnswers())
            // add the stickers to the user collection
            for (const r of rewards) {
                expect(r.id).toBeDefined()
                userStickerDAO.upsert({ albumId: "juan", stickerId: r.id || 0 })
            }
            // add the stickers to the album
            let newStickers = await album.getStickers()
            for (const s of newStickers.values()) {
                album.glueSticker(s)
            }
            let newFillPerc = await album.getAchievement()
            // "Should never decrease fill"
            expect(newFillPerc).toBeGreaterThanOrEqual(filledPerc)
            filledPerc = newFillPerc
        }
        // "Reached limit of iterations"
        expect(maxIter).toBeGreaterThan(0)
    });
});

describe('BusinessDayToken Tests', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-12-16T11:35:17Z').getTime());
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('Token is initially valid', () => {
        const token = new Game.BusinessDayToken(1, 1); // Monday, 1-day increment
        expect(token.isInvalid()).toBe(true);
    });

    test('Token expires after 24 hours', () => {
        const token = new Game.BusinessDayToken(1, 1);
        token.startDate -= 3 * 24 * 60 * 60 * 1000; // Set to 3d ago, Friday
        expect(token.validPeriod()).toBe('2024-12-13');
        expect(token.isInvalid()).toBe(false);
        expect(token.validPeriod()).toBe('2024-12-17');
    });

    test('Token moves to next business day after expiration', () => {
        const token = new Game.BusinessDayToken(4, 2); // Thrusday, 2-day increment
        token.startDate -= 7 * 24 * 60 * 60 * 1000; // Expired 1w ago
        token.isInvalid(); // This should trigger a move
        const newStartDate = new Date(token.startDate);
        expect(newStartDate.getDay()).not.toBe(0); // Not Sunday
        expect(newStartDate.getDay()).not.toBe(6); // Not Saturday
        expect(token.validPeriod()).toBe('2024-12-18');
    });

    test('Valid period returns correct date', () => {
        const token = new Game.BusinessDayToken(1, 1);
        const expectedDate = new Date(token.startDate).toISOString().split('T')[0];
        expect(token.validPeriod()).toBe(expectedDate);
    });

    test('Spend moves token to next business day', () => {
        const token = new Game.BusinessDayToken(1, 6);
        expect(token.validPeriod()).toBe('2024-12-16');
        const oldStartDate = token.startDate;
        token.spend();
        expect(token.startDate).not.toBe(oldStartDate);
        expect(token.validPeriod()).toBe('2024-12-24');
    });

    test('Token can be stored', () => {
        const token = new Game.BusinessDayToken(1, 6);
        expect(token.validPeriod()).toBe('2024-12-16');
        const toBeStored = {className: token.constructor.name, data: token}
        const stored = JSON.stringify(toBeStored);

        const restored = JSON.parse(stored);
        const newTok = new Game.BusinessDayToken();
        Object.assign(newTok, restored.className);
        expect(token.validPeriod()).toBe('2024-12-16');
        expect(token.startDate).toBe(1734325200000);
        expect(token.increment).toBe(6);
    });
});
