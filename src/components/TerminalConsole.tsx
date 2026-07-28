import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  INITIAL_MESSAGES,
  parseCommand,
  resolveCommand,
  type TerminalMessageDraft,
  type TerminalMessageType,
} from '../terminal/commandEngine'

interface TerminalMessage extends TerminalMessageDraft {
  id: string
}

const MESSAGE_LABELS: Partial<Record<TerminalMessageType, string>> = {
  system: 'SYSTEM',
  information: 'INFO',
  warning: 'WARNING',
  error: 'ERROR',
  safety: 'SAFETY',
}

function createInitialMessages(): TerminalMessage[] {
  return INITIAL_MESSAGES.map((message, index) => ({
    ...message,
    id: `initial-message-${index}`,
  }))
}

/**
 * Owns the browser-only terminal session: visible output, editable input and
 * submitted-command history. Command interpretation remains in commandEngine.
 */
export function TerminalConsole() {
  const [messages, setMessages] = useState(createInitialMessages)
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const historyDraftRef = useRef('')
  const nextMessageIdRef = useRef(0)
  const outputRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const output = outputRef.current

    if (output) {
      output.scrollTop = output.scrollHeight
    }
  }, [messages])

  function addMessageIds(
    newMessages: TerminalMessageDraft[],
  ): TerminalMessage[] {
    return newMessages.map((message) => ({
      ...message,
      id: `terminal-message-${nextMessageIdRef.current++}`,
    }))
  }

  function submitCommand() {
    const command = parseCommand(input)

    if (!command) {
      inputRef.current?.focus()
      return
    }

    const result = resolveCommand(command)

    setCommandHistory((history) => [...history, command.normalizedInput])
    setHistoryIndex(null)
    historyDraftRef.current = ''
    setInput('')

    if (result.type === 'clear') {
      setMessages([])
    } else {
      setMessages((currentMessages) => [
        ...currentMessages,
        ...addMessageIds([
          {
            type: 'command',
            text: command.normalizedInput,
          },
          ...result.messages,
        ]),
      ])
    }

    inputRef.current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitCommand()
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submitCommand()
      return
    }

    if (event.key === 'ArrowUp') {
      if (commandHistory.length === 0) {
        return
      }

      event.preventDefault()

      const nextIndex =
        historyIndex === null
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1)

      if (historyIndex === null) {
        historyDraftRef.current = input
      }

      setHistoryIndex(nextIndex)
      setInput(commandHistory[nextIndex])
      return
    }

    if (event.key === 'ArrowDown' && historyIndex !== null) {
      event.preventDefault()

      if (historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1
        setHistoryIndex(nextIndex)
        setInput(commandHistory[nextIndex])
      } else {
        setHistoryIndex(null)
        setInput(historyDraftRef.current)
      }
    }
  }

  return (
    <>
      <section
        className="terminal-output"
        ref={outputRef}
        role="log"
        aria-label="Terminal output"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.map((message) => {
          const label = MESSAGE_LABELS[message.type]

          return (
            <p
              className={`output-line output-line--${message.type}`}
              key={message.id}
            >
              {message.type === 'command' && (
                <span className="output-command-prompt">
                  operator@acd:~${'$ '}
                </span>
              )}
              {label && <span className="output-tag">[{label}] </span>}
              {message.text}
            </p>
          )
        })}
      </section>

      <form className="terminal-command-line" onSubmit={handleSubmit}>
        <span className="terminal-prompt" aria-hidden="true">
          operator@acd:~$
        </span>
        <span className="input-indicator" aria-hidden="true" />
        <label className="visually-hidden" htmlFor="terminal-input">
          Terminal command input
        </label>
        <input
          className="terminal-input"
          id="terminal-input"
          ref={inputRef}
          name="terminal-input"
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setHistoryIndex(null)
          }}
          onKeyDown={handleInputKeyDown}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          aria-describedby="terminal-input-description"
          autoFocus
        />
        <span className="visually-hidden" id="terminal-input-description">
          Enter a simulated command and press Enter. Use Arrow Up and Arrow Down
          to navigate submitted commands.
        </span>
      </form>
    </>
  )
}
