/*
    Choosing the next question once the player has seen them all (Thompson sampling).

    Each question has, for this player, a number of successes and failures. The chance
    that the player does NOT know it is modelled as Beta(1 + w * failures, 1 + w * successes), w = EVIDENCE_WEIGHT:
    a uniform prior, so a question with little evidence is still a bit random, and one
    failed again and again approaches 1 without ever being certain. For every
    candidate a value is drawn from its distribution and the highest wins. So:
    - what the player failed comes out most, and the more it was failed the more often,
    - what was answered correctly almost never comes out (but it can),
    - nothing monopolises: the most failed one wins often, not always, and the
      questions asked last are left out so it cannot come twice in a row.
*/

export interface QuestionStats {
    successes: number
    failures: number
}

// user_answer keeps the attempts and the last result of each question, not every result:
// the last one counts as a success or a failure and the previous attempts as failures.
// The result is a boolean for what was just answered but a number (1/0, a tinyint) when it
// comes from the API, so both are read as truthy/falsy.
export type Result = boolean | number | null | undefined

export function statsOf(answer: { attempts?: number, success?: Result }): QuestionStats {
    const attempts = Math.max(answer.attempts ?? 1, 1)
    const successes = answer.success ? 1 : 0 // a timeout (null) is a failure
    return { successes, failures: attempts - successes }
}

export function statsByQuestion(answers: Array<{ questionId: number, attempts?: number, success?: Result }>): Map<number, QuestionStats> {
    return new Map(answers.map(a => [a.questionId, statsOf(a)]))
}

/*
    A draw from Beta(a, b) for whole a, b >= 1: the a-th smallest of a + b - 1 uniform
    numbers. It is exact and needs no library.
*/
export function sampleBeta(a: number, b: number, random: () => number = Math.random): number {
    const uniforms = Array.from({ length: a + b - 1 }, () => random()).sort((x, y) => x - y)
    return uniforms[a - 1]
}

// How much one result weighs. In a review a single result already says a lot: with 1,
// a question answered right once would still come back about a third of the time beside
// one failed once; with 3 it almost never does, and what was failed rotates.
export const EVIDENCE_WEIGHT = 3

// Questions asked last that must not come again right away
export const RECENT_QUESTIONS = 2

export function pickToReview<T extends { id?: number }>(
    pool: T[],
    stats: Map<number, QuestionStats>,
    recent: number[] = [],
    random: () => number = Math.random
): T | undefined {
    // If every candidate was asked recently, they all come back into play
    const rested = pool.filter(q => q.id === undefined || !recent.includes(q.id))
    const candidates = rested.length ? rested : pool
    let best: T | undefined
    let bestValue = -1
    for (const question of candidates) {
        const { successes, failures } = (question.id !== undefined && stats.get(question.id)) || { successes: 0, failures: 0 }
        const value = sampleBeta(1 + EVIDENCE_WEIGHT * failures, 1 + EVIDENCE_WEIGHT * successes, random)
        if (value > bestValue) {
            bestValue = value
            best = question
        }
    }
    return best
}
