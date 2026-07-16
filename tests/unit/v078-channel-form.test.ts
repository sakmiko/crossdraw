import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'

describe('v0.5.78 RoadGee channel form', () => {
  it('ChannelWorkspace has RoadGee section titles', () => {
    const t = readFileSync(resolve(__dirname, '../../src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    for (const s of ['道路属性', '右转渠化', '进口属性', '出口属性', '中央隔离', '非机动车道', '辅路属性']) {
      expect(t).toContain(s)
    }
    expect(t).toContain('setExitLaneCount')
    expect(t).toContain('rg-section-title')
  })

  it('store has setExitLaneCount and template has exit lanes', () => {
    const store = readFileSync(resolve(__dirname, '../../src/state/store.ts'), 'utf8')
    expect(store).toContain('setExitLaneCount')
    const p = createCrossTemplate()
    const ap = p.channelizationSchemes[0].approaches[0]
    expect(ap.exitLanes.length).toBeGreaterThan(0)
    expect(ap.widen.entryWidenLengthM).toBeGreaterThanOrEqual(0)
  })
})
