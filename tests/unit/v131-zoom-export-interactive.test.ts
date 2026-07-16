import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CATEGORY_LABEL, EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.131 canvas zoom + interactive export category', () => {
  it('CanvasHandle exposes zoom API', () => {
    const cv = readFileSync(resolve('src/canvas/CanvasView.tsx'), 'utf8')
    expect(cv).toContain('zoomBy')
    expect(cv).toContain('zoomIn')
    expect(cv).toContain('zoomOut')
    expect(cv).toContain('getZoom')
  })

  it('export catalog interactive group + App zoom bar', () => {
    expect(CATEGORY_LABEL.interactive).toContain('交互图')
    const echarts = EXPORT_CATALOG.filter((x) => x.id.startsWith('echarts-'))
    expect(echarts.length).toBeGreaterThanOrEqual(7)
    expect(echarts.every((x) => x.category === 'interactive')).toBe(true)
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('canvas-zoom-bar')
    expect(app).toContain('zoomIn')
    expect(app).toContain('zoomOut')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.131 stage-zoom')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toContain('"version": "0.5.131"')
    const ec = readFileSync(resolve('src/ui/common/ExportCenter.tsx'), 'utf8')
    expect(ec).toContain('交互图 PNG')
  })
})
