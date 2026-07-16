import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('maintainability v0.5.32', () => {
  it('App.tsx stays lean after workspace extracts', () => {
    const p = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const lines = readFileSync(p, 'utf8').split('\n').length
    expect(lines).toBeLessThan(2600)
    expect(lines).toBeGreaterThan(800)
  })

  it('SignalWorkspace module exists and exports component', () => {
    const p = resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx')
    const t = readFileSync(p, 'utf8')
    expect(t).toContain('export function SignalWorkspace')
    expect(t).toContain('配时方法')
    expect(t).toContain('导出冲突矩阵')
  })
})
