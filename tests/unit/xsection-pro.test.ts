import { describe, expect, it } from 'vitest'
import { createCrossTemplate, buildCrossSection } from '@/domain'
import { professionalCrossSectionSvg, crossSectionShareSvg } from '@/ui/charts/crossSectionDiagram'

describe('professional cross section', () => {
  it('draws standard section with total width', () => {
    const p = createCrossTemplate()
    const ap = p.channelizationSchemes[0].approaches[0]
    const xs = buildCrossSection(ap)
    const svg = professionalCrossSectionSvg(xs, ap, { theme: 'dark' })
    expect(svg).toContain('标准横断面')
    expect(svg).toContain('B =')
    expect(svg).toContain(ap.name)
    const share = crossSectionShareSvg(xs)
    expect(share).toContain('占比')
  })
})
