import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('e2e smoke suite meta', () => {
  it('covers all major modes in mvp.spec', () => {
    const p = resolve(__dirname, '../e2e/mvp.spec.ts')
    const t = readFileSync(p, 'utf8')
    expect(t).toContain('flow-report + polish')
    for (const mode of ['流量', '信号', '绿波', '比选', '断面']) {
      expect(t).toContain(mode)
    }
    expect(t).toContain('docs/screenshots/00-shell.png')
    expect(t).toContain('docs/screenshots/06-compare.png')
  })
})
