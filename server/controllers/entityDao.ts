export interface GetOptions {
    limit?: number
    sort?: string
    order?: string
    include?: Array<number>
    exclude?: Array<number>
}

export default class EntityDAO<T> {
  entityName: string

  constructor (entityName: string) {
    this.entityName = entityName
    // FIXME do mysql connection here
  }

  public get (_options: GetOptions): Array<T> {
    return []
  }

  public post (_record: T): void {

  }
}
