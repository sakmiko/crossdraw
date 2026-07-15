/**
 * Multi-corridor green-band KPI comparison chart + table helpers.
 * Each row measured via measureCorridor (same engine as live band page).
 */
import type { BandCorridor, BandResult } from '@/domain/types'
import { measureCorridor } from '@/domain/analysis/corridor'
import { fmtNum, niceCeil, escapeXml } from '@/ui/charts/chartStandards'

export type CorridorKpiRow = {
  id: string
  name: string
  speedKmh: number
  method: string
  nodes: number
  lengthM: number
  forwardSec: number
  backwardSec: number
  bandwidthRatio: number
  standardSpeedKmh: number
  halfCycleDistanceM: number
  result: BandResult
}

export function collectCorridorKpis(corridors: BandCorridor[]): CorridorKpiRow[] {
  return corridors.map((c) => {
    const result = measureCorridor(c)
    const lengthM =
      c.nodes.length >= 2
        ? Math.max(...c.nodes.map((n) => n.distanceM)) - Math.min(...c.nodes.map((n) => n.distanceM))
        : 0
    return {
      id: c.id,
      name: c.name,
      speedKmh: c.speedKmh,
      method: c.method,
      nodes: c.nodes.length,
      lengthM,
      forwardSec: result.forwardBandwidthSec ?? result.bandwidthSec,
      backwardSec: result.backwardBandwidthSec ?? 0,
      bandwidthRatio: result.bandwidthRatio,
      standardSpeedKmh: result.standardSpeedKmh,
      halfCycleDistanceM: result.halfCycleDistanceM,
      result,
    }
  })
}

const METHOD_LABEL: Record<string, string> = {
  classic: '经典数解',
  'optimized-scan': '优化扫描',
  'one-way': '单向',
  'two-way-equal': '双向等带',
  graphical: '图解',
}

export function corridorKpiCompareSvg(
  rows: CorridorKpiRow[],
  opts: { width?: number; height?: number; metric?: 'ratio' | 'forward' | 'both' } = {},
): string {
  const width = opts.width ?? 520
  const height = opts.height ?? 220
  const metric = opts.metric ?? 'both'
  const pad = { t: 28, r: 16, b: 48, l: 48 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  if (!rows.length) {
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg"><rect width="100%" height="100%" fill="#0a1020"/><text x="12" y="24" fill="#8494ab" font-size="11">无走廊数据</text></svg>`
  }

  const maxRatio = niceCeil(Math.max(0.05, ...rows.map((r) => r.bandwidthRatio * 100)))
  const maxBw = niceCeil(Math.max(1, ...rows.map((r) => Math.max(r.forwardSec, r.backwardSec))))

  const n = rows.length
  const groupW = innerW / n
  const barW = Math.min(22, groupW * 0.28)

  let body = ''
  // grid
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (innerH * i) / 4
    body += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="#1e293b" stroke-width="1"/>`
    if (metric === 'ratio') {
      const v = maxRatio * (1 - i / 4)
      body += `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="#8494ab" font-size="9">${fmtNum(v, 'int')}%</text>`
    } else {
      const v = maxBw * (1 - i / 4)
      body += `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="#8494ab" font-size="9">${fmtNum(v, 'sec')}</text>`
    }
  }

  rows.forEach((r, i) => {
    const cx = pad.l + groupW * i + groupW / 2
    if (metric === 'ratio' || metric === 'both') {
      // if both, draw ratio as thin right axis bars using bandwidth seconds primarily
    }
    const fH = (r.forwardSec / maxBw) * innerH
    const bH = (r.backwardSec / maxBw) * innerH
    const x0 = cx - barW - 3
    const x1 = cx + 3
    body += `<rect x="${x0}" y="${pad.t + innerH - fH}" width="${barW}" height="${Math.max(1, fH)}" fill="#0284c7" rx="2"/>`
    body += `<rect x="${x1}" y="${pad.t + innerH - bH}" width="${barW}" height="${Math.max(1, bH)}" fill="#db2777" rx="2"/>`
    // ratio label on top
    body += `<text x="${cx}" y="${pad.t + innerH - Math.max(fH, bH) - 6}" text-anchor="middle" fill="#e2e8f0" font-size="9" font-weight="700">${(r.bandwidthRatio * 100).toFixed(0)}%</text>`
    // name
    const label = r.name.length > 8 ? r.name.slice(0, 8) + '…' : r.name
    body += `<text x="${cx}" y="${height - 28}" text-anchor="middle" fill="#94a3b8" font-size="10">${escapeXml(label)}</text>`
    body += `<text x="${cx}" y="${height - 14}" text-anchor="middle" fill="#64748b" font-size="8">${escapeXml(METHOD_LABEL[r.method] ?? r.method)}</text>`
  })

  body += `<text x="${pad.l}" y="16" fill="#8494ab" font-size="11" font-weight="700">多走廊带宽对比（上行/下行 · s）</text>`
  body += `<text x="${width - pad.r}" y="16" text-anchor="end" fill="#64748b" font-size="9">蓝=上行 · 粉=下行 · 顶标=带宽比 · 与 measureCorridor 同源</text>`

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    ${body}
  </svg>`
}

export function multiBandMarkdown(projectName: string, rows: CorridorKpiRow[]): string {
  const lines = [
    `# ${projectName} — 多走廊绿波对比`,
    '',
    `| 走廊 | 方法 | 节点 | 长度m | 速度 | 上行b(s) | 下行b(s) | 带宽比 | 带速 |`,
    `|---|---|---:|---:|---:|---:|---:|---:|---:|`,
  ]
  for (const r of rows) {
    lines.push(
      `| ${r.name} | ${METHOD_LABEL[r.method] ?? r.method} | ${r.nodes} | ${r.lengthM.toFixed(0)} | ${r.speedKmh} | ${r.forwardSec.toFixed(1)} | ${r.backwardSec.toFixed(1)} | ${(r.bandwidthRatio * 100).toFixed(1)}% | ${r.standardSpeedKmh.toFixed(1)} |`,
    )
  }
  lines.push('', '## 说明', '', '- 带宽由圆环弧相交度量（与绿波页 KPI 同源）', '- 各走廊独立速度/方法/节点', '')
  return lines.join('\n')
}
