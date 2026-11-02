import { countWords, readingSeconds, thinkingSeconds, timeLimitFor, netLatencyMs, MIN_LATENCY_MS } from './questionTime'

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ')
const question = (overrides: Partial<{ question: string, options: string[], solution: number[], difficulty: number }> = {}) =>
    ({ question: words(6), options: [words(3), words(3), words(3)], solution: [0], difficulty: 1, ...overrides })

describe('reading time', () => {
    it('counts the words of the question and of every option', () => {
        expect(countWords('  una   pregunta, con espacios ')).toBe(4)
        expect(countWords('')).toBe(0)
        expect(readingSeconds(question())).toBe(5) // 15 words at 3 per second
    })

    it('grows with the length of the text, not with the difficulty', () => {
        expect(readingSeconds(question({ options: [words(30), words(30)] }))).toBeGreaterThan(readingSeconds(question()))
        expect(readingSeconds(question({ difficulty: 3 }))).toBe(readingSeconds(question({ difficulty: 0.5 })))
    })

    it('rounds up, so a part of a second is a second', () => {
        expect(readingSeconds(question({ question: words(1), options: [] }))).toBe(1)
    })
})

describe('the limit', () => {
    it('is the reading plus the thinking, which is what the limit used to be', () => {
        const q = question({ difficulty: 1 })
        expect(thinkingSeconds(q)).toBe(21)
        expect(timeLimitFor(q)).toBe(readingSeconds(q) + 21)
    })

    it('gives a long question more time than a short one of the same difficulty', () => {
        const long = question({ options: [words(30), words(30), words(30)] })
        expect(timeLimitFor(long)).toBeGreaterThan(timeLimitFor(question()))
    })

    it('adds a little for every answer after the first one in a multiple-answer question', () => {
        expect(timeLimitFor(question({ solution: [0, 1, 2] }))).toBe(timeLimitFor(question()) + 4)
    })

    it('uses a default difficulty when the question does not carry one', () => {
        expect(thinkingSeconds(question({ difficulty: undefined }))).toBe(13)
    })

    it('does not leave the shortest question with less than before', () => {
        // the real P15: 31 words, difficulty 0.6: it had 15 s in all, and ~10 s of them to read
        const p15 = question({ question: words(8), options: [words(8), words(8), words(7)], difficulty: 0.6 })
        expect(timeLimitFor(p15)).toBeGreaterThan(15 + 8)
    })
})

describe('the latency kept for the ranking', () => {
    it('is the time taken minus the reading', () => {
        const q = question() // 5 s of reading
        expect(netLatencyMs(12000, q)).toBe(7000)
    })

    it('does not penalise reading: the same thinking costs the same on a long question', () => {
        const short = question()
        const long = question({ options: [words(30), words(30), words(30)] })
        const thinkingMs = 6000
        expect(netLatencyMs(readingSeconds(short) * 1000 + thinkingMs, short))
            .toBe(netLatencyMs(readingSeconds(long) * 1000 + thinkingMs, long))
    })

    it('never goes below the minimum, never zero or negative', () => {
        expect(netLatencyMs(500, question())).toBe(MIN_LATENCY_MS)
        expect(netLatencyMs(0, question())).toBe(MIN_LATENCY_MS)
    })
})
