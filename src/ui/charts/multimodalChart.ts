/**
 * Professional multimodal (ped / bike) bar chart — engineering panel style.
 * Does NOT feed motor vehicle v/c; visual-only with clear hierarchy.
 */
import type { Approach, FlowScheme } from '@/domain/types'
import { multimodalRows, sumMultimodal } from '@/domain/flow/multimodal'
import { CHART_COLORS, escapeXml, fmtNum, niceCeil } from './chartStandards'

const PED = '#38bdf8'
const BIKE = '#34d399'
const PED_DIM = 'rgba(56,189,248,0.15)'
const BIKE_DIM = 'rgba(52,211,153,0.15)'

export function multimodalBarSvg(
  approaches: Approach[],
  flow: FlowScheme,
  opts: { width?: number; height?: number } = {},
): string {
  const rows = multimodalRows(flow, approaches)
  const sum = sumMultimodal(flow, approaches)
  const width = opts.width ?? 400
  const height = opts.height ?? 200
  const left = 48
  const right = 16
  const top = 40
  const bot = 36
  const maxV = niceCeil(Math.max(1, ...rows.flatMap((r) => [r.ped, r.bike])))
  const plotW = width - left - right
  const plotH = height - top - bot
  const n = Math.max(1, rows.length)
  const groupW = plotW / n
  const barW = Math.min(18, groupW * 0.28)

  let g = ''
  // panel frame
  g += `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${CHART_COLORS.bg}" stroke="${CHART_COLORS.grid}" stroke-width="1"/>`
  // header
  g += `<text x="14" y="18" fill="${CHART_COLORS.axis}" font-size="12" font-weight="700" font-family="system-ui,sans-serif">行人 / 非机动车流量</text>`
  g += `<text x="14" y="32" fill="${CHART_COLORS.muted}" font-size="9.5" font-family="system-ui,sans-serif">示意骨架 · 不并入机动车 v/c · Σ行人 ${fmtNum(sum.ped, 'int')} · Σ非机 ${fmtNum(sum.bike, 'int')}</text>`

  // legend
  const lx = width - right - 120
  g += `<rect x="${lx}" y="10" width="10" height="10" rx="2" fill="${PED}"/>`
  g += `<text x="${lx + 14}" y="19" fill="${CHART_COLORS.muted}" font-size="10" font-family="system-ui,sans-serif">行人</text>`
  g += `<rect x="${lx + 48}" y="10" width="10" height="10" rx="2" fill="${BIKE}"/>`
  g += `<text x="${lx + 62}" y="19" fill="${CHART_COLORS.muted}" font-size="10" font-family="system-ui,sans-serif">非机</text>`

  // grid + y ticks
  for (let i = 0; i <= 4; i++) {
    const y = top + (plotH * i) / 4
    const val = maxV * (1 - i / 4)
    g += `<line x1="${left}" y1="${y}" x2="${left + plotW}" y2="${y}" stroke="${CHART_COLORS.grid}" stroke-width="0.8" stroke-dasharray="3 3"/>`
    g += `<text x="${left - 6}" y="${y + 3}" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="9" font-family="system-ui,sans-serif">${fmtNum(val, 'int')}</text>`
  }
  // baseline
  g += `<line x1="${left}" y1="${top + plotH}" x2="${left + plotW}" y2="${top + plotH}" stroke="${CHART_COLORS.axis}" stroke-width="1.2"/>`

  rows.forEach((r, i) => {
    const cx = left + i * groupW + groupW / 2
    const hPed = (r.ped / maxV) * plotH
    const hBike = (r.bike / maxV) * plotH
    const base = top + plotH
    const xPed = cx - barW - 2
    const xBike = cx + 2
    // soft backdrop
    g += `<rect x="${cx - groupW * 0.42}" y="${top}" width="${groupW * 0.84}" height="${plotH}" fill="${i % 2 ? PED_DIM : 'transparent'}"/>`
    // bars with rounded top via path-ish: rect + small cap
    g += `<rect x="${xPed}" y="${base - hPed}" width="${barW}" height="${Math.max(0, hPed)}" rx="2" fill="${PED}"/>`
    g += `<rect x="${xBike}" y="${base - hBike}" width="${barW}" height="${Math.max(0, hBike)}" rx="2" fill="${BIKE}"/>`
    // value labels when tall enough
    if (hPed > 14) {
      g += `<text x="${xPed + barW / 2}" y="${base - hPed - 3}" text-anchor="middle" fill="${PED}" font-size="8" font-weight="600" font-family="system-ui,sans-serif">${fmtNum(r.ped, 'int')}</text>`
    }
    if (hBike > 14) {
      g += `<text x="${xBike + barW / 2}" y="${base - hBike - 3}" text-anchor="middle" fill="${BIKE}" font-size="8" font-weight="600" font-family="system-ui,sans-serif">${fmtNum(r.bike, 'int')}</text>`
    }
    const label = escapeXml(r.name.replace('进口', ''))
    g += `<text x="${cx}" y="${height - 14}" text-anchor="middle" fill="${CHART_COLORS.axis}" font-size="10" font-weight="600" font-family="system-ui,sans-serif">${label}</text>`
  })

  g += `<text x="${left}" y="${height - 4}" fill="${CHART_COLORS.muted}" font-size="8.5" font-family="system-ui,sans-serif">单位：peds/h · veh/h · Crossdraw multimodal</text>`

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">${g}</svg>`
}
