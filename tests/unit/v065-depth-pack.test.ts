import { describe, expect, it } from 'vitest'
import {
  createCrossTemplate,
  optimizeBandMaxbandDiscrete,
  optimizeCorridor,
  measureCorridor,
  makePedestrianOnlyPhase,
  inferPhaseKind,
} from '@/domain'
import { buildVissimInpxPack } from '@/io/vissimInpx'
import { buildMultiPageReportHtml } from '@/io/multiPageReport'
import { corridorMapSvg } from '@/ui/charts/corridorMap'
import { multimodalBarSvg } from '@/ui/charts/multimodalChart'
import { analyzeIntersection } from '@/domain/analysis'

describe('v0.5.65 depth pack', () => {
  it('MAXBAND discrete improves or preserves two-way score vs progressive seed', () => {
    const p = createCrossTemplate()
    let c = { ...p.bandCorridor, method: 'maxband-discrete' as const }
    // scramble offsets
    c = {
      ...c,
      nodes: c.nodes.map((n, i) => ({ ...n, offsetSec: i === 0 ? 0 : 12 + i * 7, lockedOffset: i === 0 })),
    }
    const before = measureCorridor(c)
    const opt = optimizeBandMaxbandDiscrete(c)
    const afterNodes = c.nodes.map((n) => {
      const o = opt.offsets.find((x) => x.id === n.id)
      return { ...n, offsetSec: n.lockedOffset ? n.offsetSec : (o?.offsetSec ?? n.offsetSec) }
    })
    const after = measureCorridor({ ...c, nodes: afterNodes })
    expect(after.forwardBandwidthSec! + after.backwardBandwidthSec!).toBeGreaterThanOrEqual(
      before.forwardBandwidthSec! + before.backwardBandwidthSec! - 0.05,
    )
    expect(opt.method).toBe('maxband-discrete')
  })

  it('optimizeCorridor routes maxband-discrete', () => {
    const p = createCrossTemplate()
    const c = { ...p.bandCorridor, method: 'maxband-discrete' as const }
    const r = optimizeCorridor(c)
    expect(r.method).toBe('maxband-discrete')
    expect(r.offsets.length).toBe(c.nodes.length)
  })

  it('VISSIM inpx xml pack is structured and complete', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const pack = buildVissimInpxPack(p.name, ch.approaches, fl, sg)
    expect(pack.xml).toContain('CrossdrawVissimInterchange')
    expect(pack.xml).toContain('<Link ')
    expect(pack.xml).toContain('<Connector ')
    expect(pack.xml).toContain('<SignalGroup ')
    expect(pack.readme).toContain('不是')
    expect(JSON.parse(pack.json).links).toBeGreaterThan(0)
  })

  it('multi-page report has 5 pages and professional styles', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const analysis = analyzeIntersection(ch.approaches, fl, sg)
    const html = buildMultiPageReportHtml({
      project: p,
      channel: ch,
      flow: fl,
      signal: sg,
      analysis,
      bandCorridor: p.bandCorridor,
    })
    expect(html).toContain('第 1 / 5 页')
    expect(html).toContain('第 5 / 5 页')
    expect(html).toContain('@page')
    expect(html).toContain('交叉口工程报告')
  })

  it('corridor map and multimodal charts render pro chrome', () => {
    const p = createCrossTemplate()
    const map = corridorMapSvg(p.bandCorridor, { bandwidthRatio: 0.2 })
    expect(map).toContain('km/h')
    expect(map).toContain('chart-svg--pro')
    const ch = p.channelizationSchemes[0]
    const mm = multimodalBarSvg(ch.approaches, ch.flowSchemes[0])
    expect(mm).toContain('行人 · 非机')
    expect(mm).toContain('chart-svg--pro')
  })

  it('pedestrian-only phase kind is exclusive', () => {
    const p = createCrossTemplate()
    const ids = p.channelizationSchemes[0].approaches.map((a) => a.id)
    const ph = makePedestrianOnlyPhase('p1', '行人A', ids, 20)
    expect(inferPhaseKind(ph)).toBe('pedestrian')
    expect(ph.pedestrian?.every((x) => x.exclusive)).toBe(true)
    expect(Object.keys(ph.releases).length).toBe(0)
  })
})
