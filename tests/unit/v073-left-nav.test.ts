import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NAV_ITEMS } from '@/ui/layout/LeftNav'

describe('v0.5.73 left nav', () => {
  it('has one entry per feature page', () => {
    const ids = NAV_ITEMS.map((n) => n.id)
    expect(ids).toEqual(['channel', 'flow', 'signal', 'xsection', 'analysis', 'compare', 'band'])
    expect(NAV_ITEMS.every((n) => n.icon && n.label)).toBe(true)
  })

  it('App wires LeftNav and drops right mode-rail', () => {
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('LeftNav')
    expect(app).toContain('navCollapsed')
    expect(app).toContain('page-fill')
    expect(app).not.toContain('mode-rail')
    expect(app).toContain('band-with-nav')
  })
})
