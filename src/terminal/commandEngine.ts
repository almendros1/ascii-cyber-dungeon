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
    }
  | {
      type: 'clear'
    }

interface TerminalCommand {
  name: string
  description: string
  execute: () => CommandResult
}

export const INITIAL_MESSAGES: TerminalMessageDraft[] = [
  {
    type: 'heading',
    text: 'ASCII CYBER DUNGEON // COMMAND ENGINE',
  },
  {
    type: 'system',
    text: 'Local simulation interface ready.',
  },
  {
    type: 'information',
    text: 'Type HELP to list available commands.',
  },
  {
    type: 'safety',
    text: 'Input remains inside this page and is never executed by your computer.',
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

function createHelpResult(): CommandResult {
  return {
    type: 'append',
    messages: [
      {
        type: 'heading',
        text: 'AVAILABLE COMMANDS',
      },
      ...COMMANDS.map(({ name, description }) => ({
        type: 'information' as const,
        text: `${name.padEnd(10)} ${description}`,
      })),
    ],
  }
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
    execute: createHelpResult,
  },
  {
    name: 'clear',
    description: 'Clear terminal output',
    execute: () => ({ type: 'clear' }),
  },
]

const COMMAND_REGISTRY = new Map(
  COMMANDS.map((command) => [command.name, command]),
)

/**
 * Resolves a parsed command exclusively through the explicit command registry.
 *
 * Unknown input produces display messages only. No branch executes arbitrary
 * JavaScript or forwards user text outside the React application.
 */
export function resolveCommand(command: ParsedCommand): CommandResult {
  const registeredCommand = COMMAND_REGISTRY.get(command.name)

  if (registeredCommand) {
    return registeredCommand.execute()
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
