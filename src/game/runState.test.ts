import { describe, expect, it } from 'vitest'
import {
  applyIntegrityDelta,
  chooseCurrentNodeOption,
  createDungeonMap,
  createInitialRunState,
  createRunStatusMessages,
  inspectCurrentNode,
  MAX_INTEGRITY,
  type RunActionResult,
  type RunState,
} from './runState'

function inspectAndChoose(
  state: RunState,
  optionId: number,
): RunActionResult {
  const inspected = inspectCurrentNode(state)
  return chooseCurrentNodeOption(inspected.state, [String(optionId)])
}

function reachNode(
  targetNodeIndex: number,
  optionId = 1,
): RunState {
  let state = createInitialRunState()

  while (state.currentNodeIndex < targetNodeIndex) {
    const result = inspectAndChoose(state, optionId)
    state = result.state
  }

  return state
}

function reachBossPhaseTwo(): RunState {
  const bossState = reachNode(3)
  return inspectAndChoose(bossState, 1).state
}

describe('integrity rules', () => {
  it('starts every run at 100 integrity', () => {
    const state = createInitialRunState()
    expect(state.integrity).toBe(100)
    expect(state.maxIntegrity).toBe(MAX_INTEGRITY)
  })

  it.each([
    [100, -20, 80],
    [20, -20, 0],
    [10, -25, 0],
    [95, 20, 100],
    [100, 0, 100],
  ])('clamps %i with delta %i to %i', (current, delta, expected) => {
    expect(applyIntegrityDelta(current, delta)).toBe(expected)
  })

  it('restart creates a new state with full integrity', () => {
    const damaged = inspectAndChoose(createInitialRunState(), 2).state
    expect(damaged.integrity).toBe(75)
    expect(createInitialRunState().integrity).toBe(100)
  })
})

describe('standard node resolution', () => {
  it('starts NODE_00 awaiting inspection', () => {
    const state = createInitialRunState()
    expect(state.currentNodeIndex).toBe(0)
    expect(state.currentNodeInspected).toBe(false)
    expect(state.currentNodeResolved).toBe(false)
    expect(state.currentNodeState).toBe('awaiting-inspection')
  })

  it('blocks choose before inspect without changing state', () => {
    const state = createInitialRunState()
    const result = chooseCurrentNodeOption(state, ['1'])
    expect(result.state).toBe(state)
    expect(result.messages[0].text).toContain('Inspect')
  })

  it('inspect reveals options without resolving or changing statistics', () => {
    const state = createInitialRunState()
    const result = inspectCurrentNode(state)

    expect(result.state.currentNodeInspected).toBe(true)
    expect(result.state.currentNodeResolved).toBe(false)
    expect(result.state.correctActions).toBe(0)
    expect(result.state.failedActions).toBe(0)
  })

  it('repeated inspect is idempotent', () => {
    const first = inspectCurrentNode(createInitialRunState())
    const second = inspectCurrentNode(first.state)

    expect(second.state).toBe(first.state)
    expect(second.state.currentNodeResolved).toBe(false)
  })

  it.each([
    [1, 100, 1, 0],
    [2, 75, 0, 1],
    [3, 90, 0, 1],
  ])(
    'applies NODE_00 option %i consequence and advances once',
    (optionId, integrity, correctActions, failedActions) => {
      const result = inspectAndChoose(createInitialRunState(), optionId)

      expect(result.state.integrity).toBe(integrity)
      expect(result.state.correctActions).toBe(correctActions)
      expect(result.state.failedActions).toBe(failedActions)
      expect(result.state.currentNodeIndex).toBe(1)
      expect(result.state.completedNodeIds).toEqual(['NODE_00'])
    },
  )

  it('does not resolve the previous node again after advancing', () => {
    const firstResult = inspectAndChoose(createInitialRunState(), 1)
    const repeatedChoice = chooseCurrentNodeOption(firstResult.state, ['1'])

    expect(repeatedChoice.state).toBe(firstResult.state)
    expect(repeatedChoice.state.completedNodeIds).toEqual(['NODE_00'])
    expect(repeatedChoice.state.correctActions).toBe(1)
  })

  it('NODE_01 explains permissions and advances to NODE_02', () => {
    const nodeOne = reachNode(1)
    const result = inspectAndChoose(nodeOne, 2)
    const output = result.messages.map((message) => message.text).join('\n')

    expect(output).toContain('[EXPLANATION]')
    expect(output).toContain('owner has rwx')
    expect(result.state.currentNodeIndex).toBe(2)
    expect(result.state.completedNodeIds).toEqual(['NODE_00', 'NODE_01'])
  })

  it('NODE_02 advances to ROOT_DAEMON phase 1', () => {
    const nodeTwo = reachNode(2)
    const result = inspectAndChoose(nodeTwo, 1)

    expect(result.state.currentNodeIndex).toBe(3)
    expect(result.state.bossPhase).toBe(1)
    expect(result.state.completedNodeIds).toEqual([
      'NODE_00',
      'NODE_01',
      'NODE_02',
    ])
    expect(result.messages.some((message) =>
      message.text.includes('ROOT_WARDEN'),
    )).toBe(true)
  })

  it('records each completed standard node exactly once', () => {
    const boss = reachNode(3)
    expect(boss.completedNodeIds).toEqual([
      'NODE_00',
      'NODE_01',
      'NODE_02',
    ])
    expect(new Set(boss.completedNodeIds).size).toBe(
      boss.completedNodeIds.length,
    )
  })
})

describe('ROOT_WARDEN resolution', () => {
  it('starts at phase 1 with two phases remaining', () => {
    const boss = reachNode(3)
    const status = createRunStatusMessages('storm', boss)
      .map((message) => message.text)
      .join('\n')

    expect(boss.bossPhase).toBe(1)
    expect(status).toContain('Phase: 1/2')
    expect(status).toContain('Phases remaining: 2')
  })

  it('completing phase 1 advances to a fresh phase 2 encounter', () => {
    const result = inspectAndChoose(reachNode(3), 1)

    expect(result.outcome).toBeUndefined()
    expect(result.state.bossPhase).toBe(2)
    expect(result.state.currentNodeInspected).toBe(false)
    expect(result.state.currentNodeResolved).toBe(false)
    expect(result.state.completedNodeIds).not.toContain('NODE_03')
  })

  it('cannot resolve phase 1 twice', () => {
    const phaseTwo = reachBossPhaseTwo()
    const repeated = chooseCurrentNodeOption(phaseTwo, ['1'])

    expect(repeated.state).toBe(phaseTwo)
    expect(repeated.state.correctActions).toBe(4)
    expect(repeated.messages[0].text).toContain('Inspect')
  })

  it('applies the declared damage for an incorrect boss answer', () => {
    const result = inspectAndChoose(reachNode(3), 2)

    expect(result.state.integrity).toBe(75)
    expect(result.state.failedActions).toBe(1)
    expect(result.state.bossPhase).toBe(2)
  })

  it('completing phase 2 while alive produces victory and a complete map', () => {
    const result = inspectAndChoose(reachBossPhaseTwo(), 1)

    expect(result.outcome).toBe('victory')
    expect(result.state.integrity).toBeGreaterThan(0)
    expect(result.state.completedNodeIds).toEqual([
      'NODE_00',
      'NODE_01',
      'NODE_02',
      'NODE_03',
    ])
    expect(createDungeonMap(result.state).match(/\[✓\]/g)).toHaveLength(4)
  })

  it('produces immediate defeat when a boss action reaches exactly zero', () => {
    const phaseTwo: RunState = {
      ...reachBossPhaseTwo(),
      integrity: 25,
    }
    const result = inspectAndChoose(phaseTwo, 2)

    expect(result.outcome).toBe('defeat')
    expect(result.state.integrity).toBe(0)
    expect(result.state.completedNodeIds).not.toContain('NODE_03')
  })

  it('cannot turn a fatal resolved state into victory', () => {
    const phaseTwo: RunState = {
      ...reachBossPhaseTwo(),
      integrity: 25,
    }
    const defeated = inspectAndChoose(phaseTwo, 2)
    const retry = chooseCurrentNodeOption(defeated.state, ['1'])

    expect(retry.outcome).toBeUndefined()
    expect(retry.state).toBe(defeated.state)
    expect(retry.state.integrity).toBe(0)
  })

  it('reports coherent phase 2 status', () => {
    const phaseTwo = reachBossPhaseTwo()
    const statusBeforeInspection = createRunStatusMessages('storm', phaseTwo)
      .map((message) => message.text)
      .join('\n')
    const statusAfterInspection = createRunStatusMessages(
      'storm',
      inspectCurrentNode(phaseTwo).state,
    )
      .map((message) => message.text)
      .join('\n')

    expect(statusBeforeInspection).toContain('Phase: 2/2')
    expect(statusBeforeInspection).toContain('Phases remaining: 1')
    expect(statusBeforeInspection).toContain('Inspect daemon phase 2')
    expect(statusAfterInspection).toContain('Resolve daemon phase 2')
  })
})

describe('victory, defeat, map and status state', () => {
  it('cannot win before completing the second ROOT_WARDEN phase', () => {
    const states = [
      createInitialRunState(),
      reachNode(1),
      reachNode(2),
      reachNode(3),
      reachBossPhaseTwo(),
    ]

    for (const state of states) {
      expect(state.completedNodeIds).not.toContain('NODE_03')
    }
  })

  it('defeats immediately at zero integrity without completing the node', () => {
    const fragileState: RunState = {
      ...createInitialRunState(),
      integrity: 25,
    }
    const result = inspectAndChoose(fragileState, 2)

    expect(result.outcome).toBe('defeat')
    expect(result.state.integrity).toBe(0)
    expect(result.state.completedNodeIds).toEqual([])
  })

  it('renders the initial map with NODE_00 current and later nodes locked', () => {
    const map = createDungeonMap(createInitialRunState())
    expect(map).toContain('[>] NODE_00')
    expect(map).toContain('[ ] NODE_01')
    expect(map).toContain('[ ] NODE_03')
  })

  it.each([
    [1, 'NODE_00', 'NODE_01'],
    [2, 'NODE_01', 'NODE_02'],
    [3, 'NODE_02', 'NODE_03'],
  ])(
    'marks completed and current nodes after %i transition(s)',
    (targetIndex, completedId, currentId) => {
      const map = createDungeonMap(reachNode(targetIndex))
      expect(map).toContain(`[✓] ${completedId}`)
      expect(map).toContain(`[>] ${currentId}`)
    },
  )

  it('status derives current integrity, progress and objective from one state', () => {
    const state = inspectAndChoose(createInitialRunState(), 3).state
    const status = createRunStatusMessages('storm', state)
      .map((message) => message.text)
      .join('\n')

    expect(status).toContain('Integrity: 90/100')
    expect(status).toContain('Progress: 1/4')
    expect(status).toContain('Inspect the protected executable')
    expect(status.match(/Integrity:/g)).toHaveLength(1)
    expect(status.match(/Objective:/g)).toHaveLength(1)
  })
})
