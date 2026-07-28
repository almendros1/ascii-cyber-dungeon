import {
  DUNGEON_MAP_NODES,
  PLAYABLE_NODES,
  type DungeonNode,
  type PlayableNodeId,
} from './dungeonNodes'

export const MAX_INTEGRITY = 100
export const TOTAL_DUNGEON_NODES = DUNGEON_MAP_NODES.length

export type RunNodeState =
  | 'awaiting-inspection'
  | 'awaiting-choice'
  | 'resolved'
  | 'segment-complete'

/**
 * State for the fixed, local run segment implemented in Milestone 4.
 *
 * Encounter flags describe only the current node. Completed node IDs provide
 * the durable progress record used by status, map and duplicate-resolution
 * checks while the page remains open.
 */
export interface RunState {
  currentNodeIndex: number
  integrity: number
  completedNodeIds: PlayableNodeId[]
  currentNodeState: RunNodeState
  currentObjective: string
  selectedOption: number | null
  currentNodeInspected: boolean
  currentNodeResolved: boolean
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
}

export type ChooseArgumentValidation =
  | { valid: true; optionId: number }
  | { valid: false; message: string }

export function createInitialRunState(): RunState {
  return {
    currentNodeIndex: 0,
    integrity: MAX_INTEGRITY,
    completedNodeIds: [],
    currentNodeState: 'awaiting-inspection',
    currentObjective: PLAYABLE_NODES[0].initialObjective,
    selectedOption: null,
    currentNodeInspected: false,
    currentNodeResolved: false,
  }
}

export function getCurrentNode(state: RunState): DungeonNode {
  return PLAYABLE_NODES[state.currentNodeIndex]
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

/**
 * Reveals encounter data without resolving it or applying consequences.
 * Repeated inspection returns the same readable content and leaves state safe.
 */
export function inspectCurrentNode(state: RunState): RunActionResult {
  if (
    state.currentNodeState === 'segment-complete' ||
    state.currentNodeResolved
  ) {
    return {
      state,
      messages: [
        {
          type: 'information',
          text: 'Current node already resolved. No further inspection is required.',
        },
        {
          type: 'warning',
          text: '[NOTICE] The next node is not available in this build.',
        },
      ],
    }
  }

  const node = getCurrentNode(state)
  const nextState = state.currentNodeInspected
    ? state
    : {
        ...state,
        currentNodeState: 'awaiting-choice' as const,
        currentObjective: node.inspectedObjective,
        currentNodeInspected: true,
      }

  return {
    state: nextState,
    messages: node.inspection.map((text) => ({
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

/**
 * Resolves one option at most once, applies its integrity delta and performs
 * the fixed transition from NODE_00 to NODE_01.
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

  if (
    state.currentNodeState === 'segment-complete' ||
    state.currentNodeResolved
  ) {
    return {
      state,
      messages: [
        { type: 'error', text: 'Current node already resolved.' },
        {
          type: 'warning',
          text: '[NOTICE] The next node is not available in this build.',
        },
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

  const node = getCurrentNode(state)
  const option = node.options.find(
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

  // Completed IDs are the durable guard against a node being resolved twice.
  if (state.completedNodeIds.includes(node.id)) {
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
  const completedNodeIds = [...state.completedNodeIds, node.id]
  const consequenceMessages: RunMessage[] = [
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

  if (node.correctOptionId !== undefined) {
    const correctOption = node.options.find(
      (candidate) => candidate.id === node.correctOptionId,
    )

    if (!option.isCorrect && correctOption) {
      consequenceMessages.push({
        type: 'information',
        text: `[ANSWER] Correct response: [${correctOption.id}] ${correctOption.label}.`,
      })
    }

    if (node.explanation) {
      consequenceMessages.push({
        type: 'information',
        text: `[EXPLANATION] ${node.explanation}`,
      })
    }
  }

  const nextNode = PLAYABLE_NODES[state.currentNodeIndex + 1]

  if (nextNode) {
    const nextState: RunState = {
      currentNodeIndex: state.currentNodeIndex + 1,
      integrity: nextIntegrity,
      completedNodeIds,
      currentNodeState: 'awaiting-inspection',
      currentObjective: nextNode.initialObjective,
      selectedOption: null,
      currentNodeInspected: false,
      currentNodeResolved: false,
    }

    return {
      state: nextState,
      messages: [
        ...consequenceMessages,
        {
          type: 'system',
          text: `[NODE] ${node.id} complete. Advancing to ${nextNode.id}.`,
        },
        ...createNodeIntroduction(nextNode),
      ],
    }
  }

  return {
    state: {
      ...state,
      integrity: nextIntegrity,
      completedNodeIds,
      currentNodeState: 'segment-complete',
      currentObjective: 'Review the cleared sector; Process Corridor is locked',
      selectedOption: option.id,
      currentNodeInspected: true,
      currentNodeResolved: true,
    },
    messages: [
      ...consequenceMessages,
      {
        type: 'success',
        text: 'Initial access sector cleared.',
      },
      {
        type: 'warning',
        text: '[NODE] Process Corridor remains locked for the next development milestone.',
      },
      {
        type: 'information',
        text: 'Type STATUS or MAP to review the run state.',
      },
    ],
  }
}

const NODE_STATE_LABELS: Record<RunNodeState, string> = {
  'awaiting-inspection': 'Awaiting inspection',
  'awaiting-choice': 'Awaiting choice',
  resolved: 'Resolved',
  'segment-complete': 'Initial segment complete',
}

export function createRunStatusMessages(
  operatorName: string,
  state: RunState,
): RunMessage[] {
  const node = getCurrentNode(state)

  return [
    { type: 'heading', text: 'RUN STATUS' },
    { type: 'information', text: `Operator: ${operatorName}` },
    {
      type: 'information',
      text: `Node: ${node.id} — ${node.name}`,
    },
    {
      type: 'information',
      text: `Integrity: ${state.integrity}/${MAX_INTEGRITY}`,
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
}

/**
 * Derives the fixed ASCII map from completed IDs and the current node index.
 * Future nodes remain locked because they have no playable encounter data.
 */
export function createDungeonMap(state: RunState): string {
  const completed = new Set<string>(state.completedNodeIds)

  return DUNGEON_MAP_NODES.map((node, index) => {
    const symbol = completed.has(node.id)
      ? '[✓]'
      : index === state.currentNodeIndex &&
          !state.currentNodeResolved &&
          index < PLAYABLE_NODES.length
        ? '[>]'
        : '[ ]'
    const nodeLine = `${symbol} ${node.id} — ${node.name}`

    return index < DUNGEON_MAP_NODES.length - 1
      ? `${nodeLine}\n |`
      : nodeLine
  }).join('\n')
}
