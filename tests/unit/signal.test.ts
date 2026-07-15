import { describe, expect, it } from 'vitest'
import { createCrossTemplate, detectPhaseConflicts } from '@/domain'

describe('signal conflicts', () => {
  it('flags opposing through in same phase', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const n = ch.approaches.find((a) => a.bearingDeg === 0)!
    const s = ch.approaches.find((a) => a.bearingDeg === 180)!
    const issues = detectPhaseConflicts(
      [
        {
          id: 'p1',
          name: '坏相位',
          greenSec: 30,
          yellowSec: 3,
          allRedSec: 2,
          releases: {
            [n.id]: ['T'],
            [s.id]: ['T'],
          },
        },
      ],
      ch.approaches,
    )
    expect(issues.some((i) => i.code === 'CONFLICT_OPPOSING_THROUGH')).toBe(true)
  })
})
