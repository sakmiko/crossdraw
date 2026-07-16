import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('v0.5.103 band toolbar layout', () => {
  const bp = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
  const css = readFileSync(resolve(__dirname, '../../src/ui/styles.css'), 'utf8')

  it('uses two-row band header (main + tabs)', () => {
    expect(bp).toContain('band-page-bar-row--main')
    expect(bp).toContain('band-page-bar-row--tabs')
    expect(bp).toContain('band-bar-btn')
    // tabs not crammed into single 48px row with actions
    expect(bp.indexOf('band-page-bar-row--main')).toBeLessThan(bp.indexOf('band-page-bar-row--tabs'))
  })

  it('CSS auto height + vertical center buttons', () => {
    expect(css).toContain('.band-page-bar-row')
    expect(css).toContain('.band-bar-btn')
    expect(css).toMatch(/\.band-page-bar\s*\{[^}]*height:\s*auto/)
    expect(css).not.toMatch(/\.band-page-bar\s*\{\s*height:\s*var\(--shell-top\)/)
    expect(css).toContain('min-height: 34px')
  })
})
