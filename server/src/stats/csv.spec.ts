import { csvCell, formatLocal, toCsv } from './csv'

describe('csv', () => {
  it('quotes separators, quotes and new lines', () => {
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('di "hola"')).toBe('"di ""hola"""')
    expect(csvCell('l1\nl2')).toBe('"l1\nl2"')
    expect(csvCell('simple')).toBe('simple')
  })
  it('neutralises spreadsheet formulas in text but not in numbers', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('+1')).toBe("'+1")
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(csvCell(-5)).toBe('-5')
  })
  it('writes booleans, nulls and numbers', () => {
    expect(csvCell(true)).toBe('Sí')
    expect(csvCell(false)).toBe('No')
    expect(csvCell(null)).toBe('')
    expect(csvCell(0)).toBe('0')
  })
  it('builds a file with BOM, header and CRLF', () => {
    expect(toCsv(['a', 'b'], [[1, 'x;y']])).toBe('﻿a;b\r\n1;"x;y"\r\n')
  })
  it('formats time in the event offset (UTC-5)', () => {
    expect(formatLocal(Date.UTC(2026, 10, 2, 19, 5, 9), -5 * 3600e3)).toBe('2026-11-02 14:05:09')
  })
})
