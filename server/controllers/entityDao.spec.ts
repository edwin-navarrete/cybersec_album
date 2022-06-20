import EntityDAO from './entityDAO'

interface Row extends Object {
    user_id: string
    created: number
}

describe('EntityDAO', () => {

 let dao : EntityDAO<Row>;
 let mock :jest.Mock;
 let dummy :jest.Mock;

  beforeEach(()=>{
     mock = jest.fn();
     dummy = jest.fn();
     dao = new EntityDAO(mock,dummy, 'foo');
  })

  test('Get works with empty options', async () => {
    dao.get(123, {})
    expect(mock).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith('select * from foo where album_id=123')
  })

  test('Get works with include exclude options', async () => {
    dao.get(123, {
      include: [7, 8],
      exclude: [3, 4]
    })
    expect(mock).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith('select * from foo where album_id=123 ' +
      'and foo_id in (7,8) and foo_id not in (3,4)')
  })

  test('Get works with order and limit options', async () => {
    dao.get(123, {
      limit: 5,
      order: ['-created', '+modified']
    })
    expect(mock).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith('select * from foo where album_id=123 ' +
    'order by created desc,modified asc limit 5')
  })

  test('Get works with random order', async () => {
    dao.get(123, {
      include: [7],
      order: ['__random', '+modified']
    })
    expect(mock).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith('select * from foo where album_id=123 ' +
     'and foo_id in (7) order by RAND() asc,modified asc')
  })


  test('post works with a simple object', async () => {
      dao.post( {
        user_id: "7fa3",
        created: Date.parse('04 Dec 1995 00:12:00 GMT')
      })
      expect(dummy).toHaveBeenCalled()
      expect(dummy).toHaveBeenCalledTimes(1)
      expect(dummy).toHaveBeenCalledWith("insert into foo(user_id,created) values (?,?)", ["7fa3",818035920000])
    })
})
