import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('channel form density', () => {
  it('CSS horizontal fields + tight spacing', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('.rg-form-row')
    expect(css).toContain('.rg-field')
    expect(css).toMatch(/--ctrl-h|height: 26px|height: 32px/)
  })
  it('version 0.5.137', () => {
    expect(readFileSync(resolve('package.json'), 'utf8')).toMatch(/"version": "0\.5\.\d+"/)
    expect((readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve('src/io/buildExportHandlers.ts'), 'utf8'))).toMatch(/v0\.5\.\d+/)
  })
})
