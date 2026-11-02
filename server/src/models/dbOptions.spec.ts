import { connectionOptionsFromEnv, describeDbSource, parseDbUrl } from './dbOptions'
import { getServerPath } from './serverPath'

describe('parseDbUrl', () => {
  it('splits a mysql url and decodes the credentials', () => {
    expect(parseDbUrl('mysql://us%40er:p%23ss%2Fw@host.example.com:3307/mydb')).toEqual({
      user: 'us@er', password: 'p#ss/w', host: 'host.example.com', port: 3307, database: 'mydb'
    })
  })
  it('defaults the port to 3306', () => {
    expect(parseDbUrl('mysql://u:p@h/db').port).toBe(3306)
  })
})

describe('connectionOptionsFromEnv', () => {
  const maria = 'mysql://mu:mp@maria.host/mdb'
  const mysql = 'mysql://yu:yp@mysql.host/ydb'

  it('reads JAWSDB_URL (the MySQL add-on)', () => {
    expect(connectionOptionsFromEnv({ JAWSDB_URL: mysql })).toMatchObject({ host: 'mysql.host', database: 'ydb', connectionLimit: 10 })
  })
  it('keeps JAWSDB_MARIA_URL working, and ahead of JAWSDB_URL so an existing deployment does not change', () => {
    expect(connectionOptionsFromEnv({ JAWSDB_MARIA_URL: maria, JAWSDB_URL: mysql }).host).toBe('maria.host')
  })
  it('lets a JawsDB url override DB_*', () => {
    expect(connectionOptionsFromEnv({ JAWSDB_URL: mysql, DB_HOST: 'local' }).host).toBe('mysql.host')
  })
  it('falls back to DB_* for local development', () => {
    expect(connectionOptionsFromEnv({ DB_HOST: '127.0.0.1', DB_USER: 'root', DB_PWD: 'pw', DB_NAME: 'cyberalbum' }))
      .toEqual({ connectionLimit: 10, host: '127.0.0.1', user: 'root', password: 'pw', database: 'cyberalbum', port: 3306 })
  })
  it('describes the source without leaking credentials', () => {
    const text = describeDbSource({ JAWSDB_URL: mysql })
    expect(text).toBe('JAWSDB_URL → mysql.host')
    expect(text).not.toMatch(/yp|yu/)
  })
})

describe('getServerPath', () => {
  it('is empty when unset or blank, instead of "undefined"', () => {
    expect(getServerPath(undefined)).toBe('')
    expect(getServerPath('  ')).toBe('')
    expect(`${getServerPath(undefined)}/api`).toBe('/api')
  })
  it('normalises the slashes', () => {
    expect(getServerPath('album_api')).toBe('/album_api')
    expect(getServerPath('/album_api/')).toBe('/album_api')
  })
})
