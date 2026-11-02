import { statsOf, statsByQuestion, sampleBeta, pickToReview, QuestionStats } from './questionPicker'

// A small deterministic generator, so the tests do not depend on luck
function seeded(seed: number) {
    return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

describe('statsOf', () => {
    it('counts the last result and the earlier attempts as failures', () => {
        expect(statsOf({ attempts: 1, success: true })).toEqual({ successes: 1, failures: 0 })
        expect(statsOf({ attempts: 3, success: true })).toEqual({ successes: 1, failures: 2 })
        expect(statsOf({ attempts: 2, success: false })).toEqual({ successes: 0, failures: 2 })
    })

    it('reads the 1/0 the API returns for a tinyint, not only booleans', () => {
        expect(statsOf({ attempts: 1, success: 1 })).toEqual({ successes: 1, failures: 0 })
        expect(statsOf({ attempts: 2, success: 0 })).toEqual({ successes: 0, failures: 2 })
    })

    it('counts a timeout (null) and a missing result as failures', () => {
        expect(statsOf({ attempts: 1, success: null })).toEqual({ successes: 0, failures: 1 })
        expect(statsOf({})).toEqual({ successes: 0, failures: 1 })
    })

    it('indexes by question', () => {
        const stats = statsByQuestion([{ questionId: 4, attempts: 1, success: true }, { questionId: 9, attempts: 2, success: false }])
        expect(stats.get(4)).toEqual({ successes: 1, failures: 0 })
        expect(stats.get(9)).toEqual({ successes: 0, failures: 2 })
    })
})

describe('sampleBeta', () => {
    it('is Beta(a, b): its mean is a / (a + b), and it stays inside (0, 1)', () => {
        const random = seeded(1)
        for (const [a, b] of [[1, 1], [1, 3], [3, 1], [2, 2]]) {
            const draws = Array.from({ length: 20000 }, () => sampleBeta(a, b, random))
            const mean = draws.reduce((x, y) => x + y, 0) / draws.length
            expect(mean).toBeCloseTo(a / (a + b), 1)
            expect(Math.min(...draws)).toBeGreaterThanOrEqual(0)
            expect(Math.max(...draws)).toBeLessThanOrEqual(1)
        }
    })
})

describe('pickToReview', () => {
    const questions = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
    const stats = new Map<number, QuestionStats>([
        [1, { successes: 0, failures: 3 }], // failed three times
        [2, { successes: 0, failures: 1 }], // failed once
        [3, { successes: 1, failures: 0 }], // right once
        [4, { successes: 2, failures: 0 }], // right twice
    ])

    function shares(recent: number[] = []) {
        const random = seeded(42)
        const count: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
        const draws = 20000
        for (let i = 0; i < draws; i++) count[pickToReview(questions, stats, recent, random)!.id!]++
        return Object.fromEntries(Object.entries(count).map(([id, n]) => [id, n / draws]))
    }

    it('comes out the most failed one most of the time, but not always', () => {
        const s = shares()
        expect(s[1]).toBeGreaterThan(0.6)
        expect(s[1]).toBeLessThan(0.85)
        expect(s[1]).toBeGreaterThan(s[2])
        expect(s[2]).toBeGreaterThan(s[3])
        expect(s[3]).toBeGreaterThan(s[4])
    })

    it('almost never repeats what was answered correctly', () => {
        const s = shares()
        expect(s[3] + s[4]).toBeLessThan(0.02)
    })

    it('leaves out the questions asked last', () => {
        const s = shares([1])
        expect(s[1]).toBe(0)
        expect(s[2]).toBeGreaterThan(0.9)
    })

    it('brings them back when everything was asked recently', () => {
        expect(pickToReview(questions, stats, [1, 2, 3, 4], seeded(5))).toBeDefined()
    })

    it('has nothing to pick from an empty pool', () => {
        expect(pickToReview([], stats)).toBeUndefined()
    })
})
