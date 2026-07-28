import type { NodeOption } from './dungeonNodes'

/**
 * One fixed ROOT_WARDEN phase. Content remains local data so terminal input
 * can only select declared options and can never become executable code.
 */
export interface BossPhase {
  phase: 1 | 2
  title: string
  initialObjective: string
  intro: string[]
  inspection: string[]
  inspectedObjective: string
  options: NodeOption[]
  correctOptionId: number
  explanation: string
}

export const ROOT_WARDEN_PHASES: BossPhase[] = [
  {
    phase: 1,
    title: 'External service anomaly',
    initialObjective: 'Inspect daemon phase 1',
    intro: [
      '[DAEMON] ROOT_WARDEN detected.',
      '[PHASE 1/2] External service anomaly.',
      'ROOT_WARDEN',
      'PHASES REMAINING: 2',
      '',
      'Type INSPECT to analyse the daemon activity.',
    ],
    inspection: [
      '[SCAN] A privileged process is listening on an unexpected public port.',
      '',
      'Choose the safest first response:',
      '',
      '[1] Inspect the process and service binding',
      '[2] Disable the firewall',
      '[3] Delete all system logs',
      '[4] Grant guest users administrative access',
      '',
      'Type CHOOSE <number> to submit your action.',
    ],
    inspectedObjective: 'Resolve daemon phase 1',
    options: [
      {
        id: 1,
        label: 'Inspect the process and service binding',
        integrityDelta: 0,
        isCorrect: true,
        feedback: [
          {
            type: 'success',
            text: 'Service binding analysis accepted.',
          },
        ],
      },
      {
        id: 2,
        label: 'Disable the firewall',
        integrityDelta: -25,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'Hostile daemon exploited the weakened defenses.',
          },
        ],
      },
      {
        id: 3,
        label: 'Delete all system logs',
        integrityDelta: -25,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'Destroyed evidence destabilized the response.',
          },
        ],
      },
      {
        id: 4,
        label: 'Grant guest users administrative access',
        integrityDelta: -25,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'Privilege escalation strengthened the hostile daemon.',
          },
        ],
      },
    ],
    correctOptionId: 1,
    explanation:
      'Inspecting the process and binding provides evidence before containment. Disabling defenses or destroying logs increases risk.',
  },
  {
    phase: 2,
    title: 'Persistence mechanism detected',
    initialObjective: 'Inspect daemon phase 2',
    intro: [
      '[PHASE 2/2] Persistence mechanism detected.',
      'ROOT_WARDEN',
      'PHASES REMAINING: 1',
      '',
      'Type INSPECT to analyse the startup service.',
    ],
    inspection: [
      '[SCAN] The daemon attempts to persist through a suspicious startup service.',
      '',
      'Choose the safest defensive action:',
      '',
      '[1] Disable and inspect the suspicious service',
      '[2] Run every file as administrator',
      '[3] Open all inbound ports',
      '[4] Ignore the persistence alert',
      '',
      'Type CHOOSE <number> to submit your action.',
    ],
    inspectedObjective: 'Resolve daemon phase 2',
    options: [
      {
        id: 1,
        label: 'Disable and inspect the suspicious service',
        integrityDelta: 0,
        isCorrect: true,
        feedback: [
          {
            type: 'success',
            text: 'Persistence service contained and preserved for inspection.',
          },
        ],
      },
      {
        id: 2,
        label: 'Run every file as administrator',
        integrityDelta: -25,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'Unrestricted execution destabilized the session.',
          },
        ],
      },
      {
        id: 3,
        label: 'Open all inbound ports',
        integrityDelta: -25,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'The exposed system amplified hostile traffic.',
          },
        ],
      },
      {
        id: 4,
        label: 'Ignore the persistence alert',
        integrityDelta: -25,
        isCorrect: false,
        feedback: [
          {
            type: 'warning',
            text: 'The ignored service reinforced daemon persistence.',
          },
        ],
      },
    ],
    correctOptionId: 1,
    explanation:
      'Disabling and inspecting the suspicious service contains persistence while preserving evidence for analysis.',
  },
]

export function getRootWardenPhase(phase: 1 | 2): BossPhase {
  return ROOT_WARDEN_PHASES[phase - 1]
}
