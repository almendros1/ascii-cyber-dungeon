import type { GamePhase } from '../game/gamePhase'
import {
  chooseCurrentNodeOption,
  createDungeonMap,
  createInitialRunState,
  createNodeIntroduction,
  createRunStatusMessages,
  inspectCurrentNode,
  type RunState,
} from '../game/runState'
import { PLAYABLE_NODES } from '../game/dungeonNodes'

/**
 * Application-level messages rendered by the simulated terminal.
 *
 * The type is also exposed as a readable text label in the UI, so meaning does
 * not depend on colour alone.
 */
export type TerminalMessageType =
  | 'heading'
  | 'system'
  | 'command'
  | 'information'
  | 'warning'
  | 'error'
  | 'safety'
  | 'success'

export interface TerminalMessageDraft {
  type: TerminalMessageType
  text: string
}

export interface ParsedCommand {
  name: string
  args: string[]
  normalizedInput: string
}

export type CommandResult =
  | {
      type: 'append'
      messages: TerminalMessageDraft[]
      nextPhase?: GamePhase
      nextRunState?: RunState
    }
  | {
      type: 'clear'
    }

export interface CommandContext {
  phase: GamePhase
  playerName: string | null
  runState: RunState | null
}

interface TerminalCommand {
  name: string
  usage: string
  description: string
  availableIn: GamePhase[]
  execute: (
    context: CommandContext,
    command: ParsedCommand,
  ) => CommandResult
}

export const MAIN_MENU_MESSAGES: TerminalMessageDraft[] = [
  {
    type: 'heading',
    text: 'ASCII CYBER DUNGEON',
  },
  {
    type: 'system',
    text: 'Terminal access established.',
  },
  {
    type: 'information',
    text: 'Type HELP to list available commands.',
  },
]

/**
 * Converts raw text into a predictable application command.
 *
 * Surrounding whitespace is removed, repeated whitespace is collapsed and the
 * result is lowercased. Returning `null` for empty input lets the UI ignore it
 * without adding output or command-history entries.
 */
export function parseCommand(input: string): ParsedCommand | null {
  const normalizedInput = input.trim().replace(/\s+/g, ' ').toLowerCase()

  if (normalizedInput.length === 0) {
    return null
  }

  const [name, ...args] = normalizedInput.split(' ')

  return {
    name,
    args,
    normalizedInput,
  }
}

function createHelpResult(context: CommandContext): CommandResult {
  const availableCommands = COMMANDS.filter((command) =>
    command.availableIn.includes(context.phase),
  )

  const contextMessages: TerminalMessageDraft[] =
    context.phase === 'player-setup'
      ? [
          {
            type: 'information',
            text: 'Waiting for an operator name. Enter a valid name or use one of the actions below.',
          },
        ]
      : []

  return {
    type: 'append',
    messages: [
      ...contextMessages,
      {
        type: 'heading',
        text: 'AVAILABLE COMMANDS',
      },
      ...availableCommands.map(({ usage, description }) => ({
        type: 'information' as const,
        text: `${usage.padEnd(18)} ${description}`,
      })),
    ],
  }
}

function createControlsResult(context: CommandContext): CommandResult {
  const playingControls: TerminalMessageDraft[] =
    context.phase === 'playing'
      ? [
          {
            type: 'information',
            text: 'Use INSPECT to analyse the current node.',
          },
          {
            type: 'information',
            text: 'Use CHOOSE <number> to select an available option.',
          },
          {
            type: 'information',
            text: 'Use STATUS to review integrity and the current objective.',
          },
          {
            type: 'information',
            text: 'Use MAP to view dungeon progress.',
          },
        ]
      : []

  return {
    type: 'append',
    messages: [
      {
        type: 'heading',
        text: 'TERMINAL CONTROLS',
      },
      {
        type: 'information',
        text: 'Type a command and press ENTER.',
      },
      {
        type: 'information',
        text: 'Use HELP to list commands available in the current context.',
      },
      ...playingControls,
      {
        type: 'information',
        text: 'Use Arrow Up and Arrow Down to navigate submitted commands.',
      },
      {
        type: 'information',
        text: 'Use CLEAR to clear visible terminal output without resetting the session.',
      },
      {
        type: 'safety',
        text: 'All commands are simulated inside this application. No command is executed on your computer.',
      },
    ],
  }
}

export function createPlayingIntroduction(
  playerName: string,
  restored: boolean,
): TerminalMessageDraft[] {
  const identityMessage = restored
    ? `[IDENTITY] Restored operator profile: ${playerName}`
    : `[IDENTITY] Operator "${playerName}" registered.`

  return [
    {
      type: 'system',
      text: identityMessage,
    },
    {
      type: 'system',
      text: '[RUN] New infiltration session initialized.',
    },
    {
      type: 'information',
      text: 'Type HELP to list available commands.',
    },
    ...createNodeIntroduction(PLAYABLE_NODES[0]),
  ]
}

function requireRunState(context: CommandContext): RunState | null {
  return context.phase === 'playing' ? context.runState : null
}

/**
 * This registry is the terminal's complete security boundary. User input can
 * only select one of these in-memory handlers; it is never evaluated or passed
 * to an operating-system shell, process, filesystem or network API.
 */
const COMMANDS: TerminalCommand[] = [
  {
    name: 'help',
    usage: 'help',
    description: 'Show available commands',
    availableIn: ['main-menu', 'player-setup', 'playing'],
    execute: createHelpResult,
  },
  {
    name: 'controls',
    usage: 'controls',
    description: 'Show terminal and gameplay controls',
    availableIn: ['main-menu', 'player-setup', 'playing'],
    execute: createControlsResult,
  },
  {
    name: 'start',
    usage: 'start',
    description: 'Begin a new infiltration run',
    availableIn: ['main-menu'],
    execute: (context) => {
      if (context.playerName) {
        return {
          type: 'append',
          messages: createPlayingIntroduction(context.playerName, true),
          nextPhase: 'playing',
          nextRunState: createInitialRunState(),
        }
      }

      return {
        type: 'append',
        messages: [
          {
            type: 'system',
            text: '[IDENTITY] Operator profile required.',
          },
          {
            type: 'information',
            text: 'Enter an operator name to initialize the session.',
          },
        ],
        nextPhase: 'player-setup',
      }
    },
  },
  {
    name: 'clear',
    usage: 'clear',
    description: 'Clear terminal output',
    availableIn: ['main-menu', 'player-setup', 'playing'],
    execute: () => ({ type: 'clear' }),
  },
  {
    name: 'status',
    usage: 'status',
    description: 'Show current run status',
    availableIn: ['playing'],
    execute: (context) => {
      const runState = requireRunState(context)

      if (!runState || !context.playerName) {
        return {
          type: 'append',
          messages: [
            {
              type: 'error',
              text: 'Run state is unavailable. Start a new session from the main menu.',
            },
          ],
        }
      }

      return {
        type: 'append',
        messages: createRunStatusMessages(context.playerName, runState),
      }
    },
  },
  {
    name: 'map',
    usage: 'map',
    description: 'Show dungeon progress',
    availableIn: ['playing'],
    execute: (context) => {
      const runState = requireRunState(context)

      if (!runState) {
        return {
          type: 'append',
          messages: [
            {
              type: 'error',
              text: 'Run state is unavailable. Start a new session from the main menu.',
            },
          ],
        }
      }

      return {
        type: 'append',
        messages: [
          { type: 'heading', text: 'DUNGEON MAP' },
          { type: 'information', text: createDungeonMap(runState) },
          {
            type: 'information',
            text: '[✓] completed  [>] current  [ ] locked',
          },
        ],
      }
    },
  },
  {
    name: 'inspect',
    usage: 'inspect',
    description: 'Analyse the current node',
    availableIn: ['playing'],
    execute: (context) => {
      const runState = requireRunState(context)

      if (!runState) {
        return {
          type: 'append',
          messages: [
            {
              type: 'error',
              text: 'Run state is unavailable. Start a new session from the main menu.',
            },
          ],
        }
      }

      const result = inspectCurrentNode(runState)

      return {
        type: 'append',
        messages: result.messages,
        nextRunState: result.state,
      }
    },
  },
  {
    name: 'choose',
    usage: 'choose <number>',
    description: 'Select an available option',
    availableIn: ['playing'],
    execute: (context, command) => {
      const runState = requireRunState(context)

      if (!runState) {
        return {
          type: 'append',
          messages: [
            {
              type: 'error',
              text: 'Run state is unavailable. Start a new session from the main menu.',
            },
          ],
        }
      }

      const result = chooseCurrentNodeOption(runState, command.args)

      return {
        type: 'append',
        messages: result.messages,
        nextRunState: result.state,
      }
    },
  },
]

const COMMAND_REGISTRY = new Map(
  COMMANDS.map((command) => [command.name, command]),
)

export function isRegisteredCommandName(name: string): boolean {
  return COMMAND_REGISTRY.has(name)
}

/**
 * Resolves a parsed command exclusively through the explicit command registry.
 *
 * Unknown input produces display messages only. No branch executes arbitrary
 * JavaScript or forwards user text outside the React application.
 */
export function resolveCommand(
  command: ParsedCommand,
  context: CommandContext,
): CommandResult {
  const registeredCommand = COMMAND_REGISTRY.get(command.name)

  if (registeredCommand) {
    if (!registeredCommand.availableIn.includes(context.phase)) {
      return {
        type: 'append',
        messages: [
          {
            type: 'error',
            text: `Command unavailable in the current context: "${command.name}"`,
          },
          {
            type: 'information',
            text: 'Type HELP to list available commands.',
          },
        ],
      }
    }

    return registeredCommand.execute(context, command)
  }

  return {
    type: 'append',
    messages: [
      {
        type: 'error',
        text: `Command not recognized: "${command.normalizedInput}"`,
      },
      {
        type: 'information',
        text: 'Type HELP to list available commands.',
      },
    ],
  }
}
