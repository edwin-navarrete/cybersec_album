export const DEFAULT_QUESTION_SET = 'default'

// Same shape as the question.question_set column (varchar(50)). Keeping it
// strict also keeps the value safe to interpolate into the DAO's queries.
const VALID_NAME = /^[A-Za-z0-9_.-]{1,50}$/

/**
 * Question set the server plays, from the QUESTION_SET env var.
 * Empty, unset or invalid values fall back to 'default'.
 */
export function getQuestionSet (raw: string | undefined = process.env.QUESTION_SET): string {
  const value = (raw ?? '').trim()
  return VALID_NAME.test(value) ? value : DEFAULT_QUESTION_SET
}

/** True when QUESTION_SET is present but is not a valid set name */
export function isInvalidQuestionSet (raw: string | undefined = process.env.QUESTION_SET): boolean {
  const value = (raw ?? '').trim()
  return value !== '' && !VALID_NAME.test(value)
}
