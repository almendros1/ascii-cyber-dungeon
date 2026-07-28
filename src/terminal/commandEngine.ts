import type { GamePhase } from '../game/gamePhase'

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
    }
  | {
      type: 'clear'
    }

export interface CommandContext {
  phase: GamePhase
  playerName: string | null
}

interface TerminalCommand {
  name: string
  description: string
  availableIn: GamePhase[]
  execute: (context: CommandContext) => CommandResult
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
      ...availableCommands.map(({ name, description }) => ({
        type: 'information' as const,
        text: `${name.padEnd(10)} ${description}`,
      })),
    ],
  }
}

function createControlsResult(): CommandResult {
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
      text: '[NODE] Entry Gateway detected.',
    },
    {
      type: 'warning',
      text: '[NOTICE] Encounter systems will be activated in the next milestone.',
    },
    {
      type: 'information',
      text: 'Type HELP to list available commands.',
    },
  ]
}

/**
 * This registry is the terminal's complete security boundary. User input can
 * only select one of these in-memory handlers; it is never evaluated or passed
 * to an operating-system shell, process, filesystem or network API.
 */
const COMMANDS: TerminalCommand[] = [
  {
    name: 'help',
    description: 'Show available commands',
    availableIn: ['main-menu', 'player-setup', 'playing'],
    execute: createHelpResult,
  },
  {
    name: 'controls',
    description: 'Show terminal and gameplay controls',
    availableIn: ['main-menu', 'player-setup', 'playing'],
    execute: createControlsResult,
  },
  {
    name: 'start',
    description: 'Begin a new infiltration run',
    availableIn: ['main-menu'],
    execute: (context) => {
      if (context.playerName) {
        return {
          type: 'append',
          messages: createPlayingIntroduction(context.playerName, true),
          nextPhase: 'playing',
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
    description: 'Clear terminal output',
    availableIn: ['main-menu', 'player-setup', 'playing'],
    execute: () => ({ type: 'clear' }),
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

    return registeredCommand.execute(context)
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
