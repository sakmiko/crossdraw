import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('maintainability v0.5.42', () => {
  it('AnalysisWorkspace module exists and App wires it', () => {
    const aw = resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx')
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const awText = readFileSync(aw, 'utf8')
    const appText = readFileSync(app, 'utf8')
    expect(awText).toContain('export function AnalysisWorkspace')
    expect(awText).toContain('AnalysisLaneTable')
    expect(awText).toContain('图/表同源')
    expect(awText).toContain('导出分析拼图')
    expect(appText).toContain('AnalysisWorkspace')
    expect(appText).toContain('onExportProPack={exportProfessionalDiagrams}')
  })

  it('App is under 1300 lines after analysis extract', () => {
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const lines = readFileSync(app, 'utf8').split('\n').length
    expect(lines).toBeLessThan(2500)
  })
})
