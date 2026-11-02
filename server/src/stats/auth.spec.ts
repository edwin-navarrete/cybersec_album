import { checkCredentials, issueToken, LoginLimiter, loadAuthConfig, tryLoadAuthConfig, verifyToken } from './auth'

const env = { STATS_USER: 'admin', STATS_PASSWORD: 'pw', STATS_TOKEN_SECRET: 'x'.repeat(32), STATS_TOKEN_TTL_HOURS: '1' }
const cfg = loadAuthConfig(env)

describe('stats auth', () => {
  it('checks credentials', () => {
    expect(checkCredentials(cfg, 'admin', 'pw')).toBe(true)
    expect(checkCredentials(cfg, 'admin', 'bad')).toBe(false)
    expect(checkCredentials(cfg, {}, [])).toBe(false)
  })

  it('issues tokens that verify until they expire', () => {
    const { token, expiresAt } = issueToken(cfg, 1000)
    expect(verifyToken(cfg, token, 2000)).toBe('admin')
    expect(verifyToken(cfg, token, expiresAt + 1)).toBeNull()
  })

  it('rejects tampered tokens', () => {
    const { token } = issueToken(cfg, 1000)
    expect(verifyToken(cfg, token.slice(0, -2) + 'xx', 2000)).toBeNull()
    const forged = Buffer.from(JSON.stringify({ sub: 'admin', exp: 9e15 })).toString('base64url') + '.' + token.split('.')[1]
    expect(verifyToken(cfg, forged, 2000)).toBeNull()
    expect(verifyToken(cfg, undefined)).toBeNull()
  })

  it('refuses a weak or missing configuration', () => {
    expect(() => loadAuthConfig({})).toThrow()
    expect(() => loadAuthConfig({ ...env, STATS_TOKEN_SECRET: 'short' })).toThrow()
    expect(tryLoadAuthConfig({}).config).toBeNull()
    expect(tryLoadAuthConfig({}).reason).toMatch(/STATS_USER/)
    expect(tryLoadAuthConfig(env).config).not.toBeNull()
  })

  it('blocks after too many failures and recovers', () => {
    const l = new LoginLimiter(3, 1000)
    for (let i = 0; i < 3; i++) l.fail('ip', 0)
    expect(l.retryAfterMs('ip', 500)).toBeGreaterThan(0)
    expect(l.retryAfterMs('ip', 1500)).toBe(0)
  })
})
