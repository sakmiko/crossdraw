import { describe, expect, it } from 'vitest'
import { createCrossTemplate, parseRtp, serializeRtp, wrapProject } from '@/domain'

describe('rtp', () => {
  it('UT-RTP-001 roundtrip', () => {
    const p = createCrossTemplate('测试十字')
    const file = wrapProject(p)
    const text = serializeRtp(file)
    const again = parseRtp(text)
    expect(again.schemaVersion).toBe(1)
    expect(again.project.name).toBe('测试十字')
    expect(again.project.channelizationSchemes[0].approaches).toHaveLength(4)
  })

  it('UT-RTP-002 rejects bad format', () => {
    expect(() => parseRtp('{"format":"nope","schemaVersion":1,"appVersion":"0","project":{}}')).toThrow()
  })

  it('UT-RTP-003 template approaches', () => {
    const p = createCrossTemplate()
    expect(p.channelizationSchemes[0].approaches.map((a) => a.bearingDeg).sort((a, b) => a - b)).toEqual([
      0, 90, 180, 270,
    ])
  })
})
