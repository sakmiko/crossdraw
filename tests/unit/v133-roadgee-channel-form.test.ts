import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('v0.5.133 roadgee channel form', () => {
  it('mirrors reference product sections', () => {
    const ch = readFileSync(resolve('src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    for (const s of [
      '道路属性',
      '右转渠化',
      '进口属性',
      '出口属性',
      '中央隔离',
      '非机动车道',
      '辅路属性',
      '更多属性',
      '人行横道',
      '左转待转',
      'rg-form-row',
      'rg-sec-title',
    ]) {
      expect(ch).toContain(s)
    }
    expect(ch).not.toContain('渠化出图稿')
    expect(ch).not.toContain('右转渠化审查')
  })

  it('CSS roadgee form styles', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css.includes('roadgee channel form') || css.includes('channel form density')).toBe(true)
    expect(css).toContain('.rg-form-row')
    expect(css).toContain('#dc2626')
  })

  it('version soft pin', () => {
    expect(readFileSync(resolve('package.json'), 'utf8')).toMatch(/"version": "0\.5\.\d+"/)
    expect(readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')).toMatch(/v0\.5\.\d+/)
  })
})
