/**
 * Webster lost-time L board + optimal C vs Y curve (engineering sketch).
 * Homology: websterLostTime + websterOptimalCycle; main phases only.
 */
import type { SignalScheme } from '@/domain/types'
import { websterLostTime, websterOptimalCycle } from '@/domain/analysis/lostTime'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export type LostTimeReport = {
  mainPhaseCount: number
  lostPerPhaseSec: number
  allRedTotalSec: number
  L: number
  mainSumSec: number
  cycleSec: number
  closed: boolean
  notes: string[]
  /** sample optimal C for Y grid */
  curve: { Y: number; C: number }[]
}

export function buildLostTimeReport(
  signal: SignalScheme,
  opts: { lostPerPhaseSec?: number } = {},
): LostTimeReport {
  const main = signal.phases.filter((p) => !p.isOverlap)
  const allRedTotalSec = main.reduce((s, p) => s + (p.allRedSec || 0), 0)
  const ell = opts.lostPerPhaseSec ?? signal.startLossSec ?? 3
  const { L, notes } = websterLostTime({
    mainPhaseCount: Math.max(1, main.length),
    lostPerPhaseSec: ell,
    allRedTotalSec,
  })
  const al = buildSignalTimingAlignment(signal)
  const curve: { Y: number; C: number }[] = []
  for (let y = 0.2; y <= 0.85; y += 0.05) {
    curve.push({ Y: Math.round(y * 100) / 100, C: websterOptimalCycle(y, L) })
  }
  return {
    mainPhaseCount: main.length,
    lostPerPhaseSec: ell,
    allRedTotalSec,
    L,
    mainSumSec: al.mainSumSec,
    cycleSec: signal.cycleSec,
    closed: al.closed,
    notes,
    curve,
  }
}

export function lostTimeBoardSvg(signal: SignalScheme, opts: { width?: number; Y?: number } = {}): string {
  const W = opts.width ?? 720
  const rep = buildLostTimeReport(signal)
  const Y = opts.Y ?? 0.5
  const Copt = websterOptimalCycle(Y, rep.L)
  const H = 280

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="32" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">损失时间 L</text>`

  // KPI cards
  const cards: [string, string][] = [
    ['L', `${rep.L.toFixed(1)}s`],
    ['主相 n', String(rep.mainPhaseCount)],
    ['ℓ', `${rep.lostPerPhaseSec}s`],
    ['ΣAR', `${rep.allRedTotalSec.toFixed(0)}s`],
    ['C', `${rep.cycleSec}s`],
    ['Σ主环', `${rep.mainSumSec.toFixed(0)}s`],
  ]
  cards.forEach((c, i) => {
    const x = 24 + (i % 6) * 110
    const y = 48
    g += `<rect x="${x}" y="${y}" width="100" height="44" rx="6" fill="#f1f5f9"/>`
    g += `<text x="${x + 8}" y="${y + 18}" fill="#64748b" font-size="10">${c[0]}</text>`
    g += `<text x="${x + 8}" y="${y + 36}" fill="#0f172a" font-size="14" font-weight="700">${c[1]}</text>`
  })

  g += `<text x="24" y="120" fill="#334155" font-size="12">L = n×ℓ + ΣAR · C₀≈(1.5L+5)/(1−Y)</text>`
  g += `<text x="24" y="140" fill="#0f172a" font-size="12" font-weight="600">示例 Y=${Y.toFixed(2)} → C₀≈${Copt}s</text>`

  // mini curve
  const padL = 50
  const padT = 160
  const cw = W - padL - 40
  const ch = 90
  const ys = rep.curve.map((p) => p.Y)
  const cs = rep.curve.map((p) => p.C)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const minC = Math.min(...cs)
  const maxC = Math.max(...cs)
  const pts = rep.curve
    .map((p, i) => {
      const x = padL + ((p.Y - minY) / Math.max(0.01, maxY - minY)) * cw
      const y = padT + ch - ((p.C - minC) / Math.max(1, maxC - minC)) * ch
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  g += `<path d="${pts}" fill="none" stroke="#0284c7" stroke-width="2"/>`
  g += `<text x="${padL}" y="${padT + ch + 16}" fill="#64748b" font-size="10">Y</text>`
  g += `<text x="16" y="${padT + 10}" fill="#64748b" font-size="10">C</text>`

  g += `<text x="24" y="${H - 16}" fill="#94a3b8" font-size="10">${esc(rep.notes[0] ?? '')}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export function lostTimeMarkdown(projectName: string, signal: SignalScheme, Y = 0.5): string {
  const rep = buildLostTimeReport(signal)
  const Copt = websterOptimalCycle(Y, rep.L)
  return [
    `# ${projectName} · 损失时间 L`,
    '',
    `- **L = ${rep.L.toFixed(1)} s**（n=${rep.mainPhaseCount} · ℓ=${rep.lostPerPhaseSec}s · ΣAR=${rep.allRedTotalSec.toFixed(1)}s）`,
    `- 当前 C = ${rep.cycleSec}s · 主环Σ = ${rep.mainSumSec.toFixed(1)}s · ${rep.closed ? '闭合' : '未闭合'}`,
    `- 示例：Y=${Y} → Webster C₀≈ **${Copt} s**`,
    '',
    '## 说明',
    ...rep.notes.map((n) => `- ${n}`),
    '- 工程示意；非完整启动损失实测',
  ].join('\n')
}

export function lostTimeCsv(signal: SignalScheme): string {
  const rep = buildLostTimeReport(signal)
  return [
    'Y,C_opt',
    ...rep.curve.map((p) => `${p.Y},${p.C}`),
    '',
    `L,${rep.L}`,
    `n,${rep.mainPhaseCount}`,
    `ell,${rep.lostPerPhaseSec}`,
    `allRed,${rep.allRedTotalSec}`,
  ].join('\n')
}
