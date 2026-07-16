import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import { buildVissimImportPack } from '@/io/vissimInpxSkeleton'
import { multimodalBarSvg } from '@/ui/charts/multimodalChart'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('wave 0.5.56-0.5.64', () => {
  it('vissim import pack is honest skeleton', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const pack = buildVissimImportPack(p.name, ch.approaches, fl, sg)
    expect(pack.readme).toContain('不是')
    expect(pack.bundle.links.length).toBeGreaterThan(10)
  })

  it('multimodal bar svg renders', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const svg = multimodalBarSvg(ch.approaches, ch.flowSchemes[0])
    expect(svg).toContain('行人 · 非机')
  })

  it('compare workspace has sort control', () => {
    const t = readFileSync(resolve(__dirname, '../../src/ui/layout/CompareWorkspace.tsx'), 'utf8')
    expect(t).toContain('sortKey')
    expect(t).toContain('延误升序')
  })
})
