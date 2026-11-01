import { randomCode, withSuffix, hasSystemSuffix, stripSuffix, isNameCollision, insertWithUniqueName, MAX_NAME_LENGTH } from './playerName'

const dup = (key = 'player.player_name') => Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY', sqlMessage: `Duplicate entry 'x' for key '${key}'` })

describe('names assigned by the game', () => {
  it('builds codes of 4 characters without confusing ones', () => {
    for (let i = 0; i < 200; i++) expect(randomCode()).toMatch(/^[2-9A-HJ-NP-Z]{4}$/)
  })

  it('recognises and strips only the suffix the game creates', () => {
    expect(hasSystemSuffix('Juan #4F7K')).toBe(true)
    expect(stripSuffix('Juan #4F7K')).toBe('Juan')
    expect(hasSystemSuffix('Juan #4f7k')).toBe(false) // lowercase
    expect(hasSystemSuffix('Juan #0000')).toBe(false) // 0 is not in the alphabet
    expect(hasSystemSuffix('Juan #4F7KX')).toBe(false)
    expect(hasSystemSuffix('Juan')).toBe(false)
    expect(stripSuffix('Juan')).toBe('Juan')
  })

  it('shortens a long name so it still fits the column', () => {
    const name = withSuffix('a'.repeat(100), '4F7K')
    expect(name.length).toBe(MAX_NAME_LENGTH)
    expect(name.endsWith(' #4F7K')).toBe(true)
  })
})

describe('isNameCollision', () => {
  it('only matches a duplicate on the name', () => {
    expect(isNameCollision(dup())).toBe(true)
    expect(isNameCollision(dup('player_name'))).toBe(true) // MariaDB
    expect(isNameCollision(dup('player.group_id'))).toBe(false)
    expect(isNameCollision(new Error('boom'))).toBe(false)
    expect(isNameCollision(undefined)).toBe(false)
  })
})

describe('insertWithUniqueName', () => {
  it('keeps the name when it is free, without any suffix', async () => {
    const insert = jest.fn().mockResolvedValue({ insertId: 1 })

    const { name, result } = await insertWithUniqueName(insert, 'Juan')

    expect(name).toBe('Juan')
    expect(result).toEqual({ insertId: 1 })
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('adds the suffix only when the name is taken', async () => {
    const insert = jest.fn().mockRejectedValueOnce(dup()).mockResolvedValue({ insertId: 2 })

    const { name } = await insertWithUniqueName(insert, 'Juan', { code: () => '4F7K' })

    expect(name).toBe('Juan #4F7K')
    expect(insert).toHaveBeenNthCalledWith(1, 'Juan')
    expect(insert).toHaveBeenNthCalledWith(2, 'Juan #4F7K')
  })

  it('tries another code when the first one is taken too', async () => {
    const codes = ['AAAA', 'BBBB']
    const insert = jest.fn().mockRejectedValueOnce(dup()).mockRejectedValueOnce(dup()).mockResolvedValue({})

    const { name } = await insertWithUniqueName(insert, 'Juan', { code: () => codes.shift()! })

    expect(name).toBe('Juan #BBBB')
  })

  it('gives up after the allowed tries', async () => {
    const insert = jest.fn().mockRejectedValue(dup())

    await expect(insertWithUniqueName(insert, 'Juan', { maxTries: 3 })).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' })

    expect(insert).toHaveBeenCalledTimes(4) // the name and 3 suffixed tries
  })

  it('does not hide errors that are not a taken name', async () => {
    const insert = jest.fn().mockRejectedValue(new Error('connection lost'))

    await expect(insertWithUniqueName(insert, 'Juan')).rejects.toThrow('connection lost')

    expect(insert).toHaveBeenCalledTimes(1)
  })
})
