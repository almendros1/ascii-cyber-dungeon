import {
  DUNGEON_MAP_NODES,
  STANDARD_NODES,
  type DungeonNode,
  type DungeonNodeId,
  type NodeOption,
} from './dungeonNodes'
import {
  getRootWardenPhase,
  type BossPhase,
} from './rootDaemon'

export const MAX_INTEGRITY = 100
export const TOTAL_DUNGEON_NODES = DUNGEON_MAP_NODES.length
const ROOT_DAEMON_INDEX = DUNGEON_MAP_NODES.length - 1

export type RunNodeState =
  | 'awaiting-inspection'
  | 'awaiting-choice'
  | 'resolved'

export type RunOutcome = 'victory' | 'defeat'

/**
 * Complete state for the fixed, local MVP run.
 *
 * Completed IDs are the durable progress record. Statistics and encounter
 * flags are updated only by the pure resolution functions in this module.
 */
export interface RunState {
  currentNodeIndex: number
  integrity: number
  maxIntegrity: number
  completedNodeIds: DungeonNodeId[]
  currentNodeState: RunNodeState
  currentObjective: string
  selectedOption: number | null
  currentNodeInspected: boolean
  currentNodeResolved: boolean
  correctActions: number
  failedActions: number
  bossPhase: 1 | 2
}

export interface RunMessage {
  type:
    | 'heading'
    | 'system'
    | 'information'
    | 'warning'
    | 'error'
    | 'success'
  text: string
}

export interface RunActionResult {
  state: RunState
  messages: RunMessage[]
  outcome?: RunOutcome
}

export type ChooseArgumentValidation =
  | { valid: true; optionId: number }
  | { valid: false; message: string }

interface CurrentEncounter {
  nodeId: DungeonNodeId
  name: string
  initialObjective: string
  inspectedObjective: string
  inspection: string[]
  options: NodeOption[]
  correctOptionId?: number
  explanation?: string
}

export function createInitialRunState(): RunState {
  return {
    currentNodeIndex: 0,
    integrity: MAX_INTEGRITY,
    maxIntegrity: MAX_INTEGRITY,
    completedNodeIds: [],
    currentNodeState: 'awaiting-inspection',
    currentObjective: STANDARD_NODES[0].initialObjective,
    selectedOption: null,
    currentNodeInspected: false,
    currentNodeResolved: false,
    correctActions: 0,
    failedActions: 0,
    bossPhase: 1,
  }
}

function getStandardNode(state: RunState): DungeonNode | null {
  return STANDARD_NODES[state.currentNodeIndex] ?? null
}

function getCurrentBossPhase(state: RunState): BossPhase {
  return getRootWardenPhase(state.bossPhase)
}

function getCurrentEncounter(state: RunState): CurrentEncounter {
  const standardNode = getStandardNode(state)

  if (standardNode) {
    return {
      nodeId: standardNode.id,
      name: standardNode.name,
      initialObjective: standardNode.initialObjective,
      inspectedObjective: standardNode.inspectedObjective,
      inspection: standardNode.inspection,
      options: standardNode.options,
      correctOptionId: standardNode.correctOptionId,
      explanation: standardNode.explanation,
    }
  }

  const bossPhase = getCurrentBossPhase(state)

  return {
    nodeId: 'NODE_03',
    name: 'Root Daemon',
    initialObjective: bossPhase.initialObjective,
    inspectedObjective: bossPhase.inspectedObjective,
    inspection: bossPhase.inspection,
    options: bossPhase.options,
    correctOptionId: bossPhase.correctOptionId,
    explanation: bossPhase.explanation,
  }
}

/**
 * Applies every integrity change through one clamped calculation.
 *
 * Encounter rules provide deltas, never final values, so integrity cannot
 * escape the inclusive 0–100 range.
 */
export function applyIntegrityDelta(
  currentIntegrity: number,
  delta: number,
): number {
  return Math.min(
    MAX_INTEGRITY,
    Math.max(0, currentIntegrity + delta),
  )
}

export function createNodeIntroduction(node: DungeonNode): RunMessage[] {
  return [
    {
      type: 'heading',
      text: `[${node.id}] ${node.name.toUpperCase()}`,
    },
    ...node.intro.map((text) => ({
      type: 'information' as const,
      text,
    })),
  ]
}

function createRootDaemonIntroduction(phase: 1 | 2): RunMessage[] {
  const bossPhase = getRootWardenPhase(phase)

  return [
    {
      type: 'heading',
      text: '[NODE_03] ROOT DAEMON',
    },
    ...bossPhase.intro.map((text) => ({
      type: 'information' as const,
      text,
    })),
  ]
}

/**
 * Reveals only predefined local encounter data. Repeated inspection is safe,
 * does not change statistics and never executes submitted terminal text.
 */
export function inspectCurrentNode(state: RunState): RunActionResult {
  if (state.currentNodeResolved) {
    return {
      state,
      messages: [
        {
          type: 'information',
          text: 'Current encounter already resolved.',
        },
      ],
    }
  }

  const encounter = getCurrentEncounter(state)
  const nextState = state.currentNodeInspected
    ? state
    : {
        ...state,
        currentNodeState: 'awaiting-choice' as const,
        currentObjective: encounter.inspectedObjective,
        currentNodeInspected: true,
      }

  return {
    state: nextState,
    messages: encounter.inspection.map((text) => ({
      type: 'information',
      text,
    })),
  }
}

/**
 * Validates `choose` syntax as plain data. The accepted result is only an
 * integer option ID and is never evaluated or forwarded outside the game.
 */
export function validateChooseArguments(
  args: string[],
): ChooseArgumentValidation {
  if (args.length !== 1 || !/^\d+$/.test(args[0])) {
    return {
      valid: false,
      message: 'Usage: choose <option-number>',
    }
  }

  return {
    valid: true,
    optionId: Number(args[0]),
  }
}

function createConsequenceMessages(
  option: NodeOption,
  encounter: CurrentEncounter,
  nextIntegrity: number,
): RunMessage[] {
  const messages: RunMessage[] = [
    ...option.feedback,
    ...(option.integrityDelta < 0
      ? [
          {
            type: 'warning' as const,
            text: `[INTEGRITY] Connection integrity reduced by ${Math.abs(option.integrityDelta)}. Current integrity: ${nextIntegrity}/${MAX_INTEGRITY}.`,
          },
        ]
      : [
          {
            type: 'information' as const,
            text: `[INTEGRITY] Connection stable at ${nextIntegrity}/${MAX_INTEGRITY}.`,
          },
        ]),
  ]

  if (!option.isCorrect && encounter.correctOptionId !== undefined) {
    const correctOption = encounter.options.find(
      (candidate) => candidate.id === encounter.correctOptionId,
    )

    if (correctOption) {
      messages.push({
        type: 'information',
        text: `[ANSWER] Correct response: [${correctOption.id}] ${correctOption.label}.`,
      })
    }
  }

  if (encounter.explanation) {
    messages.push({
      type: 'information',
      text: `[EXPLANATION] ${encounter.explanation}`,
    })
  }

  return messages
}

function createResolvedActionState(
  state: RunState,
  option: NodeOption,
  nextIntegrity: number,
): RunState {
  // Exactly one statistic changes for each resolved encounter choice.
  return {
    ...state,
    integrity: nextIntegrity,
    selectedOption: option.id,
    currentNodeResolved: true,
    currentNodeState: 'resolved',
    correctActions:
      state.correctActions + (option.isCorrect ? 1 : 0),
    failedActions:
      state.failedActions + (option.isCorrect ? 0 : 1),
  }
}

/**
 * Resolves one declared option at most once and performs the fixed transition.
 *
 * A fatal integrity result is returned immediately without completing or
 * advancing the current node. The caller moves the application to `defeat`,
 * which removes gameplay commands from the active command context.
 */
export function chooseCurrentNodeOption(
  state: RunState,
  args: string[],
): RunActionResult {
  const validation = validateChooseArguments(args)

  if (!validation.valid) {
    return {
      state,
      messages: [{ type: 'error', text: validation.message }],
    }
  }

  if (state.currentNodeResolved) {
    return {
      state,
      messages: [
        { type: 'error', text: 'Current encounter already resolved.' },
      ],
    }
  }

  if (!state.currentNodeInspected) {
    return {
      state,
      messages: [
        {
          type: 'error',
          text: 'Inspect the current node before choosing an action.',
        },
      ],
    }
  }

  const encounter = getCurrentEncounter(state)
  const option = encounter.options.find(
    (candidate) => candidate.id === validation.optionId,
  )

  if (!option) {
    return {
      state,
      messages: [
        {
          type: 'error',
          text: `Option unavailable: ${validation.optionId}`,
        },
      ],
    }
  }

  if (state.completedNodeIds.includes(encounter.nodeId)) {
    return {
      state,
      messages: [
        { type: 'error', text: 'Current node already resolved.' },
      ],
    }
  }

  const nextIntegrity = applyIntegrityDelta(
    state.integrity,
    option.integrityDelta,
  )
  const resolvedState = createResolvedActionState(
    state,
    option,
    nextIntegrity,
  )
  const consequenceMessages = createConsequenceMessages(
    option,
    encounter,
    nextIntegrity,
  )

  if (nextIntegrity === 0) {
    return {
      state: resolvedState,
      messages: consequenceMessages,
      outcome: 'defeat',
    }
  }

  if (state.currentNodeIndex === ROOT_DAEMON_INDEX) {
    return resolveRootDaemonPhase(resolvedState, consequenceMessages)
  }

  return advanceToNextNode(
    resolvedState,
    encounter.nodeId,
    consequenceMessages,
  )
}

function advanceToNextNode(
  state: RunState,
  completedNodeId: DungeonNodeId,
  messages: RunMessage[],
): RunActionResult {
  const nextNodeIndex = state.currentNodeIndex + 1
  const completedNodeIds = [...state.completedNodeIds, completedNodeId]
  const nextNode = STANDARD_NODES[nextNodeIndex]

  if (nextNode) {
    return {
      state: {
        ...state,
        currentNodeIndex: nextNodeIndex,
        completedNodeIds,
        currentNodeState: 'awaiting-inspection',
        currentObjective: nextNode.initialObjective,
        selectedOption: null,
        currentNodeInspected: false,
        currentNodeResolved: false,
      },
      messages: [
        ...messages,
        {
          type: 'system',
          text: `[NODE] ${completedNodeId} complete. Advancing to ${nextNode.id}.`,
        },
        ...createNodeIntroduction(nextNode),
      ],
    }
  }

  return {
    state: {
      ...state,
      currentNodeIndex: ROOT_DAEMON_INDEX,
      completedNodeIds,
      currentNodeState: 'awaiting-inspection',
      currentObjective: getRootWardenPhase(1).initialObjective,
      selectedOption: null,
      currentNodeInspected: false,
      currentNodeResolved: false,
      bossPhase: 1,
    },
    messages: [
      ...messages,
      {
        type: 'system',
        text: `[NODE] ${completedNodeId} complete. Advancing to NODE_03.`,
      },
      ...createRootDaemonIntroduction(1),
    ],
  }
}

/**
 * Advances the boss from phase 1 to phase 2, or completes NODE_03 after the
 * second survived choice. No free turns or automatic attacks exist.
 */
function resolveRootDaemonPhase(
  state: RunState,
  messages: RunMessage[],
): RunActionResult {
  if (state.bossPhase === 1) {
    const nextBossPhase = getRootWardenPhase(2)

    return {
      state: {
        ...state,
        currentNodeState: 'awaiting-inspection',
        currentObjective: nextBossPhase.initialObjective,
        selectedOption: null,
        currentNodeInspected: false,
        currentNodeResolved: false,
        bossPhase: 2,
      },
      messages: [
        ...messages,
        {
          type: 'system',
          text: '[DAEMON] ROOT_WARDEN phase 1 resolved.',
        },
        ...createRootDaemonIntroduction(2),
      ],
    }
  }

  return {
    state: {
      ...state,
      completedNodeIds: [...state.completedNodeIds, 'NODE_03'],
      currentObjective: 'Initial dungeon sector secured',
    },
    messages,
    outcome: 'victory',
  }
}

const NODE_STATE_LABELS: Record<RunNodeState, string> = {
  'awaiting-inspection': 'Awaiting inspection',
  'awaiting-choice': 'Awaiting choice',
  resolved: 'Resolved',
}

export function createRunStatusMessages(
  operatorName: string,
  state: RunState,
): RunMessage[] {
  const mapNode = DUNGEON_MAP_NODES[state.currentNodeIndex]
  const messages: RunMessage[] = [
    { type: 'heading', text: 'RUN STATUS' },
    { type: 'information', text: `Operator: ${operatorName}` },
    {
      type: 'information',
      text: `Node: ${mapNode.id} — ${mapNode.name}`,
    },
    {
      type: 'information',
      text: `Integrity: ${state.integrity}/${state.maxIntegrity}`,
    },
    {
      type: 'information',
      text: `Progress: ${state.completedNodeIds.length}/${TOTAL_DUNGEON_NODES}`,
    },
    {
      type: 'information',
      text: `Objective: ${state.currentObjective}`,
    },
    {
      type: 'information',
      text: `Node state: ${NODE_STATE_LABELS[state.currentNodeState]}`,
    },
  ]

  if (state.currentNodeIndex === ROOT_DAEMON_INDEX) {
    messages.push(
      {
        type: 'information',
        text: `Daemon: ROOT_WARDEN`,
      },
      {
        type: 'information',
        text: `Phase: ${state.bossPhase}/2`,
      },
      {
        type: 'information',
        text: `Phases remaining: ${3 - state.bossPhase}`,
      },
    )
  }

  return messages
}

/**
 * Derives the fixed ASCII map exclusively from completed IDs and current node.
 */
export function createDungeonMap(state: RunState): string {
  const completed = new Set<DungeonNodeId>(state.completedNodeIds)

  return DUNGEON_MAP_NODES.map((node, index) => {
    const symbol = completed.has(node.id)
      ? '[✓]'
      : index === state.currentNodeIndex
        ? '[>]'
        : '[ ]'
    const nodeLine = `${symbol} ${node.id} — ${node.name}`

    return index < DUNGEON_MAP_NODES.length - 1
      ? `${nodeLine}\n |`
      : nodeLine
  }).join('\n')
}

/**
 * Builds result output from the final state so totals are never duplicated.
 */
export function createRunSummaryMessages(
  operatorName: string,
  outcome: RunOutcome,
  state: RunState,
): RunMessage[] {
  const victory = outcome === 'victory'

  return [
    {
      type: victory ? 'success' : 'heading',
      text: victory
        ? 'ROOT_WARDEN TERMINATED'
        : '[FAILURE] CONNECTION INTEGRITY LOST',
    },
    {
      type: 'system',
      text: victory
        ? '[STATUS] Initial dungeon sector secured.'
        : '[STATUS] Session terminated by hostile daemon.',
    },
    {
      type: 'heading',
      text: victory ? 'RUN COMPLETE' : 'RUN FAILED',
    },
    { type: 'information', text: `Operator: ${operatorName}` },
    {
      type: 'information',
      text: `Result: ${victory ? 'Victory' : 'Defeat'}`,
    },
    {
      type: 'information',
      text: `Nodes completed: ${state.completedNodeIds.length}/${TOTAL_DUNGEON_NODES}`,
    },
    {
      type: 'information',
      text: `Correct actions: ${state.correctActions}`,
    },
    {
      type: 'information',
      text: `Failed actions: ${state.failedActions}`,
    },
    {
      type: 'information',
      text: `Integrity remaining: ${state.integrity}/${state.maxIntegrity}`,
    },
    {
      type: 'information',
      text: victory
        ? 'Type RESTART to run again.'
        : 'Type RESTART to try again.',
    },
    {
      type: 'information',
      text: 'Type MENU to return to the main menu.',
    },
  ]
}
