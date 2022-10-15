import express from 'express'
import cors from 'cors'
import recaptcha from './recaptcha'
import useragent from 'express-useragent'
// import path from 'path'

export class Server {
  port: string | undefined
  app = express()

  constructor () {
    this.port = process.env.PORT // Loaded from .env file
    this.middlewares()
    // this.app.use(express.static(path.join(__dirname, '../client/build')))
    // this.app.use('/cybersec_album', express.static(path.join(__dirname, '../client/build')))
    this.routes()
  }

  middlewares () {
    this.app.use(cors()) // Enable CORS
    // this.app.options('*', cors());
    this.app.use(express.json())
    this.app.use(useragent.express())
    this.app.use(recaptcha)
  }

  // Bind controllers to routes
  routes () {
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/userSticker'))
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/userAnswer'))
    this.app.use(`${process.env.SERVER_PATH}/api`, require('../routes/album'))
  }

  listen () {
    const listener = this.app.listen(this.port, () => {
      console.log('Server running on port: ', listener.address())
    })
  }
}
