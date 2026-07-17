import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('0.5.136+ channel params no draft boards', () => {
  it('drops draft / right-turn review boards from ChannelWorkspace', () => {
    const ch = readFileSync(resolve('src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    expect(ch).not.toContain('渠化出图稿')
    expect(ch).not.toContain('右转渠化审查')
    expect(ch).not.toContain('buildChannelDraftSheet')
    expect(ch).not.toContain('professionalRightTurnBoardSvg')
  })

  it('CSS has channel density rules', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('.rg-form-row')
  })

  it('version soft pin', () => {
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
  })
})
