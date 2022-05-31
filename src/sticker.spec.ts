
import { assert } from 'chai'
import { Question } from "../src/question";
import { Sticker } from "../src/sticker";
import * as questionDB from '../test/sampleQuestions.json';
import * as stickersDB from '../test/sampleStickers.json';

describe('UserStickerDAO', () => {

    var userStickerDAO: Sticker.UserStickerDAO = null


    beforeEach(() => {
        userStickerDAO = new Sticker.UserStickerDAO([])
    })


    it('should upsert', async () => {
        let sticker = await userStickerDAO.upsert({
            userId: "juan",
            stickerId: 1,
        })
        assert.exists(sticker.id)
        assert.isFalse(sticker.inAlbum, "inAlbum must have default")
        assert.exists(sticker.addedOn)
        let curId = sticker.id
        sticker.inAlbum = true
        sticker = await userStickerDAO.upsert(sticker)
        assert.equal(sticker.id, curId)
        assert.isTrue(sticker.inAlbum, "inAlbum must be updated")
    });
});

describe('Album', () => {

    var userStickerDAO: Sticker.UserStickerDAO = null
    var album: Sticker.Album = null


    beforeEach(() => {
        let stickerDAO = new Sticker.StickerDAO(stickersDB as Sticker.StickerDef[])
        userStickerDAO = new Sticker.UserStickerDAO([])
        album = new Sticker.Album(stickerDAO, userStickerDAO, "juan")
    })


    it('get all available spots', async () => {
        userStickerDAO.upsert({ userId: "juan", stickerId: 1 })
        userStickerDAO.upsert({ userId: "juan", stickerId: 2 })
        userStickerDAO.upsert({ userId: "juan", stickerId: 3 })
        let found = await album.getStickers()
        assert.equal(found.size, 3)
        assert.equal(await album.getAchievement(), 0)
        assert.approximately(await album.getAchievement(true), 0.333, 0.001)
    });


    it('get all available spots even with repeated stickers', async () => {
        userStickerDAO.upsert({ userId: "juan", stickerId: 1 })
        userStickerDAO.upsert({ userId: "juan", stickerId: 2 })
        userStickerDAO.upsert({ userId: "juan", stickerId: 3 })
        userStickerDAO.upsert({ userId: "juan", stickerId: 2 })
        userStickerDAO.upsert({ userId: "juan", stickerId: 3 })
        let found = await album.getStickers()
        assert.equal(found.size, 3)
        assert.equal(await album.getAchievement(), 0)
        assert.approximately(await album.getAchievement(true), 0.333, 0.001)
    });


    it('allow to add stickers', async () => {
        await userStickerDAO.upsert({ userId: "juan", stickerId: 1 })
        await userStickerDAO.upsert({ userId: "juan", stickerId: 2 })
        await userStickerDAO.upsert({ userId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ userId: "juan", stickerId: 2 })
        await userStickerDAO.upsert({ userId: "juan", stickerId: 3 })

        let found = await album.getStickers()
        assert.equal(found.size, 3)
        let added = await album.glueSticker(found.get("01B"))
        assert.isTrue(added.inAlbum)
        found = await album.getStickers()
        assert.equal(found.size, 3)
        assert.exists(found.get("01B"))
        assert.isTrue(found.get("01B").inAlbum)
        assert.isFalse(found.get("01A").inAlbum)
        assert.equal(added.id, found.get("01B").id)
    });


    it('do not glue repeatedly a spot', async () => {
        await userStickerDAO.upsert({ userId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ userId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ userId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ userId: "juan", stickerId: 3 })
        await userStickerDAO.upsert({ userId: "juan", stickerId: 3 })

        let found = await album.getStickers()
        assert.equal(found.size, 1)
        let added = await album.glueSticker(found.get("01C"))
        assert.isTrue(added.inAlbum)
        found = await album.getStickers()
        assert.equal(found.size, 1)
        assert.exists(found.get("01C"))
        assert.isTrue(found.get("01C").inAlbum)
        assert.equal(added.id, found.get("01C").id)
    });
});


describe('Reward', () => {

    var questionDefDAO: Question.QuestionDefDAO = null
    var stickerDAO: Sticker.StickerDAO
    var userStickerDAO: Sticker.UserStickerDAO = null
    var album: Sticker.Album = null
    var reward: Sticker.Reward = null
    let quiz: Question.Quiz
    let userAnswerDAO: Question.UserAnswerDAO


    beforeEach(() => {
        questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
        stickerDAO = new Sticker.StickerDAO(stickersDB as Sticker.StickerDef[])
        userStickerDAO = new Sticker.UserStickerDAO([])
        album = new Sticker.Album(stickerDAO, userStickerDAO, "juan")
        reward = new Sticker.Reward(album, stickerDAO)
        userAnswerDAO = new Question.UserAnswerDAO()
    })

    it('no rewards when no answers', async () => {
        quiz = new Question.Quiz(userAnswerDAO, questionDefDAO, "juan")
        await quiz.generate(3);
        let rewards = await reward.produceStickers(quiz)
        assert.equal(rewards.length, 0, "Waiting no rewards")
    });

    it('no rewards when all is wrong', async () => {
        quiz = new Question.Quiz(userAnswerDAO, questionDefDAO, "juan")
        let questions = await quiz.generate(3);
        for (const q of questions) {
            let wrong = q.options
                .map((_, idx) => q.solution.includes(idx) ? -1 : idx)
                .filter(i => i > 0)
            await quiz.putAnswer(q, wrong)
        }
        let rewards = await reward.produceStickers(quiz)
        assert.equal(rewards.length, 0, "Waiting no rewards")
    });


    it('reward by latency', async () => {
        quiz = new Question.Quiz(userAnswerDAO, questionDefDAO, "juan")
        let questions = await quiz.generate(3);
        let latencies = [1_000, 4_500, 5_500, 10_000].values()
        for (const q of questions) {
            await quiz.putAnswer(q, q.solution, latencies.next().value)
        }
        let expectedRewards = [5, 3, 2, 1].values()
        for (const a of quiz.getAnswers()) {
            let count = reward.stickerCountFor(a)
            assert.equal(count, expectedRewards.next().value, "Unexpected rewards")
        }
    });


    it('reward by difficulty', async () => {
        quiz = new Question.Quiz(userAnswerDAO, questionDefDAO, "juan")
        let questions = await quiz.generate(6);
        // 0.5, 1], [0.7, 2], [0.8, 3], [0.9, 5
        for (const q of questions) {
            await quiz.putAnswer(q, q.solution)
        }
        let expectedRewards = [1, 1, 2, 3, 3, 3].values()
        for (const a of quiz.getAnswers()) {
            let count = reward.stickerCountFor(a)
            assert.equal(count, expectedRewards.next().value, `Unexpected rewards for ${a.difficulty}`)
        }
    });


    it('max rewards on perfect quiz', async () => {
        quiz = new Question.Quiz(userAnswerDAO, questionDefDAO, "juan")
        let questions = await quiz.generate(3);
        for (const q of questions) {
            await quiz.putAnswer(q, q.solution, 1_000)
        }
        let expectedRewards = [5, 5, 5].values()
        for (const a of quiz.getAnswers()) {
            let count = reward.stickerCountFor(a)
            assert.equal(count, expectedRewards.next().value, "Unexpected rewards")
        }
        let rewards = await reward.produceStickers(quiz)
        assert.equal(rewards.length, 15, "Waiting max rewards")
    });

    it('eventually fill the album', async () => {
        let maxIter = 100
        let filledPerc = 0
        while (filledPerc < 1 && maxIter--) {
            quiz = new Question.Quiz(userAnswerDAO, questionDefDAO, "juan")
            let questions = await quiz.generate(3);
            for (const q of questions) {
                const rndInt = Math.floor(Math.random() * q.options.length)
                await quiz.putAnswer(q, [rndInt], 15_000)
            }
            let rewards = await reward.produceStickers(quiz)
            // add the stickers to the user collection
            for (const r of rewards) {
                userStickerDAO.upsert({ userId: "juan", stickerId: r.id })
            }
            // add the stickers to the album
            let newStickers = await album.getStickers()
            for (const s of newStickers.values()) {
                album.glueSticker(s)
            }
            let newFillPerc = await album.getAchievement()
            assert.isAtLeast(newFillPerc, filledPerc, "Should never decrease fill")
            filledPerc = newFillPerc
        }
        assert.isAbove(maxIter, 0, "Reached limit of iterations")
        console.log(`attempts ${100 - maxIter}`)
    });
});
