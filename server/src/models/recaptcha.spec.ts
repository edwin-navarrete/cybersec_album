import axios from 'axios'
import recaptcha from './recaptcha'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// every test uses its own token: the check of a token is kept for a moment
let counter = 0
const newToken = () => `token-${++counter}-abcde`

async function request (headers: Record<string, string> = {}, method = 'GET') {
  const req: any = { method, ip: '10.0.0.1', header: (name: string) => headers[name] }
  const res: any = { sendStatus: jest.fn() }
  const next = jest.fn()
  await recaptcha(req, res, next)
  return { res, next }
}

describe('recaptcha', () => {
  const saved = { secret: process.env.CAPTCHA_SECRET, api: process.env.CAPTCHA_API }
  beforeEach(() => {
    process.env.CAPTCHA_SECRET = 'a-secret'
    process.env.CAPTCHA_API = 'https://captcha.test/verify'
    mockedAxios.post.mockReset()
    jest.spyOn(console, 'log').mockImplementation(() => { })
  })
  afterEach(() => {
    saved.secret === undefined ? delete process.env.CAPTCHA_SECRET : process.env.CAPTCHA_SECRET = saved.secret
    saved.api === undefined ? delete process.env.CAPTCHA_API : process.env.CAPTCHA_API = saved.api
  })

  it('lets everything through when no secret is configured (development)', async () => {
    delete process.env.CAPTCHA_SECRET

    const { res, next } = await request()

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.sendStatus).not.toHaveBeenCalled()
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('rejects with 403, without failing, a request that brings no token', async () => {
    const { res, next } = await request()

    expect(res.sendStatus).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('lets through a request whose token Google accepts', async () => {
    mockedAxios.post.mockResolvedValue({ status: 200, data: { success: true } })

    const { res, next } = await request({ 'g-recaptcha-response': newToken() }, 'POST')

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.sendStatus).not.toHaveBeenCalled()
  })

  it('rejects a token that Google does not accept', async () => {
    mockedAxios.post.mockResolvedValue({ status: 200, data: { success: false } })

    const { res, next } = await request({ 'g-recaptcha-response': newToken() })

    expect(res.sendStatus).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects, and does not fail, when the token cannot be checked', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network down'))
    jest.spyOn(console, 'error').mockImplementation(() => { })

    const { res, next } = await request({ 'g-recaptcha-response': newToken() })

    expect(res.sendStatus).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('does not ask for a token on other methods, such as the OPTIONS of CORS', async () => {
    const { res, next } = await request({}, 'OPTIONS')

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.sendStatus).not.toHaveBeenCalled()
  })
})
