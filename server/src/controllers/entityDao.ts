import { Fetch, Insert } from './DBDriver'

export interface GetOptions {
    filter: Record<string,any>
    limit?: number
    sort?: string
    order?: string | string[] // "[-|+]field"
    include?: Array<number>
    exclude?: Array<number>
}

const toCamel = (str: string) =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const toSnake = (str: string) =>
  str.replace(/([A-Z])/g, '_$1').toLowerCase();

export default class EntityDAO<T extends Object> {
  entityName: string
  fetch: Fetch
  insert: Insert

  constructor (fetch: Fetch, insert: Insert, entityName: string) {
    this.entityName = entityName
    this.fetch = fetch
    this.insert = insert
  }

  private snakeToCamel(row: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [toCamel(key), value])
    );
  }
  private camelToSnake(row: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [toSnake(key), value])
    );
  }

  public async get (options: GetOptions): Promise<T[]> {
    let qry = `SELECT * FROM ${this.entityName} `
    if (options.filter) {
      const conditions = Object.entries(options.filter)
        .filter( ([key, value]) => value !== undefined )
        .map(([key, value]) => {
          const snakeKey = toSnake(key);
          if (value instanceof Array) {
            // use "IN"
            const formattedValues = value.map(v => `'${v}'`).join(", ");
            return `${snakeKey} IN(${formattedValues})`;
          } else {
            // equals OR IS NULL
            return value 
              ? `${snakeKey} = '${value}'`
              : `${snakeKey} IS NULL`;  
          }
        });
      qry += conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    }
    options.include && (qry += ` AND ${this.entityName}_id IN (${options.include})`)
    options.exclude && (qry += ` AND ${this.entityName}_id NOT IN (${options.exclude})`)
    if (options.order) {
      (typeof options.order === 'string') && (options.order = [options.order])
      const order = []
      for (const o of options.order) {
        const fld = o.substring(1)
        order.push(`${fld === '_random' ? 'RAND()' : toSnake(fld)} ${o.startsWith('-') ? 'DESC' : 'ASC'}`)
      }
      order && (qry += ` ORDER BY ${order}`)
    }
    options.limit && (qry += ` LIMIT ${options.limit}`)
    const results = await this.fetch(qry);
    return results?.map(row => this.snakeToCamel(row) as T);
  }

  public async post (row: T, upsert = true): Promise<any> {
    const snakeCaseRow = this.camelToSnake(row);
    const fields = Object.keys(snakeCaseRow)
    const updateFields = fields.filter(field => !field.endsWith('_id'));
    let stm = `INSERT INTO ${this.entityName} (${fields.join(', ')})`+
      ` VALUES (${fields.map(() => '?').join(', ')})`;
    if (upsert)
      stm += ` ON DUPLICATE KEY UPDATE ${updateFields.map(field => `${field} = VALUES(${field})`).join(', ')}`;
    return this.insert(stm, Object.values(row))
  }

  public async update (row: T): Promise<any> {
    const snakeCaseRow = this.camelToSnake(row);
    const fields = Object.keys(snakeCaseRow)
    const keyField = this.entityName + '_id'
    const updateFields = fields.filter(field => field != keyField);
    const stm = `UPDATE ${this.entityName} SET ${updateFields.map(f=>f+'=?').join(', ')} WHERE ${keyField} = ${snakeCaseRow[keyField]}`
    return this.insert(stm,  updateFields.map(updFld=>snakeCaseRow[updFld]))
  }

  public async replace (row: T): Promise<any> {
    const fields = Object.keys(row)
    const stm = `REPLACE INTO ${this.entityName}(${fields}) VALUES (${fields.map(_f => '?')})`
    return this.insert(stm, Object.values(row))
  }
}

function snakeToCamel(row: any, arg1: any) {
  throw new Error('Function not implemented.')
}

