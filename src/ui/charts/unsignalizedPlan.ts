/**
 * RoadGee-style unsignalized plan diagram (TWSC / roundabout).
 * Center LOS + approach movement boxes. No watermark.
 * Data: UnsignalizedAnalysis only.
 */
import type { Approach } from '@/domain/types'
import type { UnsignalizedAnalysis, UnsignalizedLegResult } from '@/domain/analysis/unsignalized'
import { escapeXml } from './chartStandards'

const LOS_COLOR: Record<string, string> = {
  A: '#22c55e',
  B: '#16a34a',
  C: '#84cc16',
  D: '#eab308',
  E: '#f97316',
  F: '#ef4444',
  '—': '#94a3b8',
}

function losColor(los: string): string {
  return LOS_COLOR[los] ?? '#64748b'
}

function polar(cx: number, cy: number, r: number, bearingDeg: number) {
  // screen: 0° = north = -Y
  const a = ((bearingDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

export function unsignalizedPlanSvg(
  approaches: Approach[],
  analysis: UnsignalizedAnalysis,
  opts: { size?: number } = {},
): string {
  const size = opts.size ?? 520
  const cx = size / 2
  const cy = size / 2 + 6
  const R = size * 0.32

  let g = ''
  g += `<rect width="${size}" height="${size}" fill="#fafafa"/>`
  const title =
    analysis.mode === 'roundabout'
      ? '环形交叉口能力评价'
      : analysis.mode === 'twsc'
        ? '无信号交叉口评价'
        : '无信号评价'
  g += `<text x="14" y="22" fill="#0f172a" font-size="13" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(title)}</text>`
  g += `<text x="14" y="38" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">${escapeXml(analysis.mode)} · 均延误 ${analysis.avgDelay.toFixed(1)}s · 均v/c ${analysis.avgVc.toFixed(2)}</text>`

  // approach arms outline
  for (const ap of approaches) {
    const o = polar(cx, cy, R * 1.15, ap.bearingDeg)
    const i = polar(cx, cy, R * 0.35, ap.bearingDeg)
    g += `<line x1="${i.x}" y1="${i.y}" x2="${o.x}" y2="${o.y}" stroke="#cbd5e1" stroke-width="18" stroke-linecap="round"/>`
  }

  // center circle
  const cc = losColor(analysis.los)
  g += `<circle cx="${cx}" cy="${cy}" r="${size * 0.09}" fill="${cc}" stroke="#fff" stroke-width="2"/>`
  g += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#fff" font-size="16" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(analysis.los)}</text>`

  // legs grouped by approach
  const byAp = new Map<string, UnsignalizedLegResult[]>()
  for (const leg of analysis.legs) {
    const arr = byAp.get(leg.approachId) ?? []
    arr.push(leg)
    byAp.set(leg.approachId, arr)
  }

  for (const ap of approaches) {
    const legs = byAp.get(ap.id) ?? []
    if (!legs.length) continue
    const base = polar(cx, cy, R * 0.78, ap.bearingDeg)
    // label
    const lab = polar(cx, cy, R * 1.22, ap.bearingDeg)
    g += `<text x="${lab.x}" y="${lab.y}" text-anchor="middle" fill="#334155" font-size="11" font-weight="600" font-family="system-ui,sans-serif">${escapeXml(ap.name.replace('进口', '方向'))}</text>`

    legs.slice(0, 3).forEach((leg, i) => {
      const off = (i - Math.min(1, legs.length - 1) * 0.5) * 36
      // offset perpendicular to approach
      const a = ((ap.bearingDeg - 90) * Math.PI) / 180
      const px = -Math.sin(a)
      const py = Math.cos(a)
      const x = base.x + px * off
      const y = base.y + py * off
      const col = losColor(leg.los)
      g += `<rect x="${x - 22}" y="${y - 12}" width="44" height="24" rx="4" fill="${col}" stroke="#fff" stroke-width="1"/>`
      const val =
        analysis.mode === 'roundabout'
          ? leg.delaySec.toFixed(0)
          : leg.delaySec.toFixed(0)
      g += `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700" font-family="system-ui,sans-serif">${val}</text>`
      g += `<text x="${x}" y="${y + 22}" text-anchor="middle" fill="#64748b" font-size="8" font-family="system-ui,sans-serif">${escapeXml(leg.movement)}</text>`
    })
  }

  // legend A-F
  const legsLos = ['A', 'B', 'C', 'D', 'E', 'F']
  legsLos.forEach((L, i) => {
    const x = 14 + i * 36
    const y = size - 22
    g += `<rect x="${x}" y="${y}" width="30" height="12" rx="2" fill="${losColor(L)}"/>`
    g += `<text x="${x + 15}" y="${y - 2}" text-anchor="middle" fill="#64748b" font-size="8">${L}</text>`
  })
  g += `<text x="${size - 12}" y="${size - 10}" text-anchor="end" fill="#94a3b8" font-size="8">s/veh 示意 · 非完整 HCM</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${g}</svg>`
}

export function unsignalizedLegsCsv(analysis: UnsignalizedAnalysis): string {
  const head = 'approach,movement,volume,capacity,vc,delay_s,los,note'
  const rows = analysis.legs.map((l) =>
    [
      JSON.stringify(l.approachName),
      l.movement,
      l.volume,
      l.capacity,
      l.vc.toFixed(3),
      l.delaySec.toFixed(1),
      l.los,
      JSON.stringify(l.note),
    ].join(','),
  )
  return [head, ...rows].join('\n')
}
