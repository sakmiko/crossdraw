/**
 * Critical-flow Y board: phase y table + bar chart.
 * Homology: computeSchemeY / criticalFlowRatios. Textbook light style; short labels only.
 */
import type { Approach, FlowScheme, SignalScheme } from '@/domain/types'
import { computeSchemeY, type YBreakdown } from '@/domain/signal/autoTimingPack'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function collectYReport(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): YBreakdown {
  return computeSchemeY(approaches, flow, signal)
}

/** Clean-ish board: numbers + short phase names, no long footnotes on figure. */
export function criticalYBoardSvg(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  opts: { width?: number } = {},
): string {
  const W = opts.width ?? 720
  const y = computeSchemeY(approaches, flow, signal)
  const rows = y.phaseRows
  const maxY = Math.max(0.05, ...rows.map((r) => r.y), y.Y)
  const barH = 22
  const top = 48
  const H = top + 36 + Math.max(1, rows.length) * (barH + 10) + 56

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="32" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">Y=${y.Y.toFixed(3)}${y.dualRing ? ' 双环' : ''}</text>`
  g += `<text x="${W - 24}" y="32" text-anchor="end" fill="#64748b" font-size="11">${rows.length} 相位</text>`

  const x0 = 120
  const barW = W - x0 - 80
  rows.forEach((r, i) => {
    const yy = top + 8 + i * (barH + 10)
    const w = Math.max(2, (r.y / maxY) * barW)
    g += `<text x="24" y="${yy + 15}" fill="#334155" font-size="11" font-family="system-ui,sans-serif">${esc(r.phase.slice(0, 12))}</text>`
    g += `<rect x="${x0}" y="${yy}" width="${barW}" height="${barH}" rx="4" fill="#f1f5f9"/>`
    g += `<rect x="${x0}" y="${yy}" width="${w}" height="${barH}" rx="4" fill="#0284c7"/>`
    g += `<text x="${x0 + w + 6}" y="${yy + 15}" fill="#0f172a" font-size="11" font-weight="600">${r.y.toFixed(3)}</text>`
  })

  const footY = H - 28
  g += `<text x="24" y="${footY}" fill="#0f172a" font-size="12" font-weight="700">Σy · 占比见 MD</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg">${g}</svg>`
}

export function criticalYMarkdown(
  projectName: string,
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): string {
  const y = computeSchemeY(approaches, flow, signal)
  return [
    `# ${projectName} · 关键流量比 Y`,
    '',
    `- **Y = ${y.Y.toFixed(3)}**${y.dualRing ? '（双环）' : ''}`,
    '',
    '| 相位 | y | 流量 | 占比 |',
    '|------|---|------|------|',
    ...y.phaseRows.map(
      (r) =>
        `| ${r.phase} | ${r.y.toFixed(3)} | ${Math.round(r.volume)} | ${(r.share * 100).toFixed(1)}% |`,
    ),
    '',
    '## 说明',
    ...y.notes.map((n) => `- ${n}`),
    '',
    '- Webster / 教材临界流比；工程示意',
  ].join('\n')
}

export function criticalYCsv(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): string {
  const y = computeSchemeY(approaches, flow, signal)
  return [
    'phase,y,volume,share,Y_total,dualRing',
    ...y.phaseRows.map(
      (r) =>
        `${JSON.stringify(r.phase)},${r.y.toFixed(4)},${r.volume.toFixed(1)},${r.share.toFixed(4)},${y.Y.toFixed(4)},${y.dualRing}`,
    ),
  ].join('\n')
}
