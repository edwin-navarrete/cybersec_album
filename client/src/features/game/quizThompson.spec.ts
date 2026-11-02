import axios from 'axios'
// sticker and question import each other: sticker has to load first (it is only a type here)
import './sticker'
import { Game, Sticker } from './sticker'
import { Question } from './question'
import config from './gameConfig.json'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function seeded(seed: number) {
    return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const defs = (n: number): Question.QuestionDef[] => Array.from({ length: n }, (_, i) => ({
    id: i + 1, type: 'single', question: `question ${i + 1}`, options: ['a', 'b', 'c'], solution: [0], difficulty: 1
})) as Question.QuestionDef[]

// success arrives from the API as 1/0 (a tinyint), not as a boolean
type Played = { questionId: number, attempts?: number, success?: boolean | number | null }

function newQuiz(total: number, played: Played[], random = seeded(3)) {
    mockedAxios.get.mockRejectedValue(new Error('offline')) // the questions come from memory
    const answers = played.map(a => ({ albumId: 'album', ...a }))
    const userAnswerDAO = { findAll: async () => answers } as unknown as Question.UserAnswerDAO
    const album = { getAlbumId: async () => 'album' } as unknown as Sticker.Album
    return new Question.Quiz(config as Game.GameConfig, userAnswerDAO, new Question.QuestionDefDAO(defs(total)), album, random)
}

async function ask(quiz: Question.Quiz, times: number) {
    const ids: number[] = []
    for (let i = 0; i < times; i++) ids.push((await quiz.generate(1))[0].id!)
    return ids
}

beforeEach(() => {
    localStorage.clear()
    jest.spyOn(console, 'error').mockImplementation(() => { })
})

describe('the default strategy', () => {
    it('is Thompson sampling', () => {
        expect(config.quizStrategy).toBe('thompson')
    })
})

describe('Quiz.generate with Thompson sampling', () => {
    it('asks the questions never seen first, and only those while there are any', async () => {
        const quiz = newQuiz(6, [{ questionId: 1, success: true }, { questionId: 2, success: false }, { questionId: 3, success: true }])

        // 4, 5 and 6 were never answered: nothing already seen comes before them
        const asked = await ask(quiz, 60)

        expect(asked.every(id => [4, 5, 6].includes(id))).toBe(true)
        expect(new Set(asked)).toEqual(new Set([4, 5, 6])) // and all of them show up
    })

    it('after seeing all of them, brings back what was failed far more than what was right', async () => {
        // a player who fails a lot: 2, 5 and 7 failed; the rest right
        const played: Played[] = Array.from({ length: 8 }, (_, i) => ({ questionId: i + 1, attempts: 1, success: [2, 5, 7].includes(i + 1) ? 0 : 1 }))
        const quiz = newQuiz(8, played)

        const asked = await ask(quiz, 300)

        const failed = asked.filter(id => [2, 5, 7].includes(id)).length
        expect(failed / asked.length).toBeGreaterThan(0.9)
        // the three failed ones all come out, none is left behind
        expect(new Set(asked.filter(id => [2, 5, 7].includes(id))).size).toBe(3)
    })

    it('never repeats a question right away, so the most failed one does not come again and again', async () => {
        const played: Played[] = Array.from({ length: 6 }, (_, i) => ({ questionId: i + 1, attempts: i === 0 ? 4 : 1, success: i !== 0 && i !== 1 ? 1 : 0 }))
        const quiz = newQuiz(6, played)

        const asked = await ask(quiz, 200)

        for (let i = 1; i < asked.length; i++) expect(asked[i]).not.toBe(asked[i - 1])
        // not even every other time: the last two asked are left out
        for (let i = 2; i < asked.length; i++) expect(asked[i]).not.toBe(asked[i - 2])
        // and the one failed 4 times is still the most frequent
        const count = (id: number) => asked.filter(x => x === id).length
        expect(count(1)).toBeGreaterThan(count(3))
    })

    it('does not fail with a single question left to review', async () => {
        const quiz = newQuiz(1, [{ questionId: 1, success: false }])

        expect(await ask(quiz, 3)).toEqual([1, 1, 1])
    })

    it('returns the questions with their options shuffled but the solution kept', async () => {
        const quiz = newQuiz(3, [])

        const [question] = await quiz.generate(1)

        expect(question.options[question.solution[0]]).toBe('a') // the right option is still 'a'
    })
})
