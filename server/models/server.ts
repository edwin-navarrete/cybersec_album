import express from 'express'
import cors from 'cors'
import path from 'path'

export class Server {
  port: string | undefined
  app = express()

  constructor () {
    this.port = process.env.PORT // Loaded from .env file
    this.middlewares()
    this.app.use(express.static(path.join(__dirname, '../client/build')))
    this.app.use('/cybersec_album', express.static(path.join(__dirname, '../client/build')))
    this.routes()
  }

  middlewares () {
    this.app.use(cors()) // Enable CORS
    this.app.use(express.json())
  }

  // Bind controllers to routes
  routes () {
    this.app.use('/api/auth', require('../routes/auth'))
  }

  listen () {
    const listener = this.app.listen(this.port, () => {
      console.log('Server running on port: ', listener.address())
    })
  }
}
