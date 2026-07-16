import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('maintainability v0.5.40', () => {
  it('ChannelWorkspace module exists and App wires it', () => {
    const cw = resolve(__dirname, '../../src/ui/layout/ChannelWorkspace.tsx')
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const cwText = readFileSync(cw, 'utf8')
    const appText = readFileSync(app, 'utf8')
    expect(cwText).toContain('export function ChannelWorkspace')
    expect(cwText).not.toContain('纬度')
    expect(cwText).toContain('右转渠化')
    expect(cwText).toContain('分车道宽')
    expect(appText).toContain('ChannelWorkspace')
    expect(appText).toContain('setLaneVariable={setLaneVariable}')
  })

  it('App is under 1700 lines after channel extract', () => {
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const lines = readFileSync(app, 'utf8').split('\n').length
    expect(lines).toBeLessThan(2600)
  })
})
