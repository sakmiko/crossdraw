import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MODE_ICONS } from '@/ui/icons/Icons'
import { NAV_ITEMS } from '@/ui/layout/LeftNav'

describe('v0.5.75 vector icons', () => {
  it('icons module exports mode map for all nav items', () => {
    for (const item of NAV_ITEMS) {
      expect(MODE_ICONS[item.id]).toBe(item.icon)
    }
  })

  it('Icons.tsx is hand-drawn stroke set without external font', () => {
    const t = readFileSync(resolve(__dirname, '../../src/ui/icons/Icons.tsx'), 'utf8')
    expect(t).toContain('strokeWidth: 1.75')
    expect(t).toContain('strokeLinecap: \'round\'')
    expect(t).not.toContain('fontawesome')
    expect(t).not.toContain('lucide')
    expect(t).toContain('channel:')
    expect(t).toContain('band:')
  })

  it('LeftNav and App use Icon components', () => {
    const nav = readFileSync(resolve(__dirname, '../../src/ui/layout/LeftNav.tsx'), 'utf8')
    expect(nav).toContain('<Icon')
    expect(nav).not.toMatch(/icon: '[路量信]/)
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('Icon name="save"')
    expect(app).toContain('Icon name="undo"')
  })
})
