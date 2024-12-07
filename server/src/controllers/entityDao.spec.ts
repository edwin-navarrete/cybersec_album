import EntityDAO from './entityDao'

interface Row extends Object {
    userId: string
    created: number
}

describe('EntityDAO', () => {
  let dao: EntityDAO<Row>
  let mock: jest.Mock
  let dummy: jest.Mock

  beforeEach(() => {
    mock = jest.fn()
    dummy = jest.fn()
    dao = new EntityDAO(mock, dummy, 'foo')
  })

  test('Get works with empty options', async () => {
    dao.get({filter: {albumId:'123'}})
    expect(mock).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith("SELECT * FROM foo WHERE album_id='123'")
  })

  test('Get works with include exclude options', async () => {
    dao.get({
      filter: {albumId:'123'},
      include: [7, 8],
      exclude: [3, 4]
    })
    expect(mock).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith("SELECT * FROM foo WHERE album_id='123' " +
            'AND foo_id IN (7,8) AND foo_id NOT IN (3,4)')
  })

  test('Get works with order AND limit options', async () => {
    dao.get({
      filter: {albumId:'123'},
      limit: 5,
      order: ['-created', '+modified']
    })
    expect(mock).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith("SELECT * FROM foo WHERE album_id='123' " +
            'ORDER BY created DESC,modified ASC LIMIT 5')
  })

  test('Get works with random order', async () => {
    dao.get({
      filter: {albumId:'123'},
      include: [7],
      order: ['__random', '+modified']
    })
    expect(mock).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith("SELECT * FROM foo WHERE album_id='123' " +
            'AND foo_id IN (7) ORDER BY RAND() ASC,modified ASC')
  })

  test('post works with a simple object', async () => {
    dao.post({
      userId: '7fa3',
      created: Date.parse('04 Dec 1995 00:12:00 GMT')
    })
    expect(dummy).toHaveBeenCalled()
    expect(dummy).toHaveBeenCalledTimes(1)
    expect(dummy).toHaveBeenCalledWith('INSERT INTO foo (user_id, created) VALUES (?, ?) ON DUPLICATE KEY UPDATE created = VALUES(created)', ['7fa3', 818035920000])
  })
})
