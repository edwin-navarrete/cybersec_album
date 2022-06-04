
import { Question } from "./question";
import questionDB from './test/sampleQuestions.json';

describe('QuestionDefDAO', () => {

    var questionDefDAO: Question.QuestionDefDAO

    beforeEach(() => {
        questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
    })

    it('should return all', (done) => {
        questionDefDAO.findAll()
            .then((results) => expect(results.length).toEqual(6))
            .then(done)
            .catch(done)
    });


    it('should return excluding', (done) => {
        questionDefDAO.findAll({
            exclude: [1, 5]
        })
            .then((results) => {
                expect(results.length).toEqual(4)
                expect(results.some(q => q.id && [1, 5].includes(q.id))).toBeFalsy()
            })
            .then(done)
            .catch(done)
    });


    it('should return including', (done) => {
        questionDefDAO.findAll({
            include: [1, 5]
        })
            .then((results) => {
                expect(results.length).toEqual(2)
                expect(results.every(q => q.id && [1, 5].includes(q.id))).toBeTruthy()
            })
            .then(done)
            .catch(done)
    });


    it('should return sorted', (done) => {
        questionDefDAO.findAll({
            order: "-difficulty"
        })
            .then((results) => {
                expect(results.length).toEqual(6)
                expect(results[0].difficulty).toEqual(0.8)
            })
            .then(done)
            .catch(done)
    });


    it('should return limited', (done) => {
        questionDefDAO.findAll({
            limit: 3
        })
            .then((results) => {
                expect(results.length).toEqual(3)
            })
            .then(done)
            .catch(done)
    });
});


describe('UserAnswerDAO', () => {
    var userAnswerDAO: Question.UserAnswerDAO

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
                expect(results.length).toEqual(5);
            })
            .then(done)
            .catch(done)
    });


    it('should return put', (done) => {
        userAnswerDAO.put({ userId: "juan", questionId: 9, success: true })
            .then((result) => {
                expect(result.questionId).toEqual(9)
                expect(result.id).toEqual(6)
            })
            .then(done)
            .catch(done)
    });


    it('should update on put', async () => {
        let added = await userAnswerDAO.put({ userId: "juan", questionId: 3, success: false, latency: 12_000 })
        expect(added.id).toEqual(4)
        // "Unexpected attempts"
        expect(added.attempts).toEqual(2)
        // "Unexpected latency"
        expect(added.latency).toEqual(12_000)
        expect(added.success).toBeFalsy()
        added = await userAnswerDAO.put({ userId: "juan", questionId: 3, success: true, latency: 22_000 })
        expect(added.id).toEqual(4)
        // "Expecting attempts"
        expect(added.attempts).toEqual(3)
        //  "Unexpected latency"
        expect(added.latency).toEqual(14_500)
        expect(added.success).toBeTruthy()
    });


    it('should return excluding', (done) => {
        userAnswerDAO.findAll({
            exclude: [1, 5]
        })
            .then((results) => {
                expect(results.length).toEqual(3)
                expect(results.some(q => q.id && [1, 5].includes(q.id))).toBeFalsy()
            })
            .then(done)
            .catch(done)
    });


    it('should return including', (done) => {
        userAnswerDAO.findAll({
            include: [1, 5]
        })
            .then((results) => {
                expect(results.length).toEqual(2)
                expect(results.every(q => q.id && [1, 5].includes(q.id))).toBeTruthy()
            })
            .then(done)
            .catch(done)
    });


    it('should return sorted', (done) => {
        userAnswerDAO.findAll({
            order: "-questionId"
        })
            .then((results) => {
                expect(results.length).toEqual(5)
                expect(results[0].questionId).toEqual(5)
            })
            .then(done)
            .catch(done)
    });


    it('should return sorted by 2', (done) => {
        userAnswerDAO.findAll({
            order: ["+success", "-questionId"]
        })
            .then((results) => {
                expect(results.length).toEqual(5)
                expect(results[0].success).toEqual(false)
                expect(results[0].questionId).toEqual(3)
            })
            .then(done)
            .catch(done)
    });
});

describe('Quiz', () => {

    var questionDefDAO: Question.QuestionDefDAO
    var userAnswerDAO: Question.UserAnswerDAO
    let quiz: Question.Quiz


    beforeEach(() => {
        questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
        userAnswerDAO = new Question.UserAnswerDAO()
        quiz = new Question.Quiz(userAnswerDAO, questionDefDAO, "juan")
    })


    it('should return even without answers', (done) => {
        quiz.generate(3)
            .then((questions) => {
                expect(questions.length).toEqual(3)
                // "Expecting easier first"
                expect(questions[0].difficulty).toEqual(0.1)
                // "Expecting difficulty order"
                expect(questions[1].difficulty).toEqual(0.25)
                expect(questions[2].difficulty).toEqual(0.5)
            })
            .then(done)
            .catch(done)
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
