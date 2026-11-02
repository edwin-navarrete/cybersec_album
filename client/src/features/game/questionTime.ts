/*
    Time to answer a question.

    Reading a question is not the same as knowing it, and a long question takes longer to
    read than a short one. So the time is split in two:
    - reading: from the number of words (question and options), the same for everybody
    - thinking: from the difficulty of the concept (what the limit used to be)

    The limit is reading + thinking, and the latency kept for the ranking is the time taken
    minus the reading, so reading slowly, or being given a long question, does not count
    against the player.
*/

export interface TimedQuestion {
    question: string
    options: string[]
    solution: number[]
    difficulty?: number
}

// Careful reading on a phone, about 180 words per minute
export const READING_WORDS_PER_SECOND = 3
// Time to pick each answer after the first one in a multiple-answer question
export const SECONDS_PER_EXTRA_ANSWER = 2
// The latency never goes below this: 0 would tie every player who answers within the reading time
export const MIN_LATENCY_MS = 1000

export function countWords(text: string): number {
    return (text.match(/\S+/g) ?? []).length
}

export function readingSeconds(q: TimedQuestion): number {
    const words = countWords(q.question) + q.options.reduce((sum, option) => sum + countWords(option), 0)
    return Math.ceil(words / READING_WORDS_PER_SECOND)
}

// What the whole limit was before reading was counted apart
export function thinkingSeconds(q: TimedQuestion): number {
    return Math.floor((q.difficulty || 0.5) * 15 + 6)
}

export function timeLimitFor(q: TimedQuestion): number {
    return readingSeconds(q) + thinkingSeconds(q) + SECONDS_PER_EXTRA_ANSWER * Math.max(q.solution.length - 1, 0)
}

// The time taken minus the time that reading is worth
export function netLatencyMs(elapsedMs: number, q: TimedQuestion): number {
    return Math.max(Math.round(elapsedMs - readingSeconds(q) * 1000), MIN_LATENCY_MS)
}
