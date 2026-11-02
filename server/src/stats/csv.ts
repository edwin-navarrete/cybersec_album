/**
 * CSV para Excel en español: separador ';', fin de línea CRLF y BOM UTF-8 (para las tildes).
 * Las celdas de texto que empiezan por = + - @ (o tab/CR) se prefijan con ' para que Excel
 * no las interprete como fórmula (el alias lo escribe el jugador).
 */
const SEP = ';'
const BOM = '﻿'

export type Cell = string | number | boolean | null | undefined

export function csvCell (value: Cell): string {
  if (value === null || value === undefined) return ''
  let text = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv (header: string[], rows: Cell[][]): string {
  return BOM + [header, ...rows].map((r) => r.map(csvCell).join(SEP)).join('\r\n') + '\r\n'
}

/** "2026-11-02 14:05:09" a partir de epoch ms y el offset horario del evento. */
export function formatLocal (epochMs: number, offsetMs: number): string {
  return new Date(epochMs + offsetMs).toISOString().slice(0, 19).replace('T', ' ')
}
