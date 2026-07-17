import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EXPORT_CATALOG, isExportAvailable } from '@/io/exportCatalog'

describe('v0.5.136 cycle-scan PNG + approach-strip', () => {
  it('catalog cycle-scan png available', () => {
    const item = EXPORT_CATALOG.find((x) => x.id === 'echarts-cycle-scan-png')
    expect(item).toBeTruthy()
    expect(
      isExportAvailable(item!, {
        hasChannel: true,
        hasFlow: true,
        hasSignal: true,
        hasAnalysis: true,
        hasSelected: true,
        hasBand: true,
      }),
    ).toBe(true)
  })

  it('App/Signal UI + CSS + version', () => {
    const app = ((readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve('src/io/buildExportHandlers.ts'), 'utf8')))
    expect(app).toContain('echarts-cycle-scan-png')
    expect(app).toContain('cycleScanOption')
    expect(app).toContain('scanCycleSensitivity')
    const sw = readFileSync(resolve('src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('周期 C 敏感性')
    expect(sw).toMatch(/导出 PNG|downloadEchartsPng|EChart/)
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('.approach-strip')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
  })
})
