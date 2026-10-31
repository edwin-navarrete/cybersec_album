export type GameMode = 'solo' | 'coop' | 'both'

const VALID_MODES: GameMode[] = ['solo', 'coop', 'both']

/**
 * Game modes this server accepts, from the GAME_MODE env var.
 * 'solo' and 'coop' restrict the game to that mode; 'both' (default, also used
 * for an empty or invalid value) allows either.
 */
export function getGameMode (raw: string | undefined = process.env.GAME_MODE): GameMode {
  const value = (raw ?? '').trim().toLowerCase()
  return (VALID_MODES as string[]).includes(value) ? value as GameMode : 'both'
}

/** True when the GAME_MODE setting is present but not one of solo|coop|both */
export function isInvalidGameMode (raw: string | undefined = process.env.GAME_MODE): boolean {
  const value = (raw ?? '').trim().toLowerCase()
  return value !== '' && !(VALID_MODES as string[]).includes(value)
}

/** Whether a player of `requested` mode may register under the configured game mode */
export function isModeAllowed (requested: string, gameMode: GameMode = getGameMode()): boolean {
  return gameMode === 'both' || requested === gameMode
}
