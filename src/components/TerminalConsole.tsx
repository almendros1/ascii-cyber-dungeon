import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { GamePhase } from '../game/gamePhase'
import {
  createInitialRunState,
  type RunState,
} from '../game/runState'
import {
  isClearlySuspiciousOperatorInput,
  validateOperatorName,
} from '../player/playerName'
import {
  loadStoredPlayerName,
  savePlayerName,
} from '../player/playerStorage'
import {
  createPlayingIntroduction,
  isRegisteredCommandName,
  isCommandParseError,
  MAIN_MENU_MESSAGES,
  MAX_TERMINAL_INPUT_LENGTH,
  parseCommand,
  resolveCommand,
  type TerminalMessageDraft,
  type TerminalMessageType,
} from '../terminal/commandEngine'
import {
  appendCommandHistory,
  getNextHistoryEntry,
  getPreviousHistoryEntry,
} from '../terminal/commandHistory'
import {
  BOOT_MESSAGES,
  BOOT_MESSAGE_DELAY_MS,
} from '../terminal/bootSequence'

interface TerminalMessageInput extends TerminalMessageDraft {
  prompt?: string
}

interface TerminalMessage extends TerminalMessageInput {
  id: string
}

interface LiveAnnouncement {
  id: string
  text: string
}

const MESSAGE_LABELS: Partial<Record<TerminalMessageType, string>> = {
  system: 'SYSTEM',
  information: 'INFO',
  warning: 'WARNING',
  error: 'ERROR',
  safety: 'SAFETY',
  success: 'SUCCESS',
}

/**
 * Owns the browser-only terminal session: visible output, editable input and
 * submitted-command history. Command interpretation remains in commandEngine.
 */
export function TerminalConsole() {
  const [phase, setPhase] = useState<GamePhase>('booting')
  const [playerName, setPlayerName] = useState(loadStoredPlayerName)
  const [runState, setRunState] = useState<RunState | null>(null)
  const [messages, setMessages] = useState<TerminalMessage[]>([])
  const [liveAnnouncement, setLiveAnnouncement] =
    useState<LiveAnnouncement | null>(null)
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const historyDraftRef = useRef('')
  const nextMessageIdRef = useRef(0)
  const outputRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bootTimerIdsRef = useRef<number[]>([])
  const bootCompletedRef = useRef(false)
  const promptName = playerName ?? 'operator'

  useEffect(() => {
    const output = outputRef.current

    if (output) {
      output.scrollTop = output.scrollHeight
    }
  }, [messages])

  const addMessageIds = useCallback((
    newMessages: TerminalMessageInput[],
  ): TerminalMessage[] => {
    return newMessages.map((message) => ({
      ...message,
      id: `terminal-message-${nextMessageIdRef.current++}`,
    }))
  }, [])

  /**
   * Drives only fictional boot output. Every scheduled callback is recorded and
   * cleared when boot completes, is skipped or the component unmounts.
   */
  useEffect(() => {
    if (phase !== 'booting') {
      return
    }

    bootCompletedRef.current = false
    bootTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId))
    bootTimerIdsRef.current = []

    const enterMainMenu = () => {
      if (bootCompletedRef.current) {
        return
      }

      bootCompletedRef.current = true
      setMessages((currentMessages) => [
        ...currentMessages,
        ...addMessageIds(MAIN_MENU_MESSAGES),
      ])
      setPhase('main-menu')
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const reducedMotionTimerId = window.setTimeout(() => {
        bootCompletedRef.current = true
        setMessages(addMessageIds([...BOOT_MESSAGES, ...MAIN_MENU_MESSAGES]))
        setPhase('main-menu')
      }, 0)
      bootTimerIdsRef.current.push(reducedMotionTimerId)
    } else {
      BOOT_MESSAGES.forEach((message, index) => {
        const timerId = window.setTimeout(() => {
          if (!bootCompletedRef.current) {
            setMessages((currentMessages) => [
              ...currentMessages,
              ...addMessageIds([message]),
            ])
          }
        }, index * BOOT_MESSAGE_DELAY_MS)

        bootTimerIdsRef.current.push(timerId)
      })

      const completionTimerId = window.setTimeout(
        enterMainMenu,
        BOOT_MESSAGES.length * BOOT_MESSAGE_DELAY_MS,
      )
      bootTimerIdsRef.current.push(completionTimerId)
    }

    return () => {
      bootTimerIdsRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      )
      bootTimerIdsRef.current = []
    }
  }, [addMessageIds, phase])

  useEffect(() => {
    if (phase !== 'booting') {
      inputRef.current?.focus()
    }
  }, [phase])

  function appendMessages(newMessages: TerminalMessageInput[]) {
    const messagesWithIds = addMessageIds(newMessages)

    setMessages((currentMessages) => [
      ...currentMessages,
      ...messagesWithIds,
    ])

    // Announce only the newest meaningful result instead of replaying the
    // complete terminal history to assistive technology.
    const announcementMessage = [...messagesWithIds]
      .reverse()
      .find((message) =>
        ['heading', 'system', 'warning', 'error', 'safety', 'success'].includes(
          message.type,
        ),
      )

    if (announcementMessage) {
      const label = MESSAGE_LABELS[announcementMessage.type]
      setLiveAnnouncement({
        id: announcementMessage.id,
        text: label
          ? `${label}: ${announcementMessage.text}`
          : announcementMessage.text,
      })
    }
  }

  function resetSubmittedInput() {
    setHistoryIndex(null)
    historyDraftRef.current = ''
    setInput('')
  }

  function submitOperatorName(rawInput: string) {
    const validation = validateOperatorName(rawInput)

    // Suspicious detection changes only the fictional response. Strict format
    // validation remains the primary rule and no submitted text is reflected.
    if (isClearlySuspiciousOperatorInput(rawInput)) {
      appendMessages([
        {
          type: 'safety',
          text: '[SECURITY] Injection attempt rejected.',
        },
        {
          type: 'warning',
          text: 'Did you really think that was going to work?',
        },
      ])
      resetSubmittedInput()
      return
    }

    if (!validation.valid) {
      appendMessages([
        {
          type: 'error',
          text: '[ERROR] Invalid operator name.',
        },
        {
          type: 'information',
          text: 'Use 2–20 characters. Start with a letter and use only letters, numbers, hyphens or underscores.',
        },
      ])
      resetSubmittedInput()
      return
    }

    const storageAvailable = savePlayerName(validation.value)

    setPlayerName(validation.value)
    setRunState(createInitialRunState())
    setPhase('playing')
    appendMessages([
      ...createPlayingIntroduction(validation.value, false),
      ...(storageAvailable
        ? []
        : [
            {
              type: 'warning' as const,
              text: '[WARNING] Operator profile is active for this session, but browser storage is unavailable.',
            },
          ]),
    ])
    resetSubmittedInput()
  }

  function submitCommand() {
    const parseResult = parseCommand(input)

    if (!parseResult) {
      inputRef.current?.focus()
      return
    }

    if (isCommandParseError(parseResult)) {
      appendMessages([
        {
          type: 'error',
          text: parseResult.message,
        },
      ])
      resetSubmittedInput()
      inputRef.current?.focus()
      return
    }

    const command = parseResult

    if (
      phase === 'player-setup' &&
      !isRegisteredCommandName(command.name)
    ) {
      submitOperatorName(input)
      inputRef.current?.focus()
      return
    }

    const result = resolveCommand(command, {
      phase,
      playerName,
      runState,
    })

    setCommandHistory((history) =>
      appendCommandHistory(history, command.normalizedInput),
    )
    resetSubmittedInput()

    if (result.type === 'clear') {
      setMessages([])
      setLiveAnnouncement(null)
    } else {
      appendMessages([
        {
          type: 'command',
          text: command.normalizedInput,
          prompt: promptName,
        },
        ...result.messages,
      ])

      if (result.nextPhase) {
        setPhase(result.nextPhase)
      }

      if (result.nextRunState !== undefined) {
        setRunState(result.nextRunState)
      }
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
      const previousEntry = getPreviousHistoryEntry(
        commandHistory,
        historyIndex,
      )

      if (!previousEntry) {
        return
      }

      event.preventDefault()

      if (historyIndex === null) {
        historyDraftRef.current = input
      }

      setHistoryIndex(previousEntry.index)
      setInput(previousEntry.value)
      return
    }

    if (event.key === 'ArrowDown') {
      const nextEntry = getNextHistoryEntry(
        commandHistory,
        historyIndex,
        historyDraftRef.current,
      )

      if (nextEntry) {
        event.preventDefault()
        setHistoryIndex(nextEntry.index)
        setInput(nextEntry.value)
      }
    }
  }

  function skipBootSequence() {
    if (phase !== 'booting' || bootCompletedRef.current) {
      return
    }

    bootCompletedRef.current = true
    bootTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId))
    bootTimerIdsRef.current = []
    appendMessages(MAIN_MENU_MESSAGES)
    setPhase('main-menu')
  }

  return (
    <>
      <section
        className={`terminal-output terminal-output--${phase}`}
        ref={outputRef}
        role="region"
        aria-label="Terminal output"
        aria-busy={phase === 'booting'}
        tabIndex={0}
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
                  {message.prompt ?? 'operator'}@acd:~${' '}
                </span>
              )}
              {label && <span className="output-tag">[{label}] </span>}
              {message.text}
            </p>
          )
        })}
      </section>

      <div
        className="visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement && (
          <span key={liveAnnouncement.id}>{liveAnnouncement.text}</span>
        )}
      </div>

      {phase === 'booting' ? (
        <div className="terminal-boot-actions">
          <button
            className="boot-skip-button"
            type="button"
            onClick={skipBootSequence}
            autoFocus
          >
            Skip boot sequence
          </button>
        </div>
      ) : (
        <form className="terminal-command-line" onSubmit={handleSubmit}>
          <span className="terminal-prompt" aria-hidden="true">
            {promptName}@acd:~$
          </span>
          <span className="input-indicator" aria-hidden="true" />
          <label className="visually-hidden" htmlFor="terminal-input">
            {phase === 'player-setup'
              ? 'Operator name input'
              : 'Terminal command input'}
          </label>
          <input
            className="terminal-input"
            id="terminal-input"
            ref={inputRef}
            name="terminal-input"
            type="text"
            maxLength={MAX_TERMINAL_INPUT_LENGTH}
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
            Enter a simulated command and press Enter. Use Arrow Up and Arrow
            Down to navigate submitted commands.
          </span>
        </form>
      )}
    </>
  )
}
