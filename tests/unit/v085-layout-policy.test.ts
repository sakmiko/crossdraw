import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('v085-layout-policy.test.ts layout policy (v0.5.116 left-right)', () => {
  it('signal is left-right columns on desktop', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toMatch(/shell--signal/)
    expect(css).toMatch(/minmax\(0,\s*1fr\)/)
  })
})
