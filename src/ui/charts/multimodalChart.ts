/**
 * Simple ped/bike bar chart — multimodal volumes only (not motor v/c).
 */
import type { Approach, FlowScheme } from '@/domain/types'
import { multimodalRows } from '@/domain/flow/multimodal'
import { CHART_COLORS, escapeXml, fmtNum, niceCeil } from './chartStandards'

export function multimodalBarSvg(
  approaches: Approach[],
  flow: FlowScheme,
  opts: { width?: number; height?: number } = {},
): string {
  const rows = multimodalRows(flow, approaches)
  const width = opts.width ?? 360
  const height = opts.height ?? 160
  const left = 72
  const right = 12
  const top = 28
  const bot = 24
  const maxV = niceCeil(Math.max(1, ...rows.flatMap((r) => [r.ped, r.bike])))
  const plotW = width - left - right
  const plotH = height - top - bot
  const groupW = plotW / Math.max(1, rows.length)
  let body = ''
  body += `<text x="10" y="16" fill="${CHART_COLORS.axis}" font-size="11" font-weight="700">行人/非机流量</text>`
  body += `<text x="${width - right}" y="16" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="9">不并入机动车 v/c</text>`
  rows.forEach((r, i) => {
    const x0 = left + i * groupW + groupW * 0.15
    const bw = groupW * 0.3
    const hPed = (r.ped / maxV) * plotH
    const hBike = (r.bike / maxV) * plotH
    const base = top + plotH
    body += `<rect x="${x0}" y="${base - hPed}" width="${bw}" height="${Math.max(0, hPed)}" fill="#38bdf8"/>`
    body += `<rect x="${x0 + bw + 2}" y="${base - hBike}" width="${bw}" height="${Math.max(0, hBike)}" fill="#34d399"/>`
    body += `<text x="${left + i * groupW + groupW / 2}" y="${height - 8}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="9">${escapeXml(r.name.replace('进口', ''))}</text>`
  })
  body += `<text x="10" y="${height - 8}" fill="${CHART_COLORS.muted}" font-size="9">蓝行人 · 绿非机 · max ${fmtNum(maxV, 'int')}</text>`
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg"><rect width="100%" height="100%" fill="${CHART_COLORS.bg}"/>${body}</svg>`
}
