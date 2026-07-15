import { describe, expect, it } from 'vitest'
import { createCrossTemplate, cloneBandCorridor, measureCorridor, optimizeAllCorridors } from '@/domain'
import { listCorridorSidebarKpis } from '@/ui/layout/BandCorridorSidebar'
import { useAppStore } from '@/state/store'

describe('batch band optimize v0.5.35', () => {
  it('optimizeAllCorridors updates every corridor', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, '辅路'))
    // scramble offsets
    for (const c of p.bandCorridors) {
      c.nodes.forEach((n, i) => {
        n.offsetSec = (i * 17) % (n.cycleSec || 90)
      })
    }
    const before = p.bandCorridors.map((c) => measureCorridor(c).bandwidthRatio)
    const { corridors, summaries } = optimizeAllCorridors(p.bandCorridors)
    expect(corridors).toHaveLength(2)
    expect(summaries).toHaveLength(2)
    const after = corridors.map((c) => measureCorridor(c).bandwidthRatio)
    // each after should be >= before (allow tiny float noise)
    after.forEach((a, i) => expect(a + 1e-6).toBeGreaterThanOrEqual(before[i]))
  })

  it('sidebar kpi helper lists all corridors', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, 'B'))
    const rows = listCorridorSidebarKpis(p.bandCorridors)
    expect(rows).toHaveLength(2)
    expect(rows[1].name).toBe('B')
  })

  it('store optimizeAllBands returns counts', () => {
    useAppStore.getState().resetTemplate()
    useAppStore.getState().addBandCorridor()
    const r = useAppStore.getState().optimizeAllBands()
    expect(r.count).toBeGreaterThanOrEqual(2)
    expect(r.improved).toBeGreaterThanOrEqual(0)
    expect(r.improved).toBeLessThanOrEqual(r.count)
  })
})
