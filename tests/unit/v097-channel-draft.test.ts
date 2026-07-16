import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, rebuildChannelMesh } from '@/domain'
import {
  buildChannelDraftSheet,
  channelDraftMarkdown,
  channelDraftPreviewSvg,
} from '@/io/channelDraftSheet'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.97 channel draft sheet', () => {
  it('builds draft with title block scale north', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const mesh = rebuildChannelMesh(ch)
    const svg = buildChannelDraftSheet(p, ch, mesh, {
      projectName: p.name,
      paper: 'A3-landscape',
    })
    expect(svg).toContain('viewBox="0 0 420 297"')
    expect(svg).toContain('比例尺')
    expect(svg).toContain('>N</text>')
    expect(svg).toContain('工程名称')
    expect(svg).toContain('渠化方案')
    expect(svg).not.toContain('试用版')
    expect(channelDraftMarkdown(p, ch)).toContain('渠化出图说明')
    const prev = channelDraftPreviewSvg(p, ch, mesh, 800)
    expect(prev.length).toBeGreaterThan(500)
  })

  it('export + channel UI wired flat', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('channel-draft-svg')
    const cw = readFileSync(resolve(__dirname, '../../src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    expect(cw).not.toContain('渠化出图稿') // draft removed from params v0.5.132
    expect(cw).not.toContain('buildChannelDraftSheet')
    expect(cw).not.toMatch(/<details\b/)
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('channel-draft-svg')
  })
})
