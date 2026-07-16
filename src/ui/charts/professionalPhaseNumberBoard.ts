/**
 * Textbook-style phase number diagram (single-ring sequential + dual-ring stages).
 * Homology: signal.phases / dualRing stages only. No watermark.
 * Refs: NEMA phase numbering presentation; engineering plan sheet style.
 */
import type { Approach, SignalScheme } from '@/domain/types'
import { buildDualRingStages, isDualRingEnabled } from '@/domain/signal/dualRing'
import { dualRingPhaseNumberSvg } from './phaseNumberDiagram'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function shortName(n: string): string {
  return n.replace(/相位|南北|东西|进口/g, '').slice(0, 10) || n.slice(0, 10)
}

/** Full professional phase-number board (single or dual ring). */
export function professionalPhaseNumberBoardSvg(
  signal: SignalScheme,
  approaches: Approach[] = [],
  opts: { width?: number; projectName?: string } = {},
): string {
  if (isDualRingEnabled(signal)) {
    // enlarge dual ring board
    const dual = dualRingPhaseNumberSvg(signal, opts.width ?? 720)
    // wrap with title chrome
    const W = opts.width ?? 720
    const H = 220
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="20" y="28" fill="#0f172a" font-size="15" font-weight="700" font-family="system-ui,sans-serif">相位序号图 · 双环</text>
      <text x="20" y="46" fill="#64748b" font-size="11">${esc(opts.projectName ?? '')} · C=${signal.cycleSec}s · NEMA 风格示意</text>
      <g transform="translate(0,48)">${dual.replace(/<\/?svg[^>]*>/g, '')}</g>
    </svg>`
  }

  const phases = signal.phases.filter((p) => !p.isOverlap)
  const W = opts.width ?? 900
  const colW = Math.min(160, Math.max(100, (W - 40) / Math.max(1, phases.length)))
  const H = 200
  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="10" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="36" fill="#0f172a" font-size="15" font-weight="700" font-family="system-ui,sans-serif">相位序号图</text>`
  g += `<text x="28" y="54" fill="#64748b" font-size="11">${esc(opts.projectName ?? '')} · C=${signal.cycleSec}s · ${phases.length} 主相位 · 顺序编号</text>`

  phases.forEach((p, i) => {
    const x = 28 + i * colW
    const y = 72
    const gSec = p.greenSec
    const ySec = p.yellowSec
    const ar = p.allRedSec
    const total = gSec + ySec + ar
    // circle number
    const cx = x + 36
    const cy = y + 36
    g += `<circle cx="${cx}" cy="${cy}" r="28" fill="#0ea5e9" opacity="0.12" stroke="#0284c7" stroke-width="2"/>`
    g += `<text x="${cx}" y="${cy + 7}" text-anchor="middle" fill="#0369a1" font-size="22" font-weight="800" font-family="system-ui,sans-serif">${i + 1}</text>`
    g += `<text x="${cx}" y="${cy + 52}" text-anchor="middle" fill="#0f172a" font-size="11" font-weight="600">${esc(shortName(p.name))}</text>`
    g += `<text x="${cx}" y="${cy + 68}" text-anchor="middle" fill="#64748b" font-size="10">G${gSec}+Y${ySec}+AR${ar}=${total}s</text>`
    // mini release chips from Record<approachId, Movement[]>
    const relEntries = Object.entries(p.releases ?? {}).slice(0, 4)
    relEntries.forEach(([apId, movs], ri) => {
      const ap = approaches.find((a) => a.id === apId)
      const label = `${(ap?.name ?? '').replace('进口', '')}${(movs ?? []).join('')}`
      g += `<text x="${cx}" y="${cy + 84 + ri * 12}" text-anchor="middle" fill="#94a3b8" font-size="9">${esc(label.slice(0, 12))}</text>`
    })
  })

  g += `<text x="28" y="${H - 16}" fill="#94a3b8" font-size="10">顺序相位编号 · 与 phases 同源 · 非 NEMA 控制器完整映射</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function phaseNumberBoardMarkdown(projectName: string, signal: SignalScheme): string {
  const dual = isDualRingEnabled(signal)
  const lines = [
    `# ${projectName} · 相位序号`,
    '',
    `- 周期 C = **${signal.cycleSec} s**`,
    `- 模式：${dual ? '双环' : '单环顺序'}`,
    '',
    '| # | 相位 | G | Y | AR | 环 | 屏障 |',
    '|--:|------|--:|--:|---:|----:|-----:|',
  ]
  signal.phases.forEach((p, i) => {
    lines.push(
      `| ${i + 1} | ${p.name} | ${p.greenSec} | ${p.yellowSec} | ${p.allRedSec} | ${p.ring ?? 1} | ${p.barrierIndex ?? 0} |`,
    )
  })
  lines.push('', '- 工程示意编号，非完整 NEMA 映射')
  return lines.join('\n')
}
