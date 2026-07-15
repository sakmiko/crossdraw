import { describe, expect, it } from 'vitest'
import { chartColorsForTheme, themeSvg } from '@/ui/charts/chartTheme'

describe('chart theme light contrast', () => {
  it('remaps dark bg to white in light theme', () => {
    const light = chartColorsForTheme('light')
    expect(light.bg).toBe('#ffffff')
    expect(light.grid).toBe('#cbd5e1')
    expect(light.text).toBe('#0f172a')
    const svg = '<rect fill="#0a1020"/><text fill="#94a3b8">t</text><line stroke="#1e293b"/>'
    const out = themeSvg(svg, light)
    expect(out).toContain('#ffffff')
    expect(out).not.toContain('#0a1020')
    expect(out).toContain(light.axis)
    expect(out).toContain(light.grid)
  })

  it('keeps dark palette for dark theme', () => {
    const dark = chartColorsForTheme('dark')
    expect(dark.bg).toBe('#0b1018')
    const svg = '<rect fill="#0a1020"/>'
    expect(themeSvg(svg, dark)).toContain('#0b1018')
  })
})
