// get the client
import mysql from 'mysql2/promise'
import { Fetch, Insert } from './DBDriver'

class MySQLDriver {
  // create the connection to database
  pool: mysql.Pool
  config: mysql.ConnectionOptions
  constructor (config: mysql.ConnectionOptions) {
    this.config = config
    this.pool = mysql.createPool(this.config)
  }

  fetch: Fetch = async (query: string) => {
    console.log('FETCH', query)
    const connection = await  this.pool.getConnection()
    const [rows] = await connection.execute(query)
    connection.release();
    return rows as any[]
  }

  insert: Insert = async (stm: string, values: any[]): Promise<any> => {
    console.log('INSERT', stm)
    const connection = await  this.pool.getConnection()
    const [result] = await connection.execute(stm, values);
    connection.release();
    return result
  }
}

export default new MySQLDriver({
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST
})
