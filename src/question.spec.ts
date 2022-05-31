
import { assert } from 'chai'
import { Question } from "../src/question";
import * as questionDB from '../test/sampleQuestions.json';

describe('QuestionDefDAO', () => {

    var questionDefDAO: Question.QuestionDefDAO = null

    beforeEach(() => {
        questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
    })

    it('should return all', (done) => {
        questionDefDAO.findAll()
            .then((results) => assert.equal(results.length, 6))
            .then(done)
            .catch(done)
    });


    it('should return excluding', (done) => {
        questionDefDAO.findAll({
            exclude: [1, 5]
        })
            .then((results) => {
                assert.equal(results.length, 4)
                assert.isFalse(results.some(q => [1, 5].includes(q.id)))
            })
            .then(done)
            .catch(done)
    });


    it('should return including', (done) => {
        questionDefDAO.findAll({
            include: [1, 5]
        })
            .then((results) => {
                assert.equal(results.length, 2)
                assert.ok(results.every(q => [1, 5].includes(q.id)))
            })
            .then(done)
            .catch(done)
    });


    it('should return sorted', (done) => {
        questionDefDAO.findAll({
            order: "-difficulty"
        })
            .then((results) => {
                assert.equal(results.length, 6)
                assert.equal(results[0].difficulty, 0.8)
            })
            .then(done)
            .catch(done)
    });


    it('should return limited', (done) => {
        questionDefDAO.findAll({
            limit: 3
        })
            .then((results) => {
                assert.equal(results.length, 3)
            })
            .then(done)
            .catch(done)
    });
});


describe('UserAnswerDAO', () => {
    var userAnswerDAO: Question.UserAnswerDAO = null

    beforeEach(function() {
        userAnswerDAO = new Question.UserAnswerDAO()
        userAnswerDAO.put({ userId: "juan", questionId: 1, success: true })
        userAnswerDAO.put({ userId: "juan", questionId: 2, success: false })
        userAnswerDAO.put({ userId: "juan", questionId: 5, success: true })
        userAnswerDAO.put({ userId: "juan", questionId: 3, success: false })
        userAnswerDAO.put({ userId: "juan", questionId: 4, success: true })
    });


    it('should return all', (done) => {
        userAnswerDAO.findAll()
            .then((results) => {
                assert.equal(results.length, 5);
            })
            .then(done)
            .catch(done)
    });


    it('should return put', (done) => {
        userAnswerDAO.put({ userId: "juan", questionId: 9, success: true })
            .then((result) => {
                assert.equal(result.questionId, 9)
                assert.equal(result.id, 6)
            })
            .then(done)
            .catch(done)
    });


    it('should update on put', async () => {
        let added = await userAnswerDAO.put({ userId: "juan", questionId: 3, success: false, latency: 12_000 })
        assert.equal(added.id, 4)
        assert.equal(added.attempts, 2, "Unexpected attempts")
        assert.equal(added.latency, 12_000, "Unexpected latency")
        assert.isFalse(added.success)
        added = await userAnswerDAO.put({ userId: "juan", questionId: 3, success: true, latency: 22_000 })
        assert.equal(added.id, 4)
        assert.equal(added.attempts, 3, "Expecting attempts")
        assert.equal(added.latency, 14_500, "Unexpected latency")
        assert.isTrue(added.success)
    });


    it('should return excluding', (done) => {
        userAnswerDAO.findAll({
            exclude: [1, 5]
        })
            .then((results) => {
                assert.equal(results.length, 3)
                assert.ok(!results.some(q => [1, 5].includes(q.id)))
            })
            .then(done)
            .catch(done)
    });


    it('should return including', (done) => {
        userAnswerDAO.findAll({
            include: [1, 5]
        })
            .then((results) => {
                assert.equal(results.length, 2)
                assert.ok(results.every(q => [1, 5].includes(q.id)))
            })
            .then(done)
            .catch(done)
    });


    it('should return sorted', (done) => {
        userAnswerDAO.findAll({
            order: "-questionId"
        })
            .then((results) => {
                assert.equal(results.length, 5)
                assert.equal(results[0].questionId, 5)
            })
            .then(done)
            .catch(done)
    });


    it('should return sorted by 2', (done) => {
        userAnswerDAO.findAll({
            order: ["+success", "-questionId"]
        })
            .then((results) => {
                assert.equal(results.length, 5)
                assert.equal(results[0].success, false)
                assert.equal(results[0].questionId, 3)
            })
            .then(done)
            .catch(done)
    });
});

describe('Quiz', () => {

    var questionDefDAO: Question.QuestionDefDAO
    var userAnswerDAO: Question.UserAnswerDAO = null
    let quiz: Question.Quiz


    beforeEach(() => {
        questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
        userAnswerDAO = new Question.UserAnswerDAO()
        quiz = new Question.Quiz(userAnswerDAO, questionDefDAO, "juan")
    })


    it('should return even without answers', (done) => {
        quiz.generate(3)
            .then((questions) => {
                assert.equal(questions.length, 3)
                assert.equal(questions[0].difficulty, 0.1, "Expecting easier first")
                assert.equal(questions[1].difficulty, 0.25, "Expecting difficulty order")
                assert.equal(questions[2].difficulty, 0.5, "Expecting difficulty order")
            })
            .then(done)
            .catch(done)
    });


    it('should return unseen', async () => {
        let questionCount = 3
        let questions = await quiz.generate(questionCount);

        let firstQuiz = questions.map(q => q.id)
        assert.equal(questions.length, questionCount)
        assert.isAbove(questions.reduce((maxDifficulty, curQ) => curQ.difficulty >= maxDifficulty ? curQ.difficulty : -100, 0), 0,
            `Not in difficulty order ${questions.map(q => q.difficulty)}`)
        for (const q of questions) {
            const rndInt = Math.floor(Math.random() * q.options.length)
            await quiz.putAnswer(q, [rndInt])
        }

        questions = await quiz.generate(questionCount);
        let secondQuiz = questions.map(q => q.id)
        assert.isFalse(firstQuiz.some(q => secondQuiz.includes(q)), `Returned some repeated questions ${firstQuiz} >> ${secondQuiz}`)
        assert.equal(questions.length, questionCount, `Didn't gave full quiz ${questions.map(q => q.id)}`)
        assert.equal(questions[0].difficulty, 0.7, "Expecting easier unseen first")
    });


    it('should return unseen and seen', async () => {
        let questionCount = 4
        let questions: Question.QuestionDef[] = await quiz.generate(questionCount);

        let firstQuiz = questions.map(q => q.id)
        assert.equal(questions.length, questionCount)
        assert.isAbove(questions.reduce((maxDifficulty, curQ) => curQ.difficulty >= maxDifficulty ? curQ.difficulty : -100, 0), 0,
            `Not in difficulty order ${questions.map(q => q.difficulty)}`)
        for (const q of questions) {
            const rndInt = Math.floor(Math.random() * q.options.length)
            await quiz.putAnswer(q, [rndInt])
        }
        questions = await quiz.generate(questionCount);
        let secondQuiz = questions.map(q => q.id)
        let repeated = firstQuiz.filter(value => secondQuiz.includes(value));
        assert.equal(repeated.length, 2, `Expecting 2 repeated questions ${firstQuiz} >> ${secondQuiz}`)
        assert.equal(questions.length, questionCount, `Didn't gave full quiz ${questions.map(q => q.id)}`)
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
