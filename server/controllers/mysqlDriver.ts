// get the client
import mysql from 'mysql2/promise'
import { Fetch, Insert } from './DBDriver'

class MySQLDriver {
  // create the connection to database
  connection: mysql.Connection
  config: mysql.ConnectionOptions
  constructor (config: mysql.ConnectionOptions) {
    this.config = config
    this.connection = null
  }

  async connect () {
      // FIXME attempt the connection pool to increase speed
     this.connection = await mysql.createConnection(this.config)
  }

  fetch: Fetch = async (query: string) => {
    await this.connect()
    const [rows] = await this.connection.execute(query)
    this.connection.end();
    return rows as any[]
  }

  insert: Insert = async (stm: string, values: any[]): Promise<any> => {
    await this.connect()
    const [result] = await this.connection.execute(stm, values);
    this.connection.commit();
    this.connection.end();
    return result
  }
}

export default new MySQLDriver({
  user: 'ssolucio_cyberalbum',
  password: process.env.DB_PWD,
  database: 'ssolucio_cyberalbum',
  host: 'localhost'
})
