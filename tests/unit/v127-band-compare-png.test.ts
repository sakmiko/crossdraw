import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EXPORT_CATALOG, isExportAvailable } from '@/io/exportCatalog'

describe('v0.5.127 band/compare echarts PNG + topbar', () => {
  it('catalog ids available', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('echarts-band-png')
    expect(ids).toContain('echarts-compare-png')
    const band = EXPORT_CATALOG.find((x) => x.id === 'echarts-band-png')!
    expect(
      isExportAvailable(band, {
        hasChannel: true,
        hasFlow: true,
        hasSignal: true,
        hasAnalysis: true,
        hasSelected: true,
        hasBand: true,
      }),
    ).toBe(true)
  })

  it('App handlers + Band/Compare PNG + version', () => {
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('echarts-band-png')
    expect(app).toContain('echarts-compare-png')
    expect(app).toContain('bandBandwidthOption')
    expect(app).toContain('compareSchemesOption')
    const bp = readFileSync(resolve('src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain('downloadEchartsPng')
    expect(bp).toContain('导出 PNG')
    const cw = readFileSync(resolve('src/ui/layout/CompareWorkspace.tsx'), 'utf8')
    expect(cw).toContain('downloadEchartsPng')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.127 topbar')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toContain('"version": "0.5.127"')
  })
})
