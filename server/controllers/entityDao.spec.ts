import EntityDAO from './entityDAO'

describe('EntityDAO', () => {
  test('Get works with empty options', () => {
    const dao = new EntityDAO('Foo')
    expect(dao).not.toBeNull()
  })
})
