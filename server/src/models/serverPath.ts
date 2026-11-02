/**
 * Prefijo bajo el que se montan las rutas (`SERVER_PATH`). Sin definir es '' (en la raíz):
 * antes salía `undefined/api`, y en Heroku no se puede fiar uno de poder dejar la variable vacía.
 */
export const getServerPath = (raw: string | undefined = process.env.SERVER_PATH): string => {
  const value = (raw ?? '').trim().replace(/\/+$/, '')
  return value && !value.startsWith('/') ? `/${value}` : value
}
