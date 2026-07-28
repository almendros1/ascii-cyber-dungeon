import { validateOperatorName } from './playerName'

export const PLAYER_NAME_STORAGE_KEY =
  'ascii-cyber-dungeon.player-name.v1'

/**
 * Reads a stored operator name defensively and revalidates untrusted browser
 * storage. Invalid values are removed when possible and never reach the prompt.
 */
export function loadStoredPlayerName(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedValue = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY)

    if (storedValue === null) {
      return null
    }

    const validation = validateOperatorName(storedValue)

    if (!validation.valid) {
      window.localStorage.removeItem(PLAYER_NAME_STORAGE_KEY)
      return null
    }

    return validation.value
  } catch {
    return null
  }
}

/**
 * Persists only a value that passes the same validation used by player setup.
 *
 * A boolean result lets the terminal keep the session playable when storage is
 * disabled, full or otherwise unavailable.
 */
export function savePlayerName(playerName: string): boolean {
  const validation = validateOperatorName(playerName)

  if (!validation.valid || typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, validation.value)
    return true
  } catch {
    return false
  }
}
