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

// Validate the header g-recaptcha-response for POST enrypoints
export default async function recaptcha (req: Request, resp: Response, next: NextFunction) {
  if (process.env.CAPTCHA_SECRET && req.method === 'POST') {
    const token = req.header('g-recaptcha-response')
    const valid = await testTokenMem(token, req.ip)
    if (!valid) {
      console.log('rejected ', token.slice(-5))
      return resp.sendStatus(403)
    } else {
      console.log('Accepted ', token.slice(-5))
    }
  }
  next()
}
