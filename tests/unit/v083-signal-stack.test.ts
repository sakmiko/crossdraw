import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('v0.5.83 signal vertical layout', () => {
  it('CSS forces signal page-fill rows', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.83 signal vertical stack')
    expect(css).toContain('.app.shell--signal .page-fill-body')
    expect(css).toMatch(/grid-template-rows: minmax\(210px, 46vh\)/)
  })
  it('App marks page-fill-body--mode', () => {
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('page-fill-body--${mode}')
    expect(app).toContain('shell--${mode}')
  })
})
