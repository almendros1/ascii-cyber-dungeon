import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  loadStoredPlayerName,
  PLAYER_NAME_STORAGE_KEY,
  savePlayerName,
  type PlayerNameStorage,
} from './playerStorage'

class MemoryStorage implements PlayerNameStorage {
  readonly values = new Map<string, string>()
  readonly operations: string[] = []
  throwOn: 'get' | 'set' | 'remove' | null = null

  getItem(key: string): string | null {
    this.operations.push(`get:${key}`)
    if (this.throwOn === 'get') {
      throw new Error('storage read failed')
    }
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.operations.push(`set:${key}:${value}`)
    if (this.throwOn === 'set') {
      throw new Error('storage write failed')
    }
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.operations.push(`remove:${key}`)
    if (this.throwOn === 'remove') {
      throw new Error('storage removal failed')
    }
    this.values.delete(key)
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('operator persistence', () => {
  it('stores only the normalized valid operator name under the fixed key', () => {
    const storage = new MemoryStorage()

    expect(savePlayerName('Neo_7', storage)).toBe(true)
    expect([...storage.values.entries()]).toEqual([
      [PLAYER_NAME_STORAGE_KEY, 'neo_7'],
    ])
    expect(storage.operations).toEqual([
      `set:${PLAYER_NAME_STORAGE_KEY}:neo_7`,
    ])
  })

  it('reads and normalizes a valid stored name', () => {
    const storage = new MemoryStorage()
    storage.values.set(PLAYER_NAME_STORAGE_KEY, 'ROOT-HUNTER')

    expect(loadStoredPlayerName(storage)).toBe('root-hunter')
  })

  it.each([
    '<script>',
    '../../admin',
    'root; shutdown',
    'operator@host',
    'a'.repeat(30),
  ])('removes manipulated stored value %j', (storedValue) => {
    const storage = new MemoryStorage()
    storage.values.set(PLAYER_NAME_STORAGE_KEY, storedValue)

    expect(loadStoredPlayerName(storage)).toBeNull()
    expect(storage.values.has(PLAYER_NAME_STORAGE_KEY)).toBe(false)
    expect(storage.operations).toContain(
      `remove:${PLAYER_NAME_STORAGE_KEY}`,
    )
  })

  it('does not store invalid names or command-like extra data', () => {
    const storage = new MemoryStorage()

    expect(savePlayerName('root; shutdown', storage)).toBe(false)
    expect(savePlayerName('storm rider', storage)).toBe(false)
    expect(storage.values.size).toBe(0)
    expect(storage.operations).toEqual([])
  })

  it('continues when storage reads, writes or cleanup throw', () => {
    const readStorage = new MemoryStorage()
    readStorage.throwOn = 'get'
    expect(loadStoredPlayerName(readStorage)).toBeNull()

    const writeStorage = new MemoryStorage()
    writeStorage.throwOn = 'set'
    expect(savePlayerName('storm', writeStorage)).toBe(false)

    const cleanupStorage = new MemoryStorage()
    cleanupStorage.values.set(PLAYER_NAME_STORAGE_KEY, '<script>')
    cleanupStorage.throwOn = 'remove'
    expect(loadStoredPlayerName(cleanupStorage)).toBeNull()
  })

  it('continues when browser storage itself is unavailable', () => {
    const fakeWindow = {}
    Object.defineProperty(fakeWindow, 'localStorage', {
      get() {
        throw new Error('storage blocked')
      },
    })
    vi.stubGlobal('window', fakeWindow)

    expect(loadStoredPlayerName()).toBeNull()
    expect(savePlayerName('storm')).toBe(false)
  })

  it('handles an explicitly unavailable storage adapter', () => {
    expect(loadStoredPlayerName(null)).toBeNull()
    expect(savePlayerName('storm', null)).toBe(false)
  })
})
