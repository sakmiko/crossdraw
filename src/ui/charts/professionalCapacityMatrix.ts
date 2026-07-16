/**
 * RoadGee-style capacity / saturation matrix for lane groups.
 * Homology: AnalysisResult.lanes only. No watermarks.
 */
import type { AnalysisResult, Approach } from '@/domain/types'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function vcFill(vc: number): string {
  if (vc >= 1.0) return '#b91c1c'
  if (vc >= 0.9) return '#c2410c'
  if (vc >= 0.75) return '#ca8a04'
  if (vc >= 0.5) return '#16a34a'
  return '#0ea5e9'
}

function losLabel(l: AnalysisResult): string {
  return l.losFinal
}

export function professionalCapacityMatrixSvg(
  approaches: Approach[],
  analysis: AnalysisResult,
  opts: { width?: number; projectName?: string; signalName?: string } = {},
): string {
  const W = opts.width ?? 920
  const lanes = analysis.lanes
  const headH = 56
  const rowH = 28
  const tableTop = headH + 32
  const H = tableTop + Math.max(1, lanes.length) * rowH + 48
  const xs = [28, 110, 170, 240, 320, 400, 480, 560, 640, 720]
  const heads = ['进口', '转向', '流量v', '饱和流s', 'λ', '能力c', 'v/c', '延误s', '排队m']

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="10" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="36" fill="#0f172a" font-size="16" font-weight="700" font-family="system-ui,sans-serif">车道组通行能力 / 饱和度矩阵</text>`
  g += `<text x="28" y="52" fill="#64748b" font-size="11">${esc(opts.projectName ?? '')} · ${esc(opts.signalName ?? '')} · LOS ${esc(losLabel(analysis))} · 均 v/c ${analysis.avgVc.toFixed(3)}</text>`

  // KPI strip
  const kpis: [string, string, string][] = [
    ['均v/c', analysis.avgVc.toFixed(3), vcFill(analysis.avgVc)],
    ['均延误', `${analysis.avgDelay.toFixed(1)}s`, analysis.avgDelay > 55 ? '#dc2626' : '#16a34a'],
    ['均排队', `${analysis.avgQueueM.toFixed(1)}m`, '#0369a1'],
    ['LOS', losLabel(analysis), '#0f172a'],
  ]
  kpis.forEach((k, i) => {
    const x = W - 340 + i * 82
    g += `<rect x="${x}" y="18" width="74" height="24" rx="4" fill="#f8fafc" stroke="#e2e8f0"/>`
    g += `<text x="${x + 4}" y="35" fill="#64748b" font-size="9">${k[0]}</text>`
    g += `<text x="${x + 70}" y="35" text-anchor="end" fill="${k[2]}" font-size="11" font-weight="700">${esc(k[1])}</text>`
  })

  // header
  heads.forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${tableTop}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })
  g += `<line x1="24" y1="${tableTop + 6}" x2="${W - 24}" y2="${tableTop + 6}" stroke="#e2e8f0"/>`

  if (!lanes.length) {
    g += `<text x="28" y="${tableTop + 36}" fill="#94a3b8" font-size="12">无车道组结果</text>`
  }

  lanes.forEach((lane, i) => {
    const y = tableTop + 28 + i * rowH
    const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff'
    g += `<rect x="16" y="${y - 14}" width="${W - 32}" height="${rowH}" fill="${bg}"/>`
    const ap = approaches.find((a) => a.id === lane.approachId)
    const name = (ap?.name ?? lane.approachName ?? '').replace('进口', '')
    const vals: string[] = [
      name,
      lane.movement,
      String(Math.round(lane.volumePeak ?? 0)),
      String(Math.round(lane.satFlow ?? 0)),
      (lane.greenRatio ?? 0).toFixed(3),
      String(Math.round(lane.capacity ?? 0)),
      (lane.vc ?? 0).toFixed(3),
      (lane.delaySec ?? 0).toFixed(1),
      (lane.queueM ?? 0).toFixed(1),
    ]
    vals.forEach((v, j) => {
      const fill = j === 6 ? vcFill(lane.vc ?? 0) : '#0f172a'
      const weight = j === 6 ? 700 : 400
      g += `<text x="${xs[j]}" y="${y}" fill="${fill}" font-size="11" font-weight="${weight}">${esc(v)}</text>`
    })
    // mini vc bar at right
    const barX = 810
    const barW = 80
    const filled = Math.min(barW, Math.max(0, (lane.vc ?? 0) * barW * 0.8))
    g += `<rect x="${barX}" y="${y - 10}" width="${barW}" height="8" rx="2" fill="#e2e8f0"/>`
    g += `<rect x="${barX}" y="${y - 10}" width="${filled}" height="8" rx="2" fill="${vcFill(lane.vc ?? 0)}"/>`
    g += `<line x1="${barX + barW * 0.75}" y1="${y - 10}" x2="${barX + barW * 0.75}" y2="${y - 2}" stroke="#475569" stroke-width="0.5" opacity="0.6"/>`
  })

  g += `<text x="28" y="${H - 18}" fill="#94a3b8" font-size="10">与 analyzeIntersection 车道组同源 · HCM/Webster 工程近似</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function capacityMatrixCsv(analysis: AnalysisResult): string {
  const head = 'approach,movement,volume,satFlow,greenRatio,capacity,vc,delaySec,queueM'
  const rows = analysis.lanes.map((l) =>
    [
      JSON.stringify(l.approachName ?? l.approachId),
      l.movement,
      l.volumePeak ?? 0,
      l.satFlow ?? 0,
      l.greenRatio ?? 0,
      l.capacity ?? 0,
      l.vc ?? 0,
      l.delaySec ?? 0,
      l.queueM ?? 0,
    ].join(','),
  )
  return [`# los=${analysis.losFinal} avgVc=${analysis.avgVc}`, head, ...rows].join('\n')
}

export function capacityMatrixMarkdown(projectName: string, analysis: AnalysisResult): string {
  return [
    `# ${projectName} · 通行能力 / 饱和度`,
    '',
    `- LOS **${losLabel(analysis)}** · 平均 v/c **${analysis.avgVc.toFixed(3)}** · 平均延误 **${analysis.avgDelay.toFixed(1)} s**`,
    '',
    '| 进口 | 向 | v | s | λ | c | v/c | d | Q |',
    '|------|----|--:|--:|--:|--:|----:|--:|--:|',
    ...analysis.lanes.map(
      (l) =>
        `| ${(l.approachName ?? '').replace('进口', '')} | ${l.movement} | ${Math.round(l.volumePeak ?? 0)} | ${Math.round(l.satFlow ?? 0)} | ${(l.greenRatio ?? 0).toFixed(2)} | ${Math.round(l.capacity ?? 0)} | ${(l.vc ?? 0).toFixed(3)} | ${(l.delaySec ?? 0).toFixed(1)} | ${(l.queueM ?? 0).toFixed(1)} |`,
    ),
    '',
    '- 依据：HCM/Webster 工程近似；与评价模块同源',
  ].join('\n')
}
