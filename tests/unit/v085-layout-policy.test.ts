import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('v0.5.85 layout policy', () => {
  it('only signal forced vertical; desktop others columns', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.83 signal vertical stack')
    expect(css).toContain('ONLY signal is vertical stack')
    expect(css).not.toContain('v0.5.84 flow vertical stack')
    // signal rows
    expect(css).toMatch(/\.app\.shell--signal \.page-fill-body[\s\S]*grid-template-rows/)
  })
})
