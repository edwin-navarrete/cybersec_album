import express from 'express'
import cors from 'cors'
import recaptcha from './recaptcha'
import useragent from 'express-useragent'
import path from 'path';
import fs from 'fs'
import { AuthConfig, tryLoadAuthConfig } from '../stats/auth'
import { createStatsRouter } from '../routes/stats'
import { getGameMode, isInvalidGameMode } from './gameMode'
import { getQuestionSet, isInvalidQuestionSet } from './questionSet'

export class Server {
  port: string | undefined
  app = express()
  // Credenciales de las estadísticas: sin ellas quedan apagadas (nunca abiertas).
  statsAuth: AuthConfig | null = null

  constructor () {
    this.port = process.env.PORT || '5006' // Loaded from .env file
    if (isInvalidGameMode()) {
      console.warn(`Invalid GAME_MODE '${process.env.GAME_MODE}', expected solo|coop|both. Using 'both'`)
    }
    console.log('Game mode:', getGameMode())
    if (isInvalidQuestionSet()) {
      console.warn(`Invalid QUESTION_SET '${process.env.QUESTION_SET}', use letters, numbers, '_', '-' or '.' (max 50). Using 'default'`)
    }
    console.log('reCAPTCHA:', process.env.CAPTCHA_SECRET ? 'required (CAPTCHA_SECRET is set)' : 'not required (CAPTCHA_SECRET is empty)')
    if (process.env.CAPTCHA_SECRET && !process.env.CAPTCHA_API) {
      console.warn('CAPTCHA_SECRET is set but CAPTCHA_API is not: no token can be verified, every request will be rejected')
    }
    console.log('Question set:', getQuestionSet())
    const stats = tryLoadAuthConfig()
    this.statsAuth = stats.config
    if (!this.statsAuth) console.warn(`Stats disabled: ${stats.reason}`)
    this.app.set('trust proxy', 1) // detrás del router de Heroku/cPanel: req.ip es la del cliente
    this.middlewares()
    
    // this.app.use('/cybersec_album', express.static(path.join(__dirname, '../client/build')))
    this.routes()

    this.statsUi()

    // Serve the React app here
    this.app.use(express.static(path.join(__dirname, '../../../client/build')))
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../../client/build', 'index.html'));
    });
  }

  middlewares () {
    this.app.use(cors()) // Enable CORS
    this.app.options('*', cors())
    this.app.use(express.json())
    this.app.use(useragent.express())
    // Before recaptcha: the client needs this before it has a captcha token
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/config'))
    // Stats have their own login, so they go before recaptcha too (the presenter's browser has no captcha token)
    if (this.statsAuth) {
      this.app.use(`${process.env.SERVER_PATH}/api/stats`, createStatsRouter(this.statsAuth))
    }
    // Only the API needs a captcha token: the pages (the game at / and the stats panel at /stats) are
    // plain files that a browser asks for without any custom header, so they must not go through it.
    this.app.use(`${process.env.SERVER_PATH}/api`, recaptcha)
  }

  // The stats panel (statClient build) lives under /stats, same origin as the game
  statsUi () {
    if (!this.statsAuth) return
    const build = process.env.STATS_UI_DIR || path.join(__dirname, '../../../statClient/build')
    if (!fs.existsSync(path.join(build, 'index.html'))) {
      console.warn(`Stats panel not built (${build}); only the stats API is served`)
      return
    }
    const base = `${process.env.SERVER_PATH}/stats`
    this.app.use(base, express.static(build))
    this.app.get(`${base}/*`, (req, res) => res.sendFile(path.join(build, 'index.html')))
  }

  // Bind controllers to routes
  routes () {
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/userSticker'))
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/userAnswer'))
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/album'))
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/questionRouter'))
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/player'))
  }

  listen () {
    const listener = this.app.listen(this.port, () => {
      console.log('Server running on port: ', listener.address())
    })
    return listener
  }
}

