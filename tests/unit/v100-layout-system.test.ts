import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('v0.5.100 unified layout system', () => {
  const css = readFileSync(resolve(__dirname, '../../src/ui/styles.css'), 'utf8')

  it('keeps shell nav + page-fill and signal vertical rows', () => {
    expect(css).toContain('grid-template-columns: var(--shell-nav) minmax(0, 1fr)')
    expect(css).toContain('.page-fill-body')
    expect(css).toContain('.app.shell--signal .page-fill-body')
    expect(css).toMatch(/grid-template-rows: minmax\(210px, 46vh\)/)
    expect(css).toContain('v0.5.100 unified page-fill layout system')
  })

  it('desktop non-signal left-right and narrow stack', () => {
    expect(css).toContain('.app.shell--channel .page-fill-body')
    expect(css).toContain('.app.shell--flow .page-fill-body')
    expect(css).toMatch(/@media \(max-width: 1100px\)/)
    expect(css).toMatch(/@media \(max-width: 720px\)/)
    // flat params
    expect(css).toContain('.page-fill-params .flat-params')
    // band aligns
    expect(css).toContain('.band-page-body')
  })

  it('layout policy: only signal forced vertical at all widths', () => {
    expect(css).toMatch(/\.app\.shell--signal \.page-fill-body[\s\S]*grid-template-rows/)
    // flow not forced vertical on desktop
    expect(css).not.toMatch(/\.app\.shell--flow \.page-fill-body[^{]*\{[^{]*grid-template-rows: minmax\(210px/)
  })
})
