/**
 * High-resolution analysis plan pack: 2×2 LOS/delay/queue/vc + KPI + lane table.
 * Homology: AnalysisResult / roadgeeAnalysisPlanSvg only. No watermark.
 * Style: RoadGee 评价平面图 + 教材 LOS 色带.
 */
import type { AnalysisResult, Approach } from '@/domain/types'
import {
  roadgeeAnalysisPlanSvg,
  type AnalysisPlanMetric,
} from './roadgeeAnalysisPlan'
import { escapeXml, fmtNum } from './chartStandards'
import { checkAnalysisIntegrity } from '@/domain/analysis/integrity'

function stripSvg(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
}

const METRICS: AnalysisPlanMetric[] = ['los', 'delay', 'queue', 'vc']
const TITLES: Record<AnalysisPlanMetric, string> = {
  los: '服务水平',
  delay: '延误时间',
  queue: '排队长度',
  vc: '饱和度 v/c',
}

export function professionalAnalysisPlanPackSvg(
  approaches: Approach[],
  analysis: AnalysisResult,
  opts: {
    cellSize?: number
    projectName?: string
    channelName?: string
    signalName?: string
  } = {},
): string {
  const cell = opts.cellSize ?? 440
  const gap = 16
  const pad = 20
  const headerH = 96
  const tableRows = Math.min(analysis.lanes.length, 14)
  const tableH = 40 + tableRows * 18 + 36
  const gridW = cell * 2 + gap
  const gridH = cell * 2 + gap
  const W = pad * 2 + gridW
  const H = headerH + gridH + tableH + pad

  const integ = checkAnalysisIntegrity(analysis)

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f1f5f9"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="12" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="${pad}" y="36" fill="#0f172a" font-size="18" font-weight="700" font-family="system-ui,sans-serif">交叉口评价平面图合集</text>`
  g += `<text x="${pad}" y="56" fill="#64748b" font-size="12" font-family="system-ui,sans-serif">${escapeXml(opts.projectName ?? '')}${opts.channelName ? ' · ' + escapeXml(opts.channelName) : ''}${opts.signalName ? ' · ' + escapeXml(opts.signalName) : ''}</text>`
  g += `<text x="${W - pad}" y="36" text-anchor="end" fill="#94a3b8" font-size="11">${cell * 2 + gap}× 四联图 · 同源 ${integ.ok ? '✓' : '!'}</text>`

  // KPI chips
  const chips: [string, string, string][] = [
    ['均 v/c', analysis.avgVc.toFixed(3), analysis.avgVc > 0.9 ? '#dc2626' : '#16a34a'],
    ['均延误', `${analysis.avgDelay.toFixed(1)}s`, '#0284c7'],
    ['均排队', `${analysis.avgQueueM.toFixed(1)}m`, '#7c3aed'],
    ['LOS', analysis.losFinal, analysis.losFinal === 'F' || analysis.losFinal === 'E' ? '#dc2626' : '#16a34a'],
  ]
  chips.forEach((c, i) => {
    const x = pad + i * 150
    g += `<rect x="${x}" y="66" width="140" height="28" rx="6" fill="#f8fafc" stroke="${c[2]}"/>`
    g += `<text x="${x + 10}" y="85" fill="#64748b" font-size="10">${c[0]}</text>`
    g += `<text x="${x + 130}" y="85" text-anchor="end" fill="${c[2]}" font-size="13" font-weight="700">${escapeXml(c[1])}</text>`
  })

  METRICS.forEach((metric, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = pad + col * (cell + gap)
    const y = headerH + row * (cell + gap)
    const plan = roadgeeAnalysisPlanSvg(approaches, analysis, { size: cell, metric })
    g += `<g transform="translate(${x},${y})">`
    g += `<rect x="0" y="0" width="${cell}" height="${cell}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
    g += stripSvg(plan)
    g += `</g>`
  })

  // lane table
  const ty = headerH + gridH + 12
  g += `<text x="${pad}" y="${ty + 8}" fill="#0f172a" font-size="13" font-weight="700">车道组评价明细（与分析表同源）</text>`
  const heads = ['进口', '转向', '流量', 'v/c', '延误s', '排队m']
  const xs = [pad, pad + 100, pad + 160, pad + 240, pad + 320, pad + 420]
  heads.forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${ty + 28}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })
  g += `<line x1="${pad}" y1="${ty + 34}" x2="${W - pad}" y2="${ty + 34}" stroke="#e2e8f0"/>`
  analysis.lanes.slice(0, tableRows).forEach((l, ri) => {
    const y = ty + 50 + ri * 18
    const cells = [
      l.approachName.replace('进口', ''),
      l.movement,
      String(Math.round(l.volumePeak)),
      l.vc.toFixed(3),
      l.delaySec.toFixed(1),
      l.queueM.toFixed(1),
    ]
    cells.forEach((c, i) => {
      g += `<text x="${xs[i]}" y="${y}" fill="#0f172a" font-size="11" font-family="system-ui,sans-serif">${escapeXml(c)}</text>`
    })
  })

  g += `<text x="${pad}" y="${H - 18}" fill="#94a3b8" font-size="10">Webster/HCM 工程近似 · docs/research/05-professional-basis.md · 无水印</text>`
  g += `<text x="${W - pad}" y="${H - 18}" text-anchor="end" fill="#94a3b8" font-size="10">改流量/配时后重新评价即更新</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function analysisPlanPackMarkdown(
  projectName: string,
  analysis: AnalysisResult,
  meta?: { channel?: string; signal?: string },
): string {
  const integ = checkAnalysisIntegrity(analysis)
  return [
    `# ${projectName} · 评价平面图合集简报`,
    '',
    meta?.channel ? `- 渠化：${meta.channel}` : '',
    meta?.signal ? `- 信号：${meta.signal}` : '',
    `- 均 v/c ${analysis.avgVc.toFixed(3)} · 均延误 ${analysis.avgDelay.toFixed(1)} s · 均排队 ${analysis.avgQueueM.toFixed(1)} m · LOS ${analysis.losFinal}`,
    `- 同源校验：${integ.ok ? '通过' : `失败 Δv/c=${integ.deltaVc} Δ延误=${integ.deltaDelay}`}`,
    `- 依据：HCM/Webster 延误与 v/c 工程近似（非商业仿真）`,
    '',
    '| 进口 | 转向 | 流量 | v/c | 延误s | 排队m |',
    '|------|:----:|-----:|----:|------:|------:|',
    ...analysis.lanes.map(
      (l) =>
        `| ${l.approachName} | ${l.movement} | ${Math.round(l.volumePeak)} | ${l.vc.toFixed(3)} | ${l.delaySec.toFixed(1)} | ${l.queueM.toFixed(1)} |`,
    ),
  ]
    .filter(Boolean)
    .join('\n')
}

export function analysisPlanPackCsv(analysis: AnalysisResult): string {
  const head = 'approach,movement,volumePeak,vc,delaySec,queueM'
  const rows = analysis.lanes.map(
    (l) =>
      `${JSON.stringify(l.approachName)},${l.movement},${l.volumePeak},${l.vc},${l.delaySec},${l.queueM}`,
  )
  return [
    `# avgVc=${analysis.avgVc} avgDelay=${analysis.avgDelay} avgQueueM=${analysis.avgQueueM} los=${analysis.losFinal}`,
    head,
    ...rows,
  ].join('\n')
}

export { METRICS as ANALYSIS_PLAN_METRICS, TITLES as ANALYSIS_PLAN_TITLES }
