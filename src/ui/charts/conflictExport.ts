/**
 * Standalone conflict matrix SVG for export / print composition.
 * Uses buildPhaseConflictReport so highlights match the signal workspace.
 */
import type { Approach, SignalScheme } from '@/domain/types'
import { buildPhaseConflictReport, phaseConflictSummaryText } from '@/domain/signal/phaseConflictView'
import { conflictMatrixSvg } from './svgCharts'

export function conflictMatrixExportSvg(
  approaches: Approach[],
  signal: SignalScheme,
  phaseId?: string | null,
  opts: { width?: number } = {},
): string {
  const report = buildPhaseConflictReport(approaches, signal, phaseId ?? null)
  const levels = report.cells.map((row) => row.map((c) => c.level))
  const hot = new Set<string>(report.activeHits.map((h) => [h.aKey, h.bKey].sort().join('|')))
  const phaseName =
    signal.phases.find((p) => p.id === (phaseId ?? signal.phases[0]?.id))?.name ?? '—'
  return conflictMatrixSvg(
    report.keys.map((k) => k.label),
    levels,
    {
      width: opts.width ?? 420,
      keys: report.keys.map((k) => `${k.approachId}:${k.movement}`),
      active: report.activeKeys,
      hotPairs: hot,
      subtitle: `${signal.name} · ${phaseName} · ${phaseConflictSummaryText(report)}`,
    },
  )
}

export function conflictHitsMarkdown(
  projectName: string,
  approaches: Approach[],
  signal: SignalScheme,
): string {
  const lines = [
    `# ${projectName} — 信号冲突审查`,
    '',
    `信号方案：**${signal.name}** · 周期 C=${signal.cycleSec}s`,
    '',
  ]
  for (const ph of signal.phases) {
    const r = buildPhaseConflictReport(approaches, signal, ph.id)
    lines.push(`## 相位 ${ph.name}`)
    lines.push('')
    lines.push(phaseConflictSummaryText(r))
    lines.push('')
    if (!r.activeHits.length) {
      lines.push('- （无同时放行冲突）')
      lines.push('')
      continue
    }
    lines.push('| 等级 | 运动对 | 原因 |')
    lines.push('|---|---|---|')
    for (const h of r.activeHits) {
      lines.push(`| ${h.level === 'block' ? '禁止' : '警告'} | ${h.aLabel} × ${h.bLabel} | ${h.reason} |`)
    }
    lines.push('')
  }
  lines.push('## 说明', '', '- 规则与 detectPhaseConflicts / 冲突矩阵同源', '')
  return lines.join('\n')
}
