import express from 'express'
import cors from 'cors'
import recaptcha from './recaptcha'
import useragent from 'express-useragent'
import path from 'path';

export class Server {
  port: string | undefined
  app = express()

  constructor () {
    this.port = process.env.PORT || '5006' // Loaded from .env file
    this.middlewares()
    
    // this.app.use('/cybersec_album', express.static(path.join(__dirname, '../client/build')))
    this.routes()

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
    this.app.use(recaptcha)
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

