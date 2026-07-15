/**
 * LOS legend — thresholds must match domain analysis (HCM control delay).
 */
import { LOS_COLORS, losByControlDelay, fmtNum, escapeXml } from './chartStandards'

/** HCM signalized control-delay thresholds (s/veh) displayed next to band */
export const LOS_DELAY_THRESHOLDS: { los: string; maxDelay: number | null; label: string }[] = [
  { los: 'A', maxDelay: 10, label: '≤10' },
  { los: 'B', maxDelay: 20, label: '≤20' },
  { los: 'C', maxDelay: 35, label: '≤35' },
  { los: 'D', maxDelay: 55, label: '≤55' },
  { los: 'E', maxDelay: 80, label: '≤80' },
  { los: 'F', maxDelay: null, label: '>80' },
]

export function losLegendSvg(
  currentLos: string,
  delaySec: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 360
  const height = opts.height ?? 96
  const order = LOS_DELAY_THRESHOLDS
  const idx = Math.max(
    0,
    order.findIndex((x) => x.los === currentLos.toUpperCase()),
  )
  const bw = (width - 24) / order.length
  let body = ''
  order.forEach((row, i) => {
    const x = 12 + i * bw
    const col = LOS_COLORS[row.los] ?? '#94a3b8'
    const on = i === idx
    body += `<rect x="${x}" y="30" width="${bw - 4}" height="22" rx="3" fill="${col}" opacity="${on ? 1 : 0.32}" stroke="${on ? '#f8fafc' : 'none'}" stroke-width="1.2"/>`
    body += `<text x="${x + (bw - 4) / 2}" y="45" text-anchor="middle" fill="${on ? '#0f172a' : '#0f172a'}" font-size="11" font-weight="700">${row.los}</text>`
    body += `<text x="${x + (bw - 4) / 2}" y="66" text-anchor="middle" fill="#94a3b8" font-size="9">${row.label}s</text>`
  })
  const check = losByControlDelay(delaySec)
  const consistent = check === currentLos.toUpperCase()
  body += `<text x="12" y="16" fill="#8494ab" font-size="10" font-weight="700">服务水平（HCM 控制延误）</text>`
  body += `<text x="${width - 12}" y="16" text-anchor="end" fill="#94a3b8" font-size="9">当前 ${escapeXml(currentLos)} · d=${fmtNum(delaySec, 'delay')}s ${consistent ? '· 与阈值一致' : '· 注意：色带按延误复核=' + check}</text>`
  body += `<text x="12" y="${height - 8}" fill="#64748b" font-size="8">阈值 A≤10 B≤20 C≤35 D≤55 E≤80 F>80 s/veh · 与 analyzeIntersection 同源</text>`
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    ${body}
  </svg>`
}
