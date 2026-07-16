/**
 * Overlap (搭接) phase review — not counted in main-ring Σ toward C.
 * Homology: signal.phases isOverlap + timingAlign mainSum.
 */
import type { SignalScheme } from '@/domain/types'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export type OverlapRow = {
  id: string
  name: string
  greenSec: number
  yellowSec: number
  allRedSec: number
  releases: string
  ring?: number
  barrierIndex?: number
}

export function collectOverlapRows(signal: SignalScheme): OverlapRow[] {
  return signal.phases
    .filter((p) => p.isOverlap)
    .map((p) => {
      const rels: string[] = []
      for (const [aid, movs] of Object.entries(p.releases ?? {})) {
        rels.push(`${aid.slice(0, 6)}:${(movs as string[]).join('')}`)
      }
      return {
        id: p.id,
        name: p.name,
        greenSec: p.greenSec,
        yellowSec: p.yellowSec,
        allRedSec: p.allRedSec,
        releases: rels.join(' ') || '—',
        ring: p.ring,
        barrierIndex: p.barrierIndex,
      }
    })
}

export function overlapReviewSvg(signal: SignalScheme, opts: { width?: number } = {}): string {
  const W = opts.width ?? 760
  const rows = collectOverlapRows(signal)
  const al = buildSignalTimingAlignment(signal)
  const mainN = signal.phases.filter((p) => !p.isOverlap).length
  const rowH = 28
  const top = 56
  const H = top + 24 + Math.max(1, rows.length) * rowH + 36

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="30" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">搭接相位审查</text>`
  g += `<text x="24" y="46" fill="#64748b" font-size="11">主相 ${mainN} · 搭接 ${rows.length} · 主环Σ ${al.mainSumSec.toFixed(0)}s / C=${signal.cycleSec}s</text>`

  const xs = [24, 140, 210, 270, 330, 420]
  ;['名称', 'G', 'Y', 'AR', '环/障', '放行'].forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${top}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })

  if (!rows.length) {
    g += `<text x="24" y="${top + 28}" fill="#94a3b8" font-size="12">无搭接相位</text>`
  }
  rows.forEach((r, i) => {
    const y = top + 22 + i * rowH
    g += `<text x="24" y="${y}" fill="#0f172a" font-size="11" font-weight="600">${esc(r.name)}</text>`
    g += `<text x="140" y="${y}" fill="#0f172a" font-size="11">${r.greenSec}</text>`
    g += `<text x="210" y="${y}" fill="#0f172a" font-size="11">${r.yellowSec}</text>`
    g += `<text x="270" y="${y}" fill="#0f172a" font-size="11">${r.allRedSec}</text>`
    g += `<text x="330" y="${y}" fill="#0f172a" font-size="11">R${r.ring ?? '—'} B${r.barrierIndex ?? '—'}</text>`
    g += `<text x="420" y="${y}" fill="#475569" font-size="10">${esc(r.releases.slice(0, 40))}</text>`
  })

  g += `<text x="24" y="${H - 14}" fill="#94a3b8" font-size="10">搭接不计入主环周期累加</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export function overlapReviewMarkdown(projectName: string, signal: SignalScheme): string {
  const rows = collectOverlapRows(signal)
  const al = buildSignalTimingAlignment(signal)
  return [
    `# ${projectName} · 搭接相位审查`,
    '',
    `- 主环 Σ = **${al.mainSumSec.toFixed(1)} s** · C = **${signal.cycleSec} s** · 搭接 **${rows.length}** 个`,
    '',
    '| 名称 | G | Y | AR | 环 | 障 | 放行 |',
    '|------|--:|--:|---:|----|----|------|',
    ...rows.map(
      (r) =>
        `| ${r.name} | ${r.greenSec} | ${r.yellowSec} | ${r.allRedSec} | ${r.ring ?? ''} | ${r.barrierIndex ?? ''} | ${r.releases} |`,
    ),
    '',
    '- 搭接相位不计入主环 Σ→C；不参与临界 Y（见配时优化说明）',
  ].join('\n')
}

export function overlapReviewCsv(signal: SignalScheme): string {
  const rows = collectOverlapRows(signal)
  return [
    'name,greenSec,yellowSec,allRedSec,ring,barrier,releases',
    ...rows.map((r) =>
      [JSON.stringify(r.name), r.greenSec, r.yellowSec, r.allRedSec, r.ring ?? '', r.barrierIndex ?? '', JSON.stringify(r.releases)].join(','),
    ),
  ].join('\n')
}
