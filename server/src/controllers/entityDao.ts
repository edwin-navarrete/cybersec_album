import { Fetch, Insert } from './DBDriver'

export interface GetOptions {
    limit?: number
    sort?: string
    order?: string | string[] // "[-|+]field"
    include?: Array<number>
    exclude?: Array<number>
}

export default class EntityDAO<T extends Object> {
  entityName: string
  fetch: Fetch
  insert: Insert

  constructor (fetch: Fetch, insert: Insert, entityName: string) {
    this.entityName = entityName
    this.fetch = fetch
    this.insert = insert
  }

  public async get (albumId: string, options: GetOptions): Promise<T[]> {
    let qry = `SELECT * FROM ${this.entityName} WHERE album_id='${albumId}'`
    options.include && (qry += ` AND ${this.entityName}_id IN (${options.include})`)
    options.exclude && (qry += ` AND ${this.entityName}_id NOT IN (${options.exclude})`)
    if (options.order) {
      (typeof options.order === 'string') && (options.order = [options.order])
      const order = []
      for (const o of options.order) {
        const fld = o.substring(1)
        order.push(`${fld === '_random' ? 'RAND()' : fld} ${o.startsWith('-') ? 'DESC' : 'ASC'}`)
      }
      order && (qry += ` ORDER BY ${order}`)
    }
    options.limit && (qry += ` LIMIT ${options.limit}`)
    return this.fetch(qry)
  }

  public async post (row: T): Promise<void> {
    const fields = Object.keys(row)        
    const updateFields = fields.filter(field => !field.endsWith('_id'));
    const stm = `INSERT INTO ${this.entityName} (${fields.join(', ')})`+
      ` VALUES (${fields.map(() => '?').join(', ')})`+
      ` ON DUPLICATE KEY UPDATE ${updateFields.map(field => `${field} = VALUES(${field})`).join(', ')}`;
    return this.insert(stm, Object.values(row))
  }

  public async upsert (row: T): Promise<void> {
    const fields = Object.keys(row)
    const stm = `replace into ${this.entityName}(${fields}) values (${fields.map(_f => '?')})`
    return this.insert(stm, Object.values(row))
  }
}
