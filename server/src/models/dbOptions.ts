import { ConnectionOptions } from 'mysql2/promise'

/** Parte una URL `mysql://user:pass@host:port/db` (usuario y clave pueden venir con %-escapes). */
export function parseDbUrl (raw: string): ConnectionOptions {
  const url = new URL(raw)
  const decode = (s: string) => {
    try { return decodeURIComponent(s) } catch { return s }
  }
  return {
    user: decode(url.username),
    password: decode(url.password),
    host: url.hostname,
    port: Number(url.port) || 3306,
    database: url.pathname.split('/')[1]
  }
}

/**
 * Opciones de conexión según el entorno. Orden:
 *  1. JAWSDB_MARIA_URL (add-on JawsDB MariaDB; era la única que se leía)
 *  2. JAWSDB_URL (add-on JawsDB MySQL, el que carga el esquema actual)
 *  3. DB_HOST / DB_USER / DB_PWD / DB_NAME (desarrollo local)
 */
export function connectionOptionsFromEnv (env: NodeJS.ProcessEnv = process.env): ConnectionOptions & { connectionLimit: number } {
  const url = env.JAWSDB_MARIA_URL || env.JAWSDB_URL
  if (url) return { connectionLimit: 10, ...parseDbUrl(url) }
  return {
    connectionLimit: 10,
    user: env.DB_USER,
    password: env.DB_PWD,
    host: env.DB_HOST,
    port: 3306,
    database: env.DB_NAME
  }
}

/** Qué fuente de BD se usa (sin credenciales), para el log de arranque. */
export function describeDbSource (env: NodeJS.ProcessEnv = process.env): string {
  const name = env.JAWSDB_MARIA_URL ? 'JAWSDB_MARIA_URL' : env.JAWSDB_URL ? 'JAWSDB_URL' : 'DB_*'
  const opts = connectionOptionsFromEnv(env)
  return `${name} → ${opts.host}`
}
