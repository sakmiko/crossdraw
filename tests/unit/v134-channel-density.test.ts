import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('v0.5.134 channel form density', () => {
  it('CSS horizontal fields + tight spacing', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.134 channel form density')
    expect(css).toContain('grid-template-columns: minmax(4.2rem, 38%)')
    expect(css).toContain('height: 22px !important')
  })
  it('version 0.5.134', () => {
    expect(readFileSync(resolve('package.json'), 'utf8')).toContain('"version": "0.5.134"')
    expect(readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')).toMatch(/v0\.5\.134/)
  })
})
