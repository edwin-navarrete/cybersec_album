/*
    Unique player names.

    The name is the identity shown in the ranking (and used to find the winners), so
    it is unique. When the one a new player chooses is already taken, the game
    assigns "<name> #CODE" instead of rejecting it. The game is the only one that
    can create such a name: '#' is not allowed in what a player types.
*/

export const MAX_NAME_LENGTH = 80 // player.player_name is a varchar(80)
export const CODE_LENGTH = 4
// Without the characters that are easy to confuse: 0/O and 1/I
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const SUFFIX = new RegExp(` #[${CODE_ALPHABET}]{${CODE_LENGTH}}$`)

export function randomCode (random: () => number = Math.random): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  }
  return code
}

// The base is shortened if needed so the name still fits in the column
export function withSuffix (name: string, code: string): string {
  const suffix = ` #${code}`
  return name.slice(0, MAX_NAME_LENGTH - suffix.length) + suffix
}

export function hasSystemSuffix (name: string): boolean {
  return SUFFIX.test(name)
}

export function stripSuffix (name: string): string {
  return name.replace(SUFFIX, '')
}

// A duplicate on the name's unique key (and not on another one)
export function isNameCollision (error: any): boolean {
  return error?.code === 'ER_DUP_ENTRY' && String(error?.sqlMessage ?? error?.message ?? '').includes('player_name')
}

/*
    Run `insert` with the name asked for and, only if that name is taken, with
    "<name> #CODE" until one is free. Relying on the database's unique key (instead
    of looking the name up first) keeps it right when two players ask for the same
    name at once. Returns the name that was finally used.
*/
export async function insertWithUniqueName<T> (
  insert: (name: string) => Promise<T>,
  name: string,
  options: { maxTries?: number, code?: () => string } = {}
): Promise<{ result: T, name: string }> {
  const { maxTries = 5, code = randomCode } = options
  try {
    return { result: await insert(name), name }
  } catch (error) {
    if (!isNameCollision(error)) throw error
    let last = error
    for (let attempt = 0; attempt < maxTries; attempt++) {
      const candidate = withSuffix(name, code())
      try {
        return { result: await insert(candidate), name: candidate }
      } catch (retryError) {
        if (!isNameCollision(retryError)) throw retryError
        last = retryError
      }
    }
    throw last
  }
}
