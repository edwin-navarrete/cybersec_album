import { getQuestionSet, isInvalidQuestionSet, DEFAULT_QUESTION_SET } from './questionSet'

describe('getQuestionSet', () => {
  it('defaults to "default" when unset or empty', () => {
    expect(getQuestionSet(undefined)).toBe(DEFAULT_QUESTION_SET)
    expect(getQuestionSet('')).toBe(DEFAULT_QUESTION_SET)
    expect(getQuestionSet('   ')).toBe(DEFAULT_QUESTION_SET)
  })

  it('accepts valid names, trimming spaces and keeping the case', () => {
    expect(getQuestionSet('ciberseguridad')).toBe('ciberseguridad')
    expect(getQuestionSet(' Phishing_2025-v1.0 ')).toBe('Phishing_2025-v1.0')
  })

  it('falls back to "default" for names that are not safe', () => {
    expect(getQuestionSet("x'; DROP TABLE question;--")).toBe(DEFAULT_QUESTION_SET)
    expect(getQuestionSet('with space')).toBe(DEFAULT_QUESTION_SET)
    expect(getQuestionSet('a'.repeat(51))).toBe(DEFAULT_QUESTION_SET)
  })
})

describe('isInvalidQuestionSet', () => {
  it('only flags non-empty invalid names', () => {
    expect(isInvalidQuestionSet(undefined)).toBe(false)
    expect(isInvalidQuestionSet('')).toBe(false)
    expect(isInvalidQuestionSet('ciberseguridad')).toBe(false)
    expect(isInvalidQuestionSet("a'b")).toBe(true)
  })
})
