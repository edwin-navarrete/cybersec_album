import axios from 'axios'
import memoize from 'memoizee'
import { Request, Response, NextFunction } from 'express'

type GCaptchResponse = {
    success: boolean
    challenge_ts: Date
    hostname: string
    score: number
    'error-codes': Array<string>
};

async function testToken (token: string, ip: string) {
  try {
    const gparams = {
      secret: process.env.CAPTCHA_SECRET,
      response: token,
      remoteip: ip
    }
    if (!gparams.response) {
      console.log('g-recaptcha-response is missing')
      return false
    }
    const { data, status } = await axios.post<GCaptchResponse>(
      process.env.CAPTCHA_API, undefined, { params: gparams })
    console.log(JSON.stringify(data, null, 4))
    if (status !== 200 || !data.success) {
      return false
    }
    return true
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('error message: ', error.message)
    } else {
      console.log('unexpected error: ', error)
    }
  }
  return false
}

const testTokenMem = memoize(testToken, { maxAge: 1200, promise: true })

// Only the end of a token goes to the log; a request may not have one
const tail = (token: string | undefined) => token?.slice(-5) ?? '(no token)'

/*
    Validate the header g-recaptcha-response of GET and POST requests. It is only required when
    CAPTCHA_SECRET is set: without it (development) every request goes through.
    A request without a valid token gets a 403. This function is async and Express 4 does not
    catch what an async middleware throws, so nothing may escape from it: it used to bring the
    whole server down when the token was missing.
*/
export default async function recaptcha (req: Request, resp: Response, next: NextFunction) {
  try {
    if (process.env.CAPTCHA_SECRET) {
      if (req.method === 'POST' || req.method === 'GET') {
        const token = req.header('g-recaptcha-response')
        const valid = await testTokenMem(token, req.ip)
        if (!valid) {
          console.log('rejected ', tail(token))
          return resp.sendStatus(403)
        }
        console.log('Accepted ', tail(token))
      }
    }
  } catch (error) {
    return next(error)
  }
  next()
}
