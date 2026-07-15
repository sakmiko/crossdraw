import { describe, expect, it } from 'vitest'
import { createCrossTemplate, validateProject } from '@/domain'

describe('validate', () => {
  it('UT-VAL-001 width 0 block', () => {
    const p = createCrossTemplate()
    p.channelizationSchemes[0].approaches[0].entryLanes[0].widthM = 0
    const issues = validateProject(p)
    expect(issues.some((i) => i.code === 'WIDTH_NON_POSITIVE' && i.level === 'block')).toBe(true)
  })

  it('UT-VAL-002 off default warn', () => {
    const p = createCrossTemplate()
    p.channelizationSchemes[0].approaches[0].entryLanes[0].widthM = 2.5
    const issues = validateProject(p)
    expect(issues.some((i) => i.code === 'WIDTH_OFF_DEFAULT' && i.level === 'warn')).toBe(true)
  })

  it('UT-VAL-003 template no block', () => {
    const p = createCrossTemplate()
    const issues = validateProject(p)
    expect(issues.filter((i) => i.level === 'block')).toHaveLength(0)
  })
})
