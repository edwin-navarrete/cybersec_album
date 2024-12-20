import { config as envConfig } from 'dotenv'
import { Server } from './models/server'
import 'log-timestamp'

envConfig()
console.log('Starting Server...')
const server = new Server()
const listener = server.listen()

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: gracefully shutting down')
    if (listener) {
        listener.close(() => {
        console.log('HTTP server closed')
      })
    }
  })