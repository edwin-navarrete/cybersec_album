// get the client
import mysql from 'mysql2/promise'
import { Fetch, Insert } from './DBDriver'
import { connectionOptionsFromEnv, describeDbSource } from '../models/dbOptions'

class MySQLDriver {
  // create the connection to database
  pool: mysql.Pool
  config: mysql.ConnectionOptions
  constructor (config: mysql.ConnectionOptions) {
    this.config = config
    this.pool = mysql.createPool(this.config)
  }

  async getConnection(timeoutMs: number): Promise<mysql.PoolConnection | null> {
    let connection: mysql.PoolConnection | null = null;
    let timeout: NodeJS.Timeout | null = null;
    try {
      connection = await Promise.race([
        this.pool.getConnection(),
        new Promise<mysql.PoolConnection>((resolve, reject) => {
          timeout = setTimeout(() => {
            reject(new Error('Timeout: Unable to acquire connection within specified time'));
          }, timeoutMs);
        })
      ]);
    } catch (error) {
      throw error;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    return connection;
  }

  fetch: Fetch = async (query: string, values?: any[]) => {
    const connection = await this.getConnection(1000);
    if (!connection) {
      throw new Error('Unable to acquire database connection');
    }
    try {
        console.log('FETCH', query)
        const [rows] = await connection.execute(query, values)
        connection.release();
        return rows as any[]
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  insert: Insert = async (stm: string, values: any[]): Promise<any> => {
    const connection = await this.getConnection(1000);
    if (!connection) {
      throw new Error('Unable to acquire database connection');
    }
    try {
      console.log('INSERT', stm);
      const [result] = await connection.execute(stm, values);
      return result;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
}

const connOpts = connectionOptionsFromEnv()
console.log('Database:', describeDbSource())

export default new MySQLDriver(connOpts);
