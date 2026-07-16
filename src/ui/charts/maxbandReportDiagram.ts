/**
 * MAXBAND discrete report diagram — offsets bars + dual bandwidth KPI.
 * Data from buildMaxbandReport / BandCorridor only. No watermark.
 */
import type { BandCorridor } from '@/domain/types'
import { buildMaxbandReport, type MaxbandReport } from '@/domain/analysis/maxbandReport'
import { escapeXml, fmtNum } from './chartStandards'

export function maxbandReportDiagramSvg(
  corridor: BandCorridor,
  opts: { width?: number; height?: number; report?: MaxbandReport } = {},
): string {
  const rep = opts.report ?? buildMaxbandReport(corridor)
  const W = opts.width ?? 720
  const H = opts.height ?? 320
  const padL = 56
  const padR = 20
  const padT = 48
  const padB = 40
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const nodes = [...rep.nodes].sort((a, b) => a.distanceM - b.distanceM)
  const C = nodes[0]?.cycleSec || 90
  const maxD = Math.max(1, ...nodes.map((n) => n.distanceM))

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#fafafa"/>`
  g += `<text x="14" y="22" fill="#0f172a" font-size="13" font-weight="700" font-family="system-ui,sans-serif">MAXBAND 相位差报告</text>`
  g += `<text x="14" y="38" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">${escapeXml(rep.method)} · V=${fmtNum(rep.speedKmh, 'int')} km/h · ${escapeXml(rep.honesty)}</text>`

  // KPI chips
  const chips = [
    [`b↑`, `${fmtNum(rep.forwardSec, 'sec')}s`, '#16a34a'],
    [`b↓`, `${fmtNum(rep.backwardSec, 'sec')}s`, '#2563eb'],
    [`比`, `${fmtNum(rep.bandwidthRatio * 100, 'pct')}%`, '#ca8a04'],
  ]
  chips.forEach((c, i) => {
    const x = W - 14 - (3 - i) * 88
    g += `<rect x="${x}" y="10" width="80" height="28" rx="6" fill="#fff" stroke="${c[2]}"/>`
    g += `<text x="${x + 8}" y="28" fill="#64748b" font-size="9">${c[0]}</text>`
    g += `<text x="${x + 40}" y="29" fill="${c[2]}" font-size="12" font-weight="700">${c[1]}</text>`
  })

  // axes
  g += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#94a3b8" stroke-width="1"/>`
  g += `<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#94a3b8" stroke-width="1"/>`
  g += `<text x="12" y="${padT + plotH / 2}" fill="#64748b" font-size="10" transform="rotate(-90 12 ${padT + plotH / 2})">相位差 o (s)</text>`
  g += `<text x="${padL + plotW / 2}" y="${H - 10}" fill="#64748b" font-size="10" text-anchor="middle">桩号 (m)</text>`

  // C reference line
  g += `<line x1="${padL}" y1="${padT}" x2="${padL + plotW}" y2="${padT}" stroke="#e2e8f0" stroke-dasharray="4 3"/>`
  g += `<text x="${padL + 4}" y="${padT + 12}" fill="#94a3b8" font-size="9">C=${C}</text>`

  // bars / stems
  nodes.forEach((n, i) => {
    const x = padL + (n.distanceM / maxD) * plotW
    const o = Math.max(0, Math.min(C, n.offsetSec))
    const y = padT + plotH - (o / Math.max(1, C)) * plotH
    const col = n.locked ? '#dc2626' : '#0ea5e9'
    g += `<line x1="${x}" y1="${padT + plotH}" x2="${x}" y2="${y}" stroke="${col}" stroke-width="2"/>`
    g += `<circle cx="${x}" cy="${y}" r="5" fill="${col}" stroke="#fff" stroke-width="1.5"/>`
    g += `<text x="${x}" y="${padT + plotH + 14}" fill="#334155" font-size="9" text-anchor="middle">${escapeXml(n.name.replace('路口', ''))}</text>`
    g += `<text x="${x + 6}" y="${y - 6}" fill="${col}" font-size="9">o=${fmtNum(o, 'sec')}</text>`
    if (i > 0) {
      const prev = nodes[i - 1]
      const x0 = padL + (prev.distanceM / maxD) * plotW
      const y0 = padT + plotH - (Math.max(0, Math.min(C, prev.offsetSec)) / Math.max(1, C)) * plotH
      g += `<line x1="${x0}" y1="${y0}" x2="${x}" y2="${y}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 2" opacity="0.7"/>`
    }
  })

  // dual bandwidth visual bar at bottom of plot
  const bwY = padT + plotH - 8
  const bwMax = Math.max(rep.forwardSec, rep.backwardSec, 1)
  const bwScale = Math.min(plotW * 0.35, 120)
  g += `<text x="${padL}" y="${bwY - 10}" fill="#64748b" font-size="9">带宽条</text>`
  g += `<rect x="${padL}" y="${bwY}" width="${(rep.forwardSec / bwMax) * bwScale}" height="6" fill="#16a34a" rx="2"/>`
  g += `<rect x="${padL + bwScale + 12}" y="${bwY}" width="${(rep.backwardSec / bwMax) * bwScale}" height="6" fill="#2563eb" rx="2"/>`

  g += `<text x="${W - 12}" y="${H - 8}" fill="#94a3b8" font-size="8" text-anchor="end">工程离散搜索 · 非 MIP</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}
