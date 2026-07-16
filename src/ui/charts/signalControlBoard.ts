/**
 * Combined signal control board: KPI strip + control matrix + mini timing bars.
 * Professional light canvas, no watermark. Data from releases + phases + SaturationKpi.
 */
import type { Approach, Phase, SignalScheme } from '@/domain/types'
import type { SaturationKpi } from '@/domain/signal/saturationKpi'
import { controlMatrixChartInput } from '@/domain/signal/releaseAlign'
import { escapeXml } from './chartStandards'

const LOS_C: Record<string, string> = {
  A: '#22c55e',
  B: '#16a34a',
  C: '#84cc16',
  D: '#eab308',
  E: '#f97316',
  F: '#ef4444',
}

export function signalControlBoardSvg(
  approaches: Approach[],
  signal: SignalScheme,
  kpi: SaturationKpi,
  opts: { width?: number } = {},
): string {
  const W = opts.width ?? 900
  const input = controlMatrixChartInput(signal, approaches)
  const phases = signal.phases.filter((p) => !p.isOverlap)
  const cellW = Math.max(48, Math.min(72, (W - 100) / Math.max(1, phases.length)))
  const cellH = 28
  const left = 88
  const top = 108
  const matrixH = top + approaches.length * cellH + 24
  const timingTop = matrixH + 12
  const timingH = 16 + phases.length * 22 + 36
  const H = timingTop + timingH

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#fafafa"/>`
  g += `<text x="16" y="24" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">信号管控与饱和度看板</text>`
  g += `<text x="16" y="42" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">${escapeXml(kpi.honesty)}</text>`

  // KPI chips
  const chips: [string, string, string][] = [
    ['C', `${kpi.cycleSec}s`, '#0369a1'],
    ['Y', kpi.Y.toFixed(3), '#7c3aed'],
    ['均v/c', kpi.avgVc.toFixed(3), kpi.avgVc > 0.9 ? '#dc2626' : '#16a34a'],
    ['最大v/c', kpi.maxVc.toFixed(3), kpi.maxVc > 0.95 ? '#dc2626' : '#ca8a04'],
    ['延误', `${kpi.avgDelay.toFixed(1)}s`, '#0ea5e9'],
    ['LOS', kpi.los, LOS_C[kpi.los] ?? '#64748b'],
  ]
  chips.forEach((c, i) => {
    const x = 16 + i * 110
    g += `<rect x="${x}" y="52" width="102" height="40" rx="8" fill="#fff" stroke="${c[2]}"/>`
    g += `<text x="${x + 8}" y="68" fill="#64748b" font-size="9">${c[0]}</text>`
    g += `<text x="${x + 8}" y="84" fill="${c[2]}" font-size="14" font-weight="700">${escapeXml(c[1])}</text>`
  })

  // Control matrix title
  g += `<text x="16" y="${top - 14}" fill="#0f172a" font-size="12" font-weight="700">相位放行管控图</text>`
  g += `<text x="${W - 16}" y="${top - 14}" text-anchor="end" fill="#64748b" font-size="9">单元格=L·T·R · 空=禁行 · 与 releases 同源</text>`

  phases.forEach((ph, j) => {
    g += `<text x="${left + j * cellW + cellW / 2}" y="${top - 4}" text-anchor="middle" fill="#64748b" font-size="9">${escapeXml(ph.name)}</text>`
  })
  approaches.forEach((ap, i) => {
    const y = top + i * cellH
    g += `<text x="12" y="${y + 18}" fill="#334155" font-size="10" font-family="system-ui,sans-serif">${escapeXml(ap.name.replace('进口', ''))}</text>`
    phases.forEach((ph, j) => {
      const movs = [...(ph.releases[ap.id] ?? [])].sort(
        (a, b) => 'LTRU'.indexOf(a) - 'LTRU'.indexOf(b),
      )
      const x = left + j * cellW
      const on = movs.length > 0
      const label = movs.length ? movs.join('·') : '—'
      g += `<rect x="${x + 2}" y="${y + 4}" width="${cellW - 4}" height="${cellH - 8}" rx="4" fill="${on ? '#dcfce7' : '#f1f5f9'}" stroke="${on ? '#16a34a' : '#cbd5e1'}"/>`
      g += `<text x="${x + cellW / 2}" y="${y + 18}" text-anchor="middle" fill="${on ? '#166534' : '#94a3b8'}" font-size="10" font-weight="700">${escapeXml(label)}</text>`
    })
  })

  // Mini timing bars
  g += `<text x="16" y="${timingTop + 4}" fill="#0f172a" font-size="12" font-weight="700">配时条（周期轴）</text>`
  const barLeft = 88
  const barW = W - barLeft - 24
  const C = Math.max(1, signal.cycleSec)
  phases.forEach((ph, i) => {
    const y = timingTop + 16 + i * 22
    const start = phases.slice(0, i).reduce((s, p) => s + p.greenSec + p.yellowSec + p.allRedSec, 0)
    const g0 = (start / C) * barW
    const gw = (ph.greenSec / C) * barW
    const yw = (ph.yellowSec / C) * barW
    g += `<text x="12" y="${y + 12}" fill="#334155" font-size="9">${escapeXml(ph.name)}</text>`
    g += `<rect x="${barLeft}" y="${y + 2}" width="${barW}" height="12" rx="2" fill="#fee2e2"/>`
    g += `<rect x="${barLeft + g0}" y="${y + 2}" width="${Math.max(1, gw)}" height="12" fill="#22c55e"/>`
    g += `<rect x="${barLeft + g0 + gw}" y="${y + 2}" width="${Math.max(0, yw)}" height="12" fill="#eab308"/>`
    g += `<text x="${barLeft + g0 + 2}" y="${y + 11}" fill="#14532d" font-size="8" font-weight="700">${ph.greenSec}</text>`
  })
  g += `<line x1="${barLeft}" y1="${timingTop + 16 + phases.length * 22}" x2="${barLeft + barW}" y2="${timingTop + 16 + phases.length * 22}" stroke="#94a3b8"/>`
  g += `<text x="${barLeft}" y="${timingTop + 16 + phases.length * 22 + 12}" fill="#64748b" font-size="9">0</text>`
  g += `<text x="${barLeft + barW}" y="${timingTop + 16 + phases.length * 22 + 12}" text-anchor="end" fill="#64748b" font-size="9">C=${C}s</text>`

  g += `<text x="${W - 12}" y="${H - 8}" text-anchor="end" fill="#94a3b8" font-size="8">教材管控图 + 配时条风格 · 工程示意</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}
