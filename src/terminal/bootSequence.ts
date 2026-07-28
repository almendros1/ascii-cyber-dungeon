import type { TerminalMessageDraft } from './commandEngine'

export const BOOT_MESSAGE_DELAY_MS = 550

export const BOOT_MESSAGES: TerminalMessageDraft[] = [
  {
    type: 'system',
    text: '[BOOT] Initializing ACD runtime...',
  },
  {
    type: 'system',
    text: '[LOAD] Importing dungeon modules...',
  },
  {
    type: 'system',
    text: '[LOAD] Extracting encounter package...',
  },
  {
    type: 'system',
    text: '[SYNC] Rebuilding corrupted node table...',
  },
  {
    type: 'system',
    text: '[SCAN] Searching for hostile daemons...',
  },
  {
    type: 'warning',
    text: '[WARN] Unauthorized process detected.',
  },
  {
    type: 'system',
    text: '[READY] Terminal session established.',
  },
]
