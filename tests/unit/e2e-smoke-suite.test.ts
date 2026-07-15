import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('e2e smoke suite v0.5.43', () => {
  it('covers all major modes in mvp.spec', () => {
    const p = resolve(__dirname, '../e2e/mvp.spec.ts')
    const t = readFileSync(p, 'utf8')
    expect(t).toContain("smoke suite")
    for (const mode of ['渠化', '流量', '信号', '分析', '绿波', '比选', '断面']) {
      expect(t).toContain(mode)
    }
    expect(t).toContain('docs/screenshots/00-shell.png')
    expect(t).toContain('docs/screenshots/06-compare.png')
  })
})
