import { getCaptchaKey } from './captcha'

describe('getCaptchaKey', () => {
    const saved = process.env.REACT_APP_CAPTCHAKEY
    afterEach(() => {
        if (saved === undefined) delete process.env.REACT_APP_CAPTCHAKEY
        else process.env.REACT_APP_CAPTCHAKEY = saved
    })

    it('is the key given in REACT_APP_CAPTCHAKEY', () => {
        process.env.REACT_APP_CAPTCHAKEY = 'a-site-key'

        expect(getCaptchaKey()).toBe('a-site-key')
    })

    it('is undefined without a key, so there is no captcha in development', () => {
        delete process.env.REACT_APP_CAPTCHAKEY

        expect(getCaptchaKey()).toBeUndefined()
    })

    it('is undefined when the key is empty', () => {
        process.env.REACT_APP_CAPTCHAKEY = ''

        expect(getCaptchaKey()).toBeUndefined()
    })

    it('ignores the old name, which the browser never received', () => {
        delete process.env.REACT_APP_CAPTCHAKEY
        process.env.CAPTCHAKEY = 'old-name'

        expect(getCaptchaKey()).toBeUndefined()
        delete process.env.CAPTCHAKEY
    })
})
