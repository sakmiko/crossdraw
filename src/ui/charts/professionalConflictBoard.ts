/**
 * Professional conflict matrix board + multi-phase summary.
 * Homology: buildPhaseConflictReport / detectPhaseConflicts. Textbook style, no watermark.
 * Refs: 相位冲突检查表（教材/方案）；规则见 domain/signal/conflictMatrix.
 */
import type { Approach, SignalScheme } from '@/domain/types'
import {
  allPhasesConflictHits,
  buildPhaseConflictReport,
  phaseConflictSummaryText,
} from '@/domain/signal/phaseConflictView'
import { conflictMatrixExportSvg, conflictDiagramExportSvg } from './conflictExport'
import { escapeXml } from './chartStandards'

function stripSvg(svg: string): string {
  return svg
    .replace(/^<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .replace(/<rect width="100%" height="100%" fill="[^"]*"\/>/i, '')
}

export function professionalConflictBoardSvg(
  approaches: Approach[],
  signal: SignalScheme,
  opts: {
    phaseId?: string | null
    width?: number
    projectName?: string
  } = {},
): string {
  const phaseId = opts.phaseId ?? signal.phases[0]?.id ?? null
  const report = buildPhaseConflictReport(approaches, signal, phaseId)
  const matrix = conflictMatrixExportSvg(approaches, signal, phaseId, { width: 480 })
  const diagram = conflictDiagramExportSvg(approaches, signal, phaseId)
  const allHits = allPhasesConflictHits(approaches, signal)
  const blocks = allHits.filter((h) => h.level === 'block').length
  const warns = allHits.filter((h) => h.level === 'warn').length

  const W = opts.width ?? 1000
  const matrixH = 320
  const diagramH = 320
  const listH = Math.min(280, 48 + allHits.slice(0, 12).length * 18 + 40)
  const H = 100 + matrixH + 16 + Math.max(diagramH, listH) + 40

  const phaseName =
    signal.phases.find((p) => p.id === phaseId)?.name ?? '—'

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="12" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="40" fill="#0f172a" font-size="17" font-weight="700" font-family="system-ui,sans-serif">相位冲突审查看板</text>`
  g += `<text x="28" y="60" fill="#64748b" font-size="12">${escapeXml(opts.projectName ?? '')} · ${escapeXml(signal.name)} · 当前相位 ${escapeXml(phaseName)}</text>`
  g += `<text x="${W - 28}" y="40" text-anchor="end" fill="#94a3b8" font-size="11">全方案 禁止 ${blocks} · 警告 ${warns}</text>`

  // KPI
  const chips: [string, string, string][] = [
    ['当前冲突', String(report.activeHits.length), report.activeHits.some((h) => h.level === 'block') ? '#dc2626' : '#ca8a04'],
    ['矩阵禁止格', String(report.counts.block), '#dc2626'],
    ['矩阵警告格', String(report.counts.warn), '#ca8a04'],
    ['兼容格', String(report.counts.ok), '#16a34a'],
  ]
  chips.forEach((c, i) => {
    const x = 28 + i * 160
    g += `<rect x="${x}" y="72" width="148" height="32" rx="6" fill="#f8fafc" stroke="${c[2]}"/>`
    g += `<text x="${x + 10}" y="93" fill="#64748b" font-size="10">${c[0]}</text>`
    g += `<text x="${x + 138}" y="93" text-anchor="end" fill="${c[2]}" font-size="14" font-weight="700">${c[1]}</text>`
  })

  // matrix left
  g += `<g transform="translate(24, 116)">`
  g += `<rect x="0" y="0" width="480" height="${matrixH}" rx="8" fill="#0a1020"/>`
  // scale matrix into box
  g += `<g transform="translate(8,8) scale(0.95)">${stripSvg(matrix)}</g>`
  g += `</g>`

  // diagram right of matrix top? place below row
  const y2 = 116 + matrixH + 12
  g += `<g transform="translate(24, ${y2})">`
  g += `<rect x="0" y="0" width="480" height="${diagramH}" rx="8" fill="#0b1018" stroke="#e2e8f0"/>`
  g += `<g transform="translate(10,10) scale(0.9)">${stripSvg(diagram)}</g>`
  g += `</g>`

  // hit list
  g += `<text x="520" y="${y2 + 16}" fill="#0f172a" font-size="13" font-weight="700">全方案同时放行冲突</text>`
  g += `<text x="520" y="${y2 + 34}" fill="#64748b" font-size="10">${escapeXml(phaseConflictSummaryText(report))}</text>`
  if (!allHits.length) {
    g += `<text x="520" y="${y2 + 60}" fill="#16a34a" font-size="12">各相位无同时放行冲突</text>`
  } else {
    allHits.slice(0, 12).forEach((h, i) => {
      const y = y2 + 56 + i * 18
      const col = h.level === 'block' ? '#dc2626' : '#ca8a04'
      g += `<text x="520" y="${y}" fill="${col}" font-size="11" font-family="system-ui,sans-serif">${escapeXml(h.phaseName)} · ${escapeXml(h.aLabel)}×${escapeXml(h.bLabel)}</text>`
    })
    if (allHits.length > 12) {
      g += `<text x="520" y="${y2 + 56 + 12 * 18}" fill="#94a3b8" font-size="10">…共 ${allHits.length} 条</text>`
    }
  }

  g += `<text x="28" y="${H - 22}" fill="#94a3b8" font-size="10">红=禁止 黄=警告 · 亮边=当前相位相悖 · 与 releases/冲突规则同源</text>`
  g += `<text x="${W - 28}" y="${H - 22}" text-anchor="end" fill="#94a3b8" font-size="10">非仿真轨迹冲突</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function conflictBoardCsv(approaches: Approach[], signal: SignalScheme): string {
  const hits = allPhasesConflictHits(approaches, signal)
  const head = 'phase,level,a,b,reason'
  const rows = hits.map(
    (h) =>
      `${JSON.stringify(h.phaseName)},${h.level},${JSON.stringify(h.aLabel)},${JSON.stringify(h.bLabel)},${JSON.stringify(h.reason)}`,
  )
  return [`# phases=${signal.phases.length} hits=${hits.length}`, head, ...rows].join('\n')
}
