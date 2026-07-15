/**
 * Chart presentation standards — consistent ticks, units, legend, numeric precision.
 * Used by professional diagrams so values match analysis (not decorative rounding).
 */

export function niceStep(max: number, targetTicks = 5): number {
  if (!(max > 0)) return 1
  const raw = max / targetTicks
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

export function niceCeil(max: number): number {
  if (!(max > 0)) return 1
  const step = niceStep(max)
  return Math.ceil(max / step) * step
}

/** Format numbers for engineering charts */
export function fmtNum(v: number, kind: 'int' | 'flow' | 'vc' | 'delay' | 'sec' | 'm' | 'pct' = 'flow'): string {
  if (!Number.isFinite(v)) return '—'
  switch (kind) {
    case 'int':
      return String(Math.round(v))
    case 'flow':
      return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)
    case 'vc':
      return v.toFixed(3)
    case 'delay':
    case 'sec':
      return v.toFixed(1)
    case 'm':
      return v.toFixed(1)
    case 'pct':
      return `${(v * 100).toFixed(1)}%`
    default:
      return String(v)
  }
}

export const CHART_COLORS = {
  green: '#16a34a',
  yellow: '#ca8a04',
  red: '#dc2626',
  through: '#2563eb',
  left: '#0891b2',
  right: '#7c3aed',
  grid: '#334155',
  axis: '#94a3b8',
  text: '#e2e8f0',
  muted: '#64748b',
  bg: '#0b1220',
  panel: '#0f172a',
} as const

/** HCM signalized intersection LOS by control delay (s/veh) — HCM 6th style thresholds */
export function losByControlDelay(d: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  if (d <= 10) return 'A'
  if (d <= 20) return 'B'
  if (d <= 35) return 'C'
  if (d <= 55) return 'D'
  if (d <= 80) return 'E'
  return 'F'
}

export const LOS_COLORS: Record<string, string> = {
  A: '#16a34a',
  B: '#22c55e',
  C: '#84cc16',
  D: '#eab308',
  E: '#f97316',
  F: '#ef4444',
}

/** v/c heat consistent with capacity analysis notes */
export function vcHeatAccurate(vc: number): string {
  if (vc <= 0.6) return '#16a34a'
  if (vc <= 0.75) return '#65a30d'
  if (vc <= 0.85) return '#ca8a04'
  if (vc <= 0.95) return '#ea580c'
  if (vc <= 1.0) return '#dc2626'
  return '#991b1b'
}

export function chartFooter(text: string, x: number, y: number): string {
  return `<text x="${x}" y="${y}" fill="${CHART_COLORS.muted}" font-size="9">${escapeXml(text)}</text>`
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Build evenly spaced time ticks 0..C inclusive */
export function timeTicks(cycleSec: number): number[] {
  const C = Math.max(1, cycleSec)
  const step = C <= 60 ? 5 : C <= 120 ? 10 : 15
  const ticks: number[] = []
  for (let t = 0; t <= C + 1e-6; t += step) ticks.push(Math.round(t * 10) / 10)
  if (ticks[ticks.length - 1] !== C) ticks.push(C)
  return ticks
}
