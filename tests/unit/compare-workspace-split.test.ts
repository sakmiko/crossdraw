import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('maintainability v0.5.44', () => {
  it('CompareWorkspace module exists and App wires it', () => {
    const cw = resolve(__dirname, '../../src/ui/layout/CompareWorkspace.tsx')
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const cwText = readFileSync(cw, 'utf8')
    const appText = readFileSync(app, 'utf8')
    expect(cwText).toContain('export function CompareWorkspace')
    expect(cwText).toContain('SchemeCompareBoard')
    expect(cwText).toContain('导出并排图')
    expect(appText).toContain('CompareWorkspace')
    expect(appText).toContain('onActivateScheme')
  })

  it('App is under 1200 lines after compare extract', () => {
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const lines = readFileSync(app, 'utf8').split('\n').length
    expect(lines).toBeLessThan(2200)
  })
})
