/**
 * Shared chart theming — light theme must keep high contrast for print/day use.
 * Professional diagrams hard-code dark-palette hex; themeSvg remaps them here.
 */
export type ChartColorSet = {
  bg: string
  grid: string
  label: string
  text: string
  muted: string
  axis: string
  panel: string
}

export function chartColorsForTheme(theme: 'dark' | 'light'): ChartColorSet {
  if (theme === 'light') {
    return {
      bg: '#ffffff',
      grid: '#cbd5e1',
      label: '#475569',
      text: '#0f172a',
      muted: '#64748b',
      axis: '#334155',
      panel: '#f8fafc',
    }
  }
  return {
    bg: '#0b1018',
    grid: '#1c2533',
    label: '#7d8b9e',
    text: '#e6edf5',
    muted: '#64748b',
    axis: '#94a3b8',
    panel: '#0f172a',
  }
}

function rep(s: string, from: string, to: string): string {
  return s.split(from).join(to)
}

/**
 * Remap hard-coded dark SVG fills/strokes to current theme.
 */
export function themeSvg(svg: string, c: ChartColorSet): string {
  let out = svg
  const pairs: [string, string][] = [
    ['#0a1020', c.bg],
    ['#0b1018', c.bg],
    ['#0b1220', c.bg],
    ['#0f172a', c.panel === '#f8fafc' ? c.text : c.panel],
    ['#111827', c.panel],
    ['#1e293b', c.grid],
    ['#1c2533', c.grid],
    ['#334155', c.grid],
    ['#475569', c.axis],
    ['#8494ab', c.label],
    ['#7d8b9e', c.label],
    ['#64748b', c.muted],
    ['#94a3b8', c.axis],
    ['#e8eef7', c.text],
    ['#f1f5f9', c.text],
    ['#e2e8f0', c.text],
    ['#e6edf5', c.text],
  ]
  for (const [from, to] of pairs) out = rep(out, from, to)
  return out
}

export const SERIES_COLORS = {
  L: '#0e7490',
  T: '#1d4ed8',
  R: '#6d28d9',
  green: '#15803d',
  yellow: '#a16207',
  red: '#b91c1c',
  fwd: '#0369a1',
  bwd: '#be185d',
} as const
