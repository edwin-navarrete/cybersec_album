import { config as envConfig } from 'dotenv'
import { Server } from './models/server'
import 'log-timestamp'

envConfig()
console.log('Starting Server...')
const server = new Server()
server.listen()
