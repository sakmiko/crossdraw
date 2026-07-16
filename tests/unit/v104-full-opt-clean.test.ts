import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, cloneBandCorridor } from '@/domain'
import {
  runFullSchemeOptimize,
  fullOptimizeMarkdown,
} from '@/domain/optimize/fullSchemeOptimize'
import {
  cleanChannelPlanSvg,
  cleanFlowDiagramSvg,
  stripDrawingText,
} from '@/io/cleanDrawingPack'
import { EXPORT_CATALOG } from '@/io/exportCatalog'
import { measureCorridor } from '@/domain'

describe('v0.5.104 full optimize + clean drawings + docs', () => {
  it('runs full scheme optimize', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, '辅路'))
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const r = runFullSchemeOptimize(ch.approaches, fl, sg, p.bandCorridors, p.activeBandId)
    expect(r.cycleSec).toBeGreaterThan(0)
    expect(r.signal.phases.length).toBeGreaterThan(0)
    expect(r.bandCorridors.length).toBeGreaterThanOrEqual(1)
    expect(fullOptimizeMarkdown(p.name, r)).toContain('一键全方案优化')
  })

  it('clean drawings strip footnotes', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const svg = cleanChannelPlanSvg(ch)
    expect(svg).toContain('<svg')
    expect(svg).not.toMatch(/试用版|同源|watermark/i)
    const flow = cleanFlowDiagramSvg(ch.approaches, fl)
    expect(flow).not.toMatch(/与表同源/)
    const noisy = '<svg><text>与表同源 · 说明脚注</text><text>120</text></svg>'
    expect(stripDrawingText(noisy)).not.toContain('同源')
  })

  it('catalog + docs present', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('full-scheme-optimize-md')
    expect(ids).toContain('clean-channel-svg')
    const survey = readFileSync(
      resolve(__dirname, '../../docs/research/06-competitor-optimization-survey-20260716.md'),
      'utf8',
    )
    expect(survey).toContain('Webster')
    expect(survey).toContain('净图')
    const readme = readFileSync(resolve(__dirname, '../../README.md'), 'utf8')
    expect(readme).toMatch(/0\.5\.10[45]/)
  })
})
