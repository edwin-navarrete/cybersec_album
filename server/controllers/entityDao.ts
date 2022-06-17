interface GetOptions {
    limit: number
    sort: string
    include: Array<number>
    exclude: Array<number>
}

export class EntityDAO<T> {
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
