import { config as envConfig } from 'dotenv'
import { Server } from './models/server'

envConfig()
const server = new Server()
server.listen()
