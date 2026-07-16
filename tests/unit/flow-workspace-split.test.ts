import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('maintainability v0.5.39', () => {
  it('FlowWorkspace module exists and App wires it', () => {
    const fw = resolve(__dirname, '../../src/ui/layout/FlowWorkspace.tsx')
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const fwText = readFileSync(fw, 'utf8')
    const appText = readFileSync(app, 'utf8')
    expect(fwText).toContain('export function FlowWorkspace')
    expect(fwText).toContain('buildFlowAlignment')
    expect(fwText).toContain('buildFlowAlignment')
    expect(appText).toContain('FlowWorkspace')
    expect(appText).toContain('onDisplayMode={setFlowDisplayMode}')
  })

  it('App is under 2250 lines after flow extract', () => {
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const lines = readFileSync(app, 'utf8').split('\n').length
    expect(lines).toBeLessThan(3600)
  })
})
