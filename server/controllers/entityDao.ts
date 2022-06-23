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

  public async get (albumId: number, options: GetOptions): Promise<T[]> {
    let qry = `select * from ${this.entityName} where album_id=${albumId}`
    options.include && (qry += ` and ${this.entityName}_id in (${options.include})`)
    options.exclude && (qry += ` and ${this.entityName}_id not in (${options.exclude})`)
    if (options.order) {
      (typeof options.order === 'string') && (options.order = [options.order])
      const order = []
      for (const o of options.order) {
        const fld = o.substring(1)
        order.push(`${fld === '_random' ? 'RAND()' : fld} ${o.startsWith('-') ? 'desc' : 'asc'}`)
      }
      order && (qry += ` order by ${order}`)
    }
    options.limit && (qry += ` limit ${options.limit}`)
    return this.fetch(qry)
  }

  public async post (row: T): Promise<void> {
    const fields = Object.keys(row)
    const stm = `insert into ${this.entityName}(${fields}) values (${fields.map(_f => '?')})`
    return this.insert(stm, Object.values(row))
  }


    public async upsert (row: T): Promise<void> {
      const fields = Object.keys(row)
      const stm = `replace into ${this.entityName}(${fields}) values (${fields.map(_f => '?')})`
      return this.insert(stm, Object.values(row))
    }
}
