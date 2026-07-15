import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh } from '@/domain'
import { meshToDxf } from '@/io/exportDxf'
import { meshToSvg } from '@/io/exportSvg'

describe('export', () => {
  it('UT-SVG-001', () => {
    const mesh = rebuildChannelMesh(createCrossTemplate().channelizationSchemes[0])
    const svg = meshToSvg(mesh)
    expect(svg).toContain('<svg')
    expect(svg).toContain('path')
  })

  it('UT-DXF-001', () => {
    const mesh = rebuildChannelMesh(createCrossTemplate().channelizationSchemes[0])
    const dxf = meshToDxf(mesh)
    expect(dxf).toContain('LAYER')
    expect(dxf).toContain('POLYLINE')
    expect(dxf).toContain('EOF')
  })
})
