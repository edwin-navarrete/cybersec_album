import { sanitizeDate } from './sanitizeDate'

describe('sanitizeDate', () => {
  it('accepts both formats and returns YYYY-MM-DD', () => {
    expect(sanitizeDate('2026-11-02')).toBe('2026-11-02')
    expect(sanitizeDate('02/11/2026')).toBe('2026-11-02')
  })
  it('rejects anything else, including impossible days and injection attempts', () => {
    expect(sanitizeDate(undefined)).toBeUndefined()
    expect(sanitizeDate('2026-13-45')).toBeUndefined()
    expect(sanitizeDate('31/02/2026')).toBeUndefined()
    expect(sanitizeDate('2026-11-02" OR 1=1 --')).toBeUndefined()
    expect(sanitizeDate(['2026-11-02'])).toBeUndefined()
  })
})
