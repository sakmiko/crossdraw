/**
 * Critical approach / movement highlight board.
 * Homology: analyzeIntersection max v/c lane + computeSaturationKpi.
 */
import type { AnalysisResult, Approach, FlowScheme, SignalScheme } from '@/domain/types'
import { computeSaturationKpi } from '@/domain/signal/saturationKpi'
import { computeSchemeY } from '@/domain/signal/autoTimingPack'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function heat(vc: number): string {
  if (vc >= 1.0) return '#dc2626'
  if (vc >= 0.9) return '#ea580c'
  if (vc >= 0.75) return '#ca8a04'
  return '#16a34a'
}

export type CriticalLaneRow = {
  approachName: string
  movement: string
  vc: number
  delaySec: number
  volumePeak: number
  capacity: number
  rank: number
  isCritical: boolean
}

export function collectCriticalLanes(analysis: AnalysisResult, topN = 8): CriticalLaneRow[] {
  const sorted = analysis.lanes.slice().sort((a, b) => b.vc - a.vc)
  return sorted.slice(0, topN).map((l, i) => ({
    approachName: l.approachName,
    movement: l.movement,
    vc: l.vc,
    delaySec: l.delaySec,
    volumePeak: l.volumePeak,
    capacity: l.capacity,
    rank: i + 1,
    isCritical: i === 0,
  }))
}

export function criticalApproachBoardSvg(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  analysis: AnalysisResult,
  opts: { width?: number } = {},
): string {
  const W = opts.width ?? 720
  const kpi = computeSaturationKpi(approaches, flow, signal)
  const y = computeSchemeY(approaches, flow, signal)
  const rows = collectCriticalLanes(analysis, 8)
  const rowH = 28
  const top = 78
  const H = top + 20 + Math.max(1, rows.length) * rowH + 28

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="32" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">关键进口 / 车道组</text>`
  g += `<text x="24" y="52" fill="#0f172a" font-size="13" font-weight="700">${esc(kpi.criticalApproach)} · ${esc(kpi.criticalMovement)}</text>`
  g += `<text x="24" y="68" fill="#64748b" font-size="11">max v/c=${kpi.maxVc.toFixed(3)} · Y=${y.Y.toFixed(3)} · LOS ${kpi.los}</text>`

  // highlight badge
  g += `<rect x="${W - 120}" y="20" width="92" height="40" rx="8" fill="#fef2f2" stroke="#fecaca"/>`
  g += `<text x="${W - 74}" y="38" text-anchor="middle" fill="#dc2626" font-size="10" font-weight="600">CRITICAL</text>`
  g += `<text x="${W - 74}" y="52" text-anchor="middle" fill="#991b1b" font-size="12" font-weight="700">${kpi.maxVc.toFixed(2)}</text>`

  const xs = [24, 160, 240, 320, 400, 500]
  ;['#', '进口', '转向', 'v/c', '延误s', 'v/c条'].forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${top}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })

  const maxVc = Math.max(0.5, ...rows.map((r) => r.vc), 1)
  rows.forEach((r, i) => {
    const y = top + 20 + i * rowH
    const col = heat(r.vc)
    if (r.isCritical) {
      g += `<rect x="12" y="${y - 16}" width="${W - 24}" height="${rowH - 2}" rx="4" fill="#fef2f2"/>`
    }
    g += `<text x="24" y="${y}" fill="${r.isCritical ? '#dc2626' : '#0f172a'}" font-size="11" font-weight="${r.isCritical ? 700 : 400}">${r.rank}</text>`
    g += `<text x="160" y="${y}" fill="#0f172a" font-size="11">${esc(r.approachName.slice(0, 10))}</text>`
    g += `<text x="240" y="${y}" fill="#0f172a" font-size="11">${esc(r.movement)}</text>`
    g += `<text x="320" y="${y}" fill="${col}" font-size="11" font-weight="700">${r.vc.toFixed(3)}</text>`
    g += `<text x="400" y="${y}" fill="#0f172a" font-size="11">${r.delaySec.toFixed(1)}</text>`
    const bw = Math.max(4, (r.vc / maxVc) * 140)
    g += `<rect x="500" y="${y - 10}" width="${bw}" height="12" rx="3" fill="${col}"/>`
  })

  if (!rows.length) {
    g += `<text x="24" y="${top + 28}" fill="#94a3b8" font-size="12">无车道组</text>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export function criticalApproachMarkdown(
  projectName: string,
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  analysis: AnalysisResult,
): string {
  const kpi = computeSaturationKpi(approaches, flow, signal)
  const rows = collectCriticalLanes(analysis, 12)
  return [
    `# ${projectName} · 关键进口`,
    '',
    `- **关键：${kpi.criticalApproach} / ${kpi.criticalMovement}** · max v/c = **${kpi.maxVc.toFixed(3)}**`,
    `- 均 v/c ${kpi.avgVc.toFixed(3)} · 延误 ${kpi.avgDelay.toFixed(1)}s · LOS ${kpi.los}`,
    '',
    '| # | 进口 | 转向 | v/c | 延误s | v | c |',
    '|---|------|------|----:|------:|--:|--:|',
    ...rows.map(
      (r) =>
        `| ${r.rank} | ${r.approachName} | ${r.movement} | ${r.vc.toFixed(3)} | ${r.delaySec.toFixed(1)} | ${Math.round(r.volumePeak)} | ${Math.round(r.capacity)} |`,
    ),
    '',
    '- 关键 = 分析车道组最大 v/c；工程近似',
  ].join('\n')
}

export function criticalApproachCsv(analysis: AnalysisResult): string {
  const rows = collectCriticalLanes(analysis, 20)
  return [
    'rank,approach,movement,vc,delaySec,volumePeak,capacity,critical',
    ...rows.map((r) =>
      [
        r.rank,
        JSON.stringify(r.approachName),
        r.movement,
        r.vc.toFixed(4),
        r.delaySec.toFixed(2),
        r.volumePeak.toFixed(1),
        r.capacity.toFixed(1),
        r.isCritical ? 1 : 0,
      ].join(','),
    ),
  ].join('\n')
}
