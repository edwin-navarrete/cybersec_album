// get the client
import mysql from 'mysql2/promise'
import { Fetch, Insert } from './DBDriver'
import { URL } from 'url';

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

const connOpts: mysql.ConnectionOptions = {
  connectionLimit: 10
}

const jawsdbUrl = process.env.JAWSDB_MARIA_URL;

if(jawsdbUrl){
  const parsedUrl = new URL(jawsdbUrl);
  console.log('JAWSDB_MARIA_URL',parsedUrl.hostname);
  connOpts.user = parsedUrl.username;  
  connOpts.password = parsedUrl.password;  
  connOpts.host = parsedUrl.hostname;  
  connOpts.port = Number(parsedUrl.port) || 3306;  
  connOpts.database = parsedUrl.pathname.split('/')[1]; 

}
else {
  connOpts.user = process.env.DB_USER;
  connOpts.password = process.env.DB_PWD;
  connOpts.host = process.env.DB_HOST;
  connOpts.port = 3306;
  connOpts.database = process.env.DB_NAME;
}

export default new MySQLDriver(connOpts);
