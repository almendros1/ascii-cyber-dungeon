/**
 * Typed encounter content for the fixed Milestone 4 run.
 *
 * Only the first two nodes contain playable data. The remaining map entries
 * are labels for locked future milestones and cannot be resolved by commands.
 */

export type PlayableNodeId = 'NODE_00' | 'NODE_01'

export type MapNodeId =
  | PlayableNodeId
  | 'NODE_02'
  | 'NODE_03'

export interface NodeFeedback {
  type: 'success' | 'warning' | 'information'
  text: string
}

export interface NodeOption {
  id: number
  label: string
  description?: string
  integrityDelta: number
  feedback: NodeFeedback[]
  isCorrect?: boolean
}

export interface DungeonNode {
  id: PlayableNodeId
  name: string
  type: 'choice' | 'challenge'
  intro: string[]
  initialObjective: string
  inspection: string[]
  inspectedObjective: string
  options: NodeOption[]
  correctOptionId?: number
  explanation?: string
}

export interface DungeonMapNode {
  id: MapNodeId
  name: string
}

export const DUNGEON_MAP_NODES: DungeonMapNode[] = [
  { id: 'NODE_00', name: 'ENTRY_GATEWAY' },
  { id: 'NODE_01', name: 'PERMISSION_LOCK' },
  { id: 'NODE_02', name: 'PROCESS_CORRIDOR' },
  { id: 'NODE_03', name: 'ROOT_DAEMON' },
]

export const PLAYABLE_NODES: DungeonNode[] = [
  {
    id: 'NODE_00',
    name: 'Entry Gateway',
    type: 'choice',
    intro: [
      'A damaged authentication gateway blocks the route.',
      'Several access channels remain visible.',
      'Type INSPECT to analyse the node.',
    ],
    initialObjective: 'Inspect the access channels',
    inspection: [
      '[SCAN] Access channels detected.',
      '',
      '[1] Guest maintenance channel',
      '    Low risk. Stable route.',
      '',
      '[2] Corrupted administrator tunnel',
      '    High risk. Potential shortcut.',
      '',
      '[3] Public telemetry endpoint',
      '    Moderate risk. Exposed connection.',
      '',
      'Type CHOOSE <number> to select a channel.',
    ],
    inspectedObjective: 'Choose an access channel',
    options: [
      {
        id: 1,
        label: 'Guest maintenance channel',
        integrityDelta: 0,
        feedback: [
          {
            type: 'success',
            text: 'Maintenance channel accepted.',
          },
          {
            type: 'information',
            text: '[ROUTE] Gateway bypassed without integrity loss.',
          },
        ],
      },
      {
        id: 2,
        label: 'Corrupted administrator tunnel',
        integrityDelta: -25,
        feedback: [
          {
            type: 'warning',
            text: 'Administrative tunnel destabilized.',
          },
        ],
      },
      {
        id: 3,
        label: 'Public telemetry endpoint',
        integrityDelta: -10,
        feedback: [
          {
            type: 'information',
            text: '[ROUTE] Telemetry endpoint exposed a usable path.',
          },
        ],
      },
    ],
  },
  {
    id: 'NODE_01',
    name: 'Permission Lock',
    type: 'challenge',
    intro: [
      'A protected executable blocks access to the next sector.',
      'Type INSPECT to analyse file permissions.',
    ],
    initialObjective: 'Inspect the protected executable',
    inspection: [
      '[SCAN] Permission signature detected.',
      '',
      '-rwxr-x---',
      '',
      'Which identities can execute this file?',
      '',
      '[1] Owner and group',
      '[2] Owner only',
      '[3] Everyone',
      '[4] Group only',
      '',
      'Type CHOOSE <number> to submit your answer.',
    ],
    inspectedObjective: 'Identify who can execute the file',
    options: [
      {
        id: 1,
        label: 'Owner and group',
        integrityDelta: 0,
        isCorrect: true,
        feedback: [
          {
            type: 'success',
            text: 'Permission signature interpreted correctly.',
          },
        ],
      },
      {
        id: 2,
        label: 'Owner only',
        integrityDelta: -20,
        feedback: [
          {
            type: 'warning',
            text: 'Permission analysis rejected by the lock.',
          },
        ],
      },
      {
        id: 3,
        label: 'Everyone',
        integrityDelta: -20,
        feedback: [
          {
            type: 'warning',
            text: 'Permission analysis rejected by the lock.',
          },
        ],
      },
      {
        id: 4,
        label: 'Group only',
        integrityDelta: -20,
        feedback: [
          {
            type: 'warning',
            text: 'Permission analysis rejected by the lock.',
          },
        ],
      },
    ],
    correctOptionId: 1,
    explanation:
      'The owner has rwx permissions and the group has r-x permissions. Others have no permissions.',
  },
]
