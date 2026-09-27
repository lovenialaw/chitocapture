import { afterEach, describe, expect, it } from 'vitest'
import { getParameter, updateParameter } from '../data/parameters'
import { calculateDataCompleteness } from './executiveMetrics'
import { getCurrentScenarioSnapshot } from './scenarioRunner'

describe('executive dashboard data completeness', () => {
  const originalFlow = getParameter('feed-flow-rate')?.value

  afterEach(() => {
    if (typeof originalFlow === 'number') updateParameter('feed-flow-rate', originalFlow)
  })

  it('counts missing and invalid required inputs instead of treating them as complete', () => {
    const snapshot = getCurrentScenarioSnapshot()
    const completeDefault = calculateDataCompleteness(snapshot)
    expect(completeDefault.percent).toBeLessThan(100)
    expect(completeDefault.count).toBe(completeDefault.total - 2)

    updateParameter('feed-flow-rate', 0)
    const withInvalidFlow = calculateDataCompleteness(snapshot)
    expect(withInvalidFlow.count).toBe(completeDefault.count - 1)
    expect(withInvalidFlow.percent).toBeLessThan(completeDefault.percent)
  })
})
