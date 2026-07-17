import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('channel form density', () => {
  it('CSS horizontal fields + tight spacing', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('.rg-form-row')
    expect(css).toContain('.rg-field')
    expect(css).toContain('height: 26px !important')
  })
  it('version 0.5.135', () => {
    expect(readFileSync(resolve('package.json'), 'utf8')).toContain('"version": "0.5.135"')
    expect(readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')).toMatch(/v0\.5\.135/)
  })
})
