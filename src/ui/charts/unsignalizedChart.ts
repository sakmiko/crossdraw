/**
 * Professional unsignalized / roundabout capacity chart.
 */
import type { UnsignalizedAnalysis } from '@/domain/analysis/unsignalized'
import { CHART_COLORS, escapeXml, fmtNum } from './chartStandards'

export function unsignalizedChartSvg(
  analysis: UnsignalizedAnalysis,
  opts: { width?: number; height?: number; title?: string } = {},
): string {
  const width = opts.width ?? 420
  const rows = analysis.legs.slice(0, 12)
  const rowH = 22
  const head = 48
  const foot = 28
  const height = opts.height ?? head + Math.max(3, rows.length) * rowH + foot
  const left = 120
  const right = 16
  const maxV = Math.max(1, ...rows.map((r) => Math.max(r.volume, r.capacity * 0.3)))

  let g = ''
  g += `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${CHART_COLORS.bg}" stroke="${CHART_COLORS.grid}"/>`
  const title =
    opts.title ??
    (analysis.mode === 'roundabout'
      ? '环形进口能力示意'
      : analysis.mode === 'twsc'
        ? '无信号两路停车示意'
        : '无信号评价')
  g += `<text x="14" y="18" fill="${CHART_COLORS.axis}" font-size="12" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(title)}</text>`
  g += `<text x="14" y="34" fill="${CHART_COLORS.muted}" font-size="9.5" font-family="system-ui,sans-serif">LOS ${escapeXml(analysis.los)} · ${fmtNum(analysis.avgDelay, 'delay')}s</text>`

  if (!rows.length) {
    g += `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="12">无数据</text>`
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">${g}</svg>`
  }

  const barW = width - left - right - 80
  rows.forEach((r, i) => {
    const y = head + i * rowH
    const vw = (r.volume / maxV) * barW
    const cw = (r.capacity / maxV) * barW
    const hot = r.vc > 0.95
    g += `<text x="${left - 6}" y="${y + 14}" text-anchor="end" fill="${CHART_COLORS.axis}" font-size="9.5" font-family="system-ui,sans-serif">${escapeXml(r.approachName.replace('进口', ''))} ${escapeXml(r.movement)}</text>`
    g += `<rect x="${left}" y="${y + 4}" width="${Math.max(1, cw)}" height="12" rx="2" fill="#1e293b" stroke="${CHART_COLORS.grid}"/>`
    g += `<rect x="${left}" y="${y + 5}" width="${Math.max(1, vw)}" height="10" rx="2" fill="${hot ? '#f87171' : '#38bdf8'}"/>`
    g += `<text x="${left + barW + 8}" y="${y + 14}" fill="${hot ? '#f87171' : CHART_COLORS.muted}" font-size="9" font-family="system-ui,sans-serif">v/c ${fmtNum(r.vc, 'vc')} · ${escapeXml(r.los)}</text>`
  })

  g += `<text x="14" y="${height - 10}" fill="${CHART_COLORS.muted}" font-size="9" font-family="system-ui,sans-serif">条=流量 · 底=能力</text>`
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">${g}</svg>`
}
