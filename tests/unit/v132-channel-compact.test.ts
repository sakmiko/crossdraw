import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('v0.5.132 channel params compact', () => {
  it('drops draft / right-turn review boards from ChannelWorkspace', () => {
    const ch = readFileSync(resolve('src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    expect(ch).not.toContain('渠化出图稿')
    expect(ch).not.toContain('右转渠化审查')
    expect(ch).not.toContain('buildChannelDraftSheet')
    expect(ch).not.toContain('professionalRightTurnBoardSvg')
    expect(ch).toContain('channel-params-compact')
    expect(ch).toContain('prop-table')
    expect(ch).toContain('进 / 出口')
  })

  it('CSS narrows channel params column', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.132 channel compact')
    expect(css).toMatch(/shell--channel[\s\S]*minmax\(260px,\s*28%\)/)
    expect(css).toContain('.cell-num')
  })

  it('version 0.5.132', () => {
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toContain('"version": "0.5.132"')
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toMatch(/v0\.5\.132/)
  })
})
