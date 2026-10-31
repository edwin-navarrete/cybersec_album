import { getGameMode, isInvalidGameMode, isModeAllowed } from './gameMode'

describe('getGameMode', () => {
  it('defaults to both when unset or empty', () => {
    expect(getGameMode(undefined)).toBe('both')
    expect(getGameMode('')).toBe('both')
    expect(getGameMode('  ')).toBe('both')
  })

  it('accepts solo, coop and both ignoring case and spaces', () => {
    expect(getGameMode('solo')).toBe('solo')
    expect(getGameMode(' COOP ')).toBe('coop')
    expect(getGameMode('Both')).toBe('both')
  })

  it('falls back to both for unknown values', () => {
    expect(getGameMode('team')).toBe('both')
  })
})

describe('isInvalidGameMode', () => {
  it('only flags non-empty unknown values', () => {
    expect(isInvalidGameMode(undefined)).toBe(false)
    expect(isInvalidGameMode('')).toBe(false)
    expect(isInvalidGameMode('solo')).toBe(false)
    expect(isInvalidGameMode('team')).toBe(true)
  })
})

describe('isModeAllowed', () => {
  it('allows everything when both', () => {
    expect(isModeAllowed('solo', 'both')).toBe(true)
    expect(isModeAllowed('coop', 'both')).toBe(true)
  })

  it('allows only the configured mode otherwise', () => {
    expect(isModeAllowed('solo', 'solo')).toBe(true)
    expect(isModeAllowed('coop', 'solo')).toBe(false)
    expect(isModeAllowed('solo', 'coop')).toBe(false)
    expect(isModeAllowed('coop', 'coop')).toBe(true)
  })
})
