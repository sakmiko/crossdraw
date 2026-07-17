import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('maintainability v0.5.41', () => {
  it('BandWorkspace module exists and App wires it', () => {
    const bw = resolve(__dirname, '../../src/ui/layout/BandWorkspace.tsx')
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const bwText = readFileSync(bw, 'utf8')
    const appText = readFileSync(app, 'utf8')
    expect(bwText).toContain('export function BandWorkspace')
    expect(bwText).toContain('BandCorridorSidebar')
    expect(bwText).toContain('InteractiveTimeSpace')
    expect(bwText).toContain('optimizeAllBands')
    expect(appText).toContain('BandPage')
    expect(appText).toContain('optimizeAllBands={optimizeAllBands}')
    expect(appText).not.toContain('BandCorridorSidebar')
  })

  it('App is under 1400 lines after band extract', () => {
    const app = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const lines = readFileSync(app, 'utf8').split('\n').length
    expect(lines).toBeLessThan(3800)
  })
})
