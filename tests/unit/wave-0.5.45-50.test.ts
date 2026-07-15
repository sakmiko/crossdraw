import { describe, expect, it } from 'vitest'
import { createCrossTemplate, sectionAlignsWithApproach, sumMultimodal, parseRtp, serializeRtp, wrapProject } from '@/domain'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('wave 0.5.45-0.5.50', () => {
  it('xsection workspace module exists', () => {
    const t = readFileSync(resolve(__dirname, '../../src/ui/layout/XSectionWorkspace.tsx'), 'utf8')
    expect(t).toContain('export function XSectionWorkspace')
    expect(t).toContain('断面同源')
  })

  it('section aligns with approach widths', () => {
    const p = createCrossTemplate()
    const ap = p.channelizationSchemes[0].approaches[0]
    const a = sectionAlignsWithApproach(ap)
    expect(a.ok).toBe(true)
  })

  it('multimodal volumes roundtrip and sum', () => {
    const p = createCrossTemplate()
    const fl = p.channelizationSchemes[0].flowSchemes[0]
    expect(fl.multimodal).toBeTruthy()
    const s = sumMultimodal(fl, p.channelizationSchemes[0].approaches)
    expect(s.ped).toBeGreaterThan(0)
    const file = parseRtp(serializeRtp(wrapProject(p, '0.5.50')))
    expect(file.project.channelizationSchemes[0].flowSchemes[0].multimodal).toBeTruthy()
  })
})
