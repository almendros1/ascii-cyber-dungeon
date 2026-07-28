import { validateOperatorName } from './playerName'

export const PLAYER_NAME_STORAGE_KEY =
  'ascii-cyber-dungeon.player-name.v1'

export interface PlayerNameStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function getBrowserStorage(): PlayerNameStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/**
 * Reads a stored operator name defensively and revalidates untrusted browser
 * storage. Invalid values are removed when possible and never reach the prompt.
 */
export function loadStoredPlayerName(
  storage: PlayerNameStorage | null = getBrowserStorage(),
): string | null {
  if (!storage) {
    return null
  }

  try {
    const storedValue = storage.getItem(PLAYER_NAME_STORAGE_KEY)

    if (storedValue === null) {
      return null
    }

    const validation = validateOperatorName(storedValue)

    if (!validation.valid) {
      storage.removeItem(PLAYER_NAME_STORAGE_KEY)
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
export function savePlayerName(
  playerName: string,
  storage: PlayerNameStorage | null = getBrowserStorage(),
): boolean {
  const validation = validateOperatorName(playerName)

  if (!validation.valid || !storage) {
    return false
  }

  try {
    storage.setItem(PLAYER_NAME_STORAGE_KEY, validation.value)
    return true
  } catch {
    return false
  }
}
