import { describe, expect, it } from 'vitest'
import {
  appendCommandHistory,
  getNextHistoryEntry,
  getPreviousHistoryEntry,
  MAX_COMMAND_HISTORY,
} from './commandHistory'

describe('command history', () => {
  it('does nothing when navigating an empty history', () => {
    expect(getPreviousHistoryEntry([], null)).toBeNull()
    expect(getNextHistoryEntry([], null, 'draft')).toBeNull()
  })

  it('navigates a single history item and restores the draft', () => {
    expect(getPreviousHistoryEntry(['help'], null)).toEqual({
      index: 0,
      value: 'help',
    })
    expect(getPreviousHistoryEntry(['help'], 0)).toEqual({
      index: 0,
      value: 'help',
    })
    expect(getNextHistoryEntry(['help'], 0, 'sta')).toEqual({
      index: null,
      value: 'sta',
    })
  })

  it('navigates backward and forward through multiple commands', () => {
    const history = ['help', 'start', 'inspect']

    expect(getPreviousHistoryEntry(history, null)).toEqual({
      index: 2,
      value: 'inspect',
    })
    expect(getPreviousHistoryEntry(history, 2)).toEqual({
      index: 1,
      value: 'start',
    })
    expect(getNextHistoryEntry(history, 1, '')).toEqual({
      index: 2,
      value: 'inspect',
    })
  })

  it('does not navigate forward until history navigation has started', () => {
    expect(getNextHistoryEntry(['help'], null, 'draft')).toBeNull()
  })

  it('keeps only the most recent bounded history entries', () => {
    let history: string[] = []

    for (let index = 0; index < MAX_COMMAND_HISTORY + 20; index += 1) {
      history = appendCommandHistory(history, `command-${index}`)
    }

    expect(history).toHaveLength(MAX_COMMAND_HISTORY)
    expect(history[0]).toBe('command-20')
    expect(history.at(-1)).toBe(`command-${MAX_COMMAND_HISTORY + 19}`)
  })
})
