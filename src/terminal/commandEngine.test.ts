import { describe, expect, it } from 'vitest'
import type { GamePhase } from '../game/gamePhase'
import { createInitialRunState, type RunState } from '../game/runState'
import {
  getAvailableCommandNames,
  isCommandParseError,
  MAX_TERMINAL_INPUT_LENGTH,
  parseCommand,
  resolveCommand,
  type CommandContext,
  type CommandResult,
  type ParsedCommand,
} from './commandEngine'

function parseKnown(input: string): ParsedCommand {
  const result = parseCommand(input)

  if (!result || isCommandParseError(result)) {
    throw new Error(`Expected parsed command for ${input}`)
  }

  return result
}

function appendResult(result: CommandResult) {
  expect(result.type).toBe('append')
  if (result.type !== 'append') {
    throw new Error('Expected append command result')
  }
  return result
}

function context(
  phase: GamePhase,
  runState: RunState | null = null,
): CommandContext {
  return {
    phase,
    playerName: 'storm',
    runState,
  }
}

describe('command parser and normalization', () => {
  it.each([
    ['help', 'help'],
    [' HELP', 'help'],
    ['   help   ', 'help'],
    ['HeLp', 'help'],
    ['  CHOOSE   1  ', 'choose 1'],
  ])('normalizes %j to %j', (input, normalizedInput) => {
    expect(parseKnown(input).normalizedInput).toBe(normalizedInput)
  })

  it('returns null for empty or whitespace-only input', () => {
    expect(parseCommand('')).toBeNull()
    expect(parseCommand(' \t  ')).toBeNull()
  })

  it('separates the command name from all arguments', () => {
    expect(parseKnown('choose 1 extra')).toEqual({
      name: 'choose',
      args: ['1', 'extra'],
      normalizedInput: 'choose 1 extra',
    })
  })

  it('rejects oversized input without reflecting its contents', () => {
    const dangerousSuffix = '&& shutdown'
    const result = parseCommand(
      `${'a'.repeat(MAX_TERMINAL_INPUT_LENGTH)}${dangerousSuffix}`,
    )

    expect(isCommandParseError(result)).toBe(true)
    expect(result).toEqual({
      type: 'input-too-long',
      message: `Input exceeds the ${MAX_TERMINAL_INPUT_LENGTH}-character terminal limit.`,
    })
    expect(JSON.stringify(result)).not.toContain(dangerousSuffix)
  })
})

describe('contextual command registry', () => {
  it.each<[GamePhase, string[]]>([
    ['booting', []],
    ['main-menu', ['start', 'controls', 'clear', 'help']],
    ['player-setup', ['controls', 'clear', 'help']],
    [
      'playing',
      ['inspect', 'choose', 'status', 'map', 'controls', 'clear', 'help'],
    ],
    ['victory', ['restart', 'menu', 'controls', 'clear', 'help']],
    ['defeat', ['restart', 'menu', 'controls', 'clear', 'help']],
  ])('returns the exact command set for %s', (phase, expected) => {
    expect(getAvailableCommandNames(phase)).toEqual(expected)
  })

  it.each<GamePhase>([
    'main-menu',
    'player-setup',
    'playing',
    'victory',
    'defeat',
  ])('help announces exactly the commands available in %s', (phase) => {
    const result = appendResult(
      resolveCommand(
        parseKnown('help'),
        context(phase, phase === 'playing' ? createInitialRunState() : null),
      ),
    )
    const helpText = result.messages.map((message) => message.text).join('\n')

    for (const commandName of getAvailableCommandNames(phase)) {
      expect(helpText).toContain(commandName)
    }
    expect(helpText).not.toContain('undefined')
  })

  it('reports a registered but unavailable command contextually', () => {
    const result = appendResult(
      resolveCommand(parseKnown('restart'), context('playing', createInitialRunState())),
    )

    expect(result.messages[0].text).toContain(
      'Command unavailable in the current context',
    )
    expect(result.nextPhase).toBeUndefined()
  })

  it.each(['rm -rf /', 'unknown', 'shutdown'])(
    'rejects unknown input %j without a state transition',
    (input) => {
      const result = appendResult(
        resolveCommand(parseKnown(input), context('main-menu')),
      )

      expect(result.messages[0].text).toContain('Command not recognized')
      expect(result.nextPhase).toBeUndefined()
      expect(result.nextRunState).toBeUndefined()
    },
  )

  it('rejects unexpected arguments instead of partially executing a command', () => {
    const result = appendResult(
      resolveCommand(
        parseKnown('start && shutdown'),
        context('main-menu'),
      ),
    )

    expect(result.messages[0].text).toBe(
      'Unexpected arguments. Usage: start',
    )
    expect(result.nextPhase).toBeUndefined()
    expect(result.nextRunState).toBeUndefined()
  })

  it.each([
    ['choose', 'Usage: choose <option-number>'],
    ['choose abc', 'Usage: choose <option-number>'],
    ['choose -1', 'Usage: choose <option-number>'],
    ['choose 1 extra', 'Usage: choose <option-number>'],
    ['choose 0', 'Option unavailable: 0'],
    ['choose 999', 'Option unavailable: 999'],
  ])('validates %j safely', (input, expectedMessage) => {
    const initial = createInitialRunState()
    const inspected = appendResult(
      resolveCommand(parseKnown('inspect'), context('playing', initial)),
    ).nextRunState
    const result = appendResult(
      resolveCommand(
        parseKnown(input),
        context('playing', inspected ?? initial),
      ),
    )

    expect(result.messages[0].text).toBe(expectedMessage)
    expect(result.nextPhase).toBeUndefined()
  })

  it.each<GamePhase>([
    'main-menu',
    'player-setup',
    'playing',
    'victory',
    'defeat',
  ])('keeps controls and clear available in %s', (phase) => {
    const runState = phase === 'playing' ? createInitialRunState() : null
    expect(
      resolveCommand(parseKnown('controls'), context(phase, runState)).type,
    ).toBe('append')
    expect(
      resolveCommand(parseKnown('clear'), context(phase, runState)).type,
    ).toBe('clear')
  })
})

describe('application command transitions', () => {
  it('start enters player setup when no operator exists', () => {
    const result = appendResult(
      resolveCommand(parseKnown('start'), {
        phase: 'main-menu',
        playerName: null,
        runState: null,
      }),
    )

    expect(result.nextPhase).toBe('player-setup')
    expect(result.nextRunState).toBeUndefined()
  })

  it('start creates a fresh run for a restored operator', () => {
    const result = appendResult(
      resolveCommand(parseKnown('start'), context('main-menu')),
    )

    expect(result.nextPhase).toBe('playing')
    expect(result.nextRunState).toEqual(createInitialRunState())
  })

  it.each(['playing', 'victory'] satisfies GamePhase[])(
    'start cannot run during %s',
    (phase) => {
      const result = appendResult(
        resolveCommand(
          parseKnown('start'),
          context(phase, createInitialRunState()),
        ),
      )
      expect(result.nextPhase).toBeUndefined()
    },
  )

  it.each(['restart', 'menu'])(
    '%s cannot run while gameplay is active',
    (commandName) => {
      const result = appendResult(
        resolveCommand(
          parseKnown(commandName),
          context('playing', createInitialRunState()),
        ),
      )
      expect(result.nextPhase).toBeUndefined()
      expect(result.nextRunState).toBeUndefined()
    },
  )

  it.each(['victory', 'defeat'] satisfies GamePhase[])(
    'restart preserves the operator and resets all run state after %s',
    (phase) => {
      const finishedState: RunState = {
        ...createInitialRunState(),
        integrity: 15,
        currentNodeIndex: 3,
        completedNodeIds: ['NODE_00', 'NODE_01', 'NODE_02'],
        correctActions: 2,
        failedActions: 3,
        bossPhase: 2,
      }
      const result = appendResult(
        resolveCommand(
          parseKnown('restart'),
          context(phase, finishedState),
        ),
      )

      expect(result.nextPhase).toBe('playing')
      expect(result.nextRunState).toEqual(createInitialRunState())
      expect(result.messages[0].text).toContain('storm')
    },
  )

  it.each(['victory', 'defeat'] satisfies GamePhase[])(
    'menu preserves the operator while discarding temporary run state after %s',
    (phase) => {
      const result = appendResult(
        resolveCommand(
          parseKnown('menu'),
          context(phase, createInitialRunState()),
        ),
      )

      expect(result.nextPhase).toBe('main-menu')
      expect(result.nextRunState).toBeNull()
      expect(result.messages.some((message) =>
        message.text.includes('Operator profile retained'),
      )).toBe(true)
    },
  )

  it.each(['victory', 'defeat'] satisfies GamePhase[])(
    'blocks gameplay commands after %s without mutating statistics',
    (phase) => {
      const finishedState: RunState = {
        ...createInitialRunState(),
        correctActions: 4,
        failedActions: 2,
      }

      for (const input of ['inspect', 'choose 1', 'status', 'map']) {
        const result = appendResult(
          resolveCommand(
            parseKnown(input),
            context(phase, finishedState),
          ),
        )
        expect(result.nextRunState).toBeUndefined()
        expect(result.nextPhase).toBeUndefined()
        expect(finishedState.correctActions).toBe(4)
        expect(finishedState.failedActions).toBe(2)
      }
    },
  )
})
