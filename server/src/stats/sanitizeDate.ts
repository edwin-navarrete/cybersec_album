/** Acepta DD/MM/YYYY o YYYY-MM-DD y devuelve YYYY-MM-DD; cualquier otra cosa → undefined. */
export function sanitizeDate(date: unknown): string | undefined {
  if (typeof date !== 'string') return undefined
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [d, m, y] = date.split('/')
    return validDay(y, m, d) ? `${y}-${m}-${d}` : undefined
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-')
    return validDay(y, m, d) ? date : undefined
  }
  return undefined
}

function validDay(y: string, m: string, d: string): boolean {
  const dt = new Date(Date.UTC(+y, +m - 1, +d))
  return dt.getUTCFullYear() === +y && dt.getUTCMonth() === +m - 1 && dt.getUTCDate() === +d
}
