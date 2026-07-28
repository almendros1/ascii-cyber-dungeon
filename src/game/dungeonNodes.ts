/**
 * Typed encounter content for the fixed, linear MVP dungeon.
 *
 * Standard nodes are data-only challenges. ROOT_DAEMON uses the same option
 * shape but keeps its two phases in rootDaemon.ts.
 */

export type DungeonNodeId =
  | 'NODE_00'
  | 'NODE_01'
  | 'NODE_02'
  | 'NODE_03'

export type StandardNodeId = Exclude<DungeonNodeId, 'NODE_03'>

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
  id: StandardNodeId
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
  id: DungeonNodeId
  name: string
}

export const DUNGEON_MAP_NODES: DungeonMapNode[] = [
  { id: 'NODE_00', name: 'ENTRY_GATEWAY' },
  { id: 'NODE_01', name: 'PERMISSION_LOCK' },
  { id: 'NODE_02', name: 'PROCESS_CORRIDOR' },
  { id: 'NODE_03', name: 'ROOT_DAEMON' },
]

export const STANDARD_NODES: DungeonNode[] = [
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
        isCorrect: true,
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
        isCorrect: false,
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
        isCorrect: false,
        feedback: [
          {
            type: 'information',
            text: '[ROUTE] Telemetry endpoint exposed a usable path.',
          },
        ],
      },
    ],
    correctOptionId: 1,
    explanation:
      'The guest maintenance channel is the safest stable route. The other channels expose the connection to avoidable risk.',
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
  {
    id: 'NODE_02',
    name: 'Process Corridor',
    type: 'challenge',
    intro: [
      'An unknown process is consuming excessive CPU.',
      'The corridor remains unstable.',
      'Type INSPECT to analyse the process table.',
    ],
    initialObjective: 'Inspect the active process table',
    inspection: [
      '[SCAN] Active process table recovered.',
      '',
      'PID   USER    CPU   COMMAND',
      '412   root    92%   daemon_worker',
      '731   guest    3%   telemetry',
      '902   root     1%   logger',
      '',
      'Choose the safest first diagnostic action:',
      '',
      '[1] Inspect the process list and service details',
      '[2] Kill process 412 immediately',
      '[3] Change all filesystem permissions to 777',
      '[4] Delete the system logs',
      '',
      'Type CHOOSE <number> to submit your action.',
    ],
    inspectedObjective: 'Choose the safest process diagnostic action',
    options: [
      {
        id: 1,
        label: 'Inspect the process list and service details',
        integrityDelta: 0,
        isCorrect: true,
        feedback: [
          {
            type: 'success',
            text: 'Process inspection strategy accepted.',
          },
          {
            type: 'information',
            text: '[ROUTE] Hostile activity isolated without integrity loss.',
          },
        ],
      },
      {
        id: 2,
        label: 'Kill process 412 immediately',
        integrityDelta: -20,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'Unsafe response destabilized the session.',
          },
        ],
      },
      {
        id: 3,
        label: 'Change all filesystem permissions to 777',
        integrityDelta: -20,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'Unsafe response destabilized the session.',
          },
        ],
      },
      {
        id: 4,
        label: 'Delete the system logs',
        integrityDelta: -20,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'Unsafe response destabilized the session.',
          },
        ],
      },
    ],
    correctOptionId: 1,
    explanation:
      'A defensive first response should gather context before terminating a privileged process or modifying the system.',
  },
]
