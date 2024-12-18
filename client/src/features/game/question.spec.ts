
import { Question } from "./question";
import { Game, Sticker } from "./sticker";
import questionDB from './test/sampleQuestions.json';
import axios from 'axios'

// Mock de Axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('QuestionDefDAO', () => {

    var questionDefDAO: Question.QuestionDefDAO

    beforeEach(() => {
        questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
        questionDefDAO.entrypoint = ""
        mockedAxios.post.mockClear()
    })

    it('should return all',  async () => {
        const results = await questionDefDAO.findAll();
        expect(results.length).toEqual(6);
    });


    it('should return excluding',  async () => {
        const results = await questionDefDAO.findAll({
            exclude: [1, 5]
        });
        expect(results.length).toEqual(4)
        expect(results.some(q => q.id && [1, 5].includes(q.id))).toBeFalsy()
    });


    it('should return including',  async () => {
        const results = await questionDefDAO.findAll({
            include: [1, 5]
        });
        expect(results.length).toEqual(2);
        expect(results.every(q => q.id && [1, 5].includes(q.id))).toBeTruthy();
    });


    it('should return sorted',  async () => {
        const results = await questionDefDAO.findAll({
            order: "-difficulty"
        });
        expect(results.length).toEqual(6);
        expect(results[0].difficulty).toEqual(0.8);
    });


    it('should return limited',  async () => {
        const results = await questionDefDAO.findAll({
            limit: 3
        });
        expect(results.length).toEqual(3)
    });
});


describe('UserAnswerDAO', () => {
    var userAnswerDAO: Question.UserAnswerDAO

    beforeEach(function() {
        userAnswerDAO = new Question.UserAnswerDAO()
        userAnswerDAO.entrypoint = ""
        userAnswerDAO.put({ albumId: "juan", questionId: 1, success: true })
        userAnswerDAO.put({ albumId: "juan", questionId: 2, success: false })
        userAnswerDAO.put({ albumId: "juan", questionId: 5, success: true })
        userAnswerDAO.put({ albumId: "juan", questionId: 3, success: false })
        userAnswerDAO.put({ albumId: "juan", questionId: 4, success: true })
    });


    it('should return all', async () => {
        const results = await userAnswerDAO.findAll();
        expect(results.length).toEqual(5);
    });


    it('should return put', async () => {
        const result = await userAnswerDAO.put({ albumId: "juan", questionId: 9, success: true })
        expect(result.questionId).toEqual(9);
        expect(result.id).toEqual(6);
    });


    it('should update on put', async () => {
        let added = await userAnswerDAO.put({ albumId: "juan", questionId: 3, success: false, latency: 12_000 })
        expect(added.id).toEqual(4)
        // "Unexpected attempts"
        expect(added.attempts).toEqual(2)
        // "Unexpected latency"
        expect(added.latency).toEqual(12_000)
        expect(added.success).toBeFalsy()
        added = await userAnswerDAO.put({ albumId: "juan", questionId: 3, success: true, latency: 22_000 })
        expect(added.id).toEqual(4)
        // "Expecting attempts"
        expect(added.attempts).toEqual(3)
        //  "Unexpected latency"
        expect(added.latency).toEqual(14_500)
        expect(added.success).toBeTruthy()
    });


    it('should return excluding', async () => {
        const results = await userAnswerDAO.findAll({
            exclude: [1, 5]
        });
        expect(results.length).toEqual(3)
        expect(results.some(q => q.id && [1, 5].includes(q.id))).toBeFalsy()
    });


    it('should return including', async () => {
        const results = await userAnswerDAO.findAll({
            include: [1, 5]
        });
        expect(results.length).toEqual(2);
        expect(results.every(q => q.id && [1, 5].includes(q.id))).toBeTruthy();
    });


    it('should return sorted', async () => {
        const results = await userAnswerDAO.findAll({
            order: "-questionId"
        })
        expect(results.length).toEqual(5)
        expect(results[0].questionId).toEqual(5)
    });


    it('should return sorted by 2', async () => {
        const results = await userAnswerDAO.findAll({
            order: ["+success", "-questionId"]
        });
        expect(results.length).toEqual(5)
        expect(results[0].success).toEqual(false)
        expect(results[0].questionId).toEqual(3)
    });
});

describe('Quiz', () => {

    var questionDefDAO: Question.QuestionDefDAO
    var userAnswerDAO: Question.UserAnswerDAO
    let quiz: Question.Quiz


    beforeEach(() => {
        questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
        questionDefDAO.entrypoint = ""
        userAnswerDAO = new Question.UserAnswerDAO()
        userAnswerDAO.entrypoint = ""
        let config: Game.GameConfig = {
            quizStrategy: Game.QuizStrategy.easiestUnseen,
            rewardSchema: Game.RewardSchema.latency,
            rewardStrategy: Game.RewardStrategy.sequential,
            soloTokenStrategy: Game.PlayTokenStrategy.unlimited,
            coopTokenStrategy: Game.PlayTokenStrategy.unlimited,
            leaderTimeout: 100
        }
        const album: Sticker.Album = {
            stickerDAO: {
                db: [],
                loaded: false,
                entrypoint: "",
                inMemFindAll: jest.fn(),
                findAll: jest.fn(),
                push: jest.fn()
            },
            getAlbumId: jest.fn().mockReturnValue("123abc"),
            getStickers: jest.fn(),
            ownStickers: jest.fn(),
            registerPlayer: jest.fn(),
            glueSticker: jest.fn(),
            getAchievement: jest.fn(),
            userStickerDAO: {
                upsert: function (sticker: Sticker.UserSticker): Promise<Sticker.UserSticker> {
                    throw new Error("Function not implemented.");
                },
                db: [],
                loaded: false,
                entrypoint: "",
                inMemFindAll: jest.fn(),
                findAll: jest.fn(),
                push: jest.fn(),
            }
        }
        quiz = new Question.Quiz(config, userAnswerDAO, questionDefDAO, album)
    })


    it('should return even without answers', async () => {
        const questions = await quiz.generate(3);
        expect(questions.length).toEqual(3)
        // "Expecting easier first"
        expect(questions[0].difficulty).toEqual(0.1)
        expect(questions[1].difficulty).toEqual(0.25)
        expect(questions[2].difficulty).toEqual(0.5)
    });


    it('should return unseen', async () => {
        let questionCount = 3
        let questions = await quiz.generate(questionCount);

        let firstQuiz = questions.map(q => q.id)
        expect(questions.length).toEqual(questionCount)
        // ,`Not in difficulty order ${questions.map(q => q.difficulty)}`
        expect(questions.reduce((maxDifficulty, curQ) => curQ.difficulty >= maxDifficulty ? curQ.difficulty : -100, 0))
            .toBeGreaterThan(0)
        for (const q of questions) {
            const rndInt = Math.floor(Math.random() * q.options.length)
            await quiz.putAnswer(q, [rndInt])
        }

        questions = await quiz.generate(questionCount);
        let secondQuiz = questions.map(q => q.id)
        // `Returned some repeated questions ${firstQuiz} >> ${secondQuiz}`
        expect(firstQuiz.some(q => secondQuiz.includes(q))).toBeFalsy()
        //  `Didn't gave full quiz ${questions.map(q => q.id)}`
        expect(questions.length).toEqual(questionCount)
        // "Expecting easier unseen first"
        expect(questions[0].difficulty).toEqual(0.7)
    });


    it('should return unseen and seen', async () => {
        let questionCount = 4
        let questions: Question.QuestionDef[] = await quiz.generate(questionCount);

        let firstQuiz = questions.map(q => q.id)
        expect(questions.length).toEqual(questionCount)
        // `Not in difficulty order ${questions.map(q => q.difficulty)}`
        expect(questions.reduce((maxDifficulty, curQ) => curQ.difficulty >= maxDifficulty ? curQ.difficulty : -100, 0))
            .toBeGreaterThan(0)
        for (const q of questions) {
            const rndInt = Math.floor(Math.random() * q.options.length)
            await quiz.putAnswer(q, [rndInt])
        }
        questions = await quiz.generate(questionCount);
        let secondQuiz = questions.map(q => q.id)
        let repeated = firstQuiz.filter(value => secondQuiz.includes(value));
        // `Expecting 2 repeated questions ${firstQuiz} >> ${secondQuiz}`
        expect(repeated.length).toEqual(2)
        // `Didn't gave full quiz ${questions.map(q => q.id)}`
        expect(questions.length).toEqual(questionCount)
    });


    it('should eventually give all questions', async () => {
        let questionCount = 3
        let uniqQuestions = new Set()
        while (uniqQuestions.size < questionDB.length) {
            let questions: Question.QuestionDef[] = await quiz.generate(questionCount);

            for (const q of questions) {
                uniqQuestions.add(q.id)
                const rndInt = Math.floor(Math.random() * q.options.length)
                await quiz.putAnswer(q, [rndInt])
            }
        }
    })
});
