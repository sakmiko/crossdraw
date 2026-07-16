/**
 * Pedestrian Walk/FDW timing optimizer board — apply-ready recommendations.
 * Homology: recommendPhasePedTiming / crosswalkLengthM.
 */
import type { Approach, SignalScheme } from '@/domain/types'
import {
  applyPedTimingToSignal,
  recommendPhasePedTiming,
  crosswalkLengthM,
} from '@/domain/signal/pedTiming'
import { phaseHasPed, pedWalkFdw } from '@/domain/signal/pedestrian'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export type PedOptRow = {
  phaseId: string
  phaseName: string
  greenSec: number
  curWalk: number
  curFdw: number
  recWalk: number
  recFdw: number
  needG: number
  short: boolean
  controlFace: string
  lengthM: number
}

export function collectPedOptRows(signal: SignalScheme, approaches: Approach[]): PedOptRow[] {
  return signal.phases
    .filter((p) => phaseHasPed(p) && !p.isOverlap)
    .map((ph) => {
      const rec = recommendPhasePedTiming(ph, approaches)
      const cur = pedWalkFdw(ph)
      const need = rec.walkSec + rec.fdwSec
      const face0 = rec.faces[0]
      return {
        phaseId: ph.id,
        phaseName: ph.name,
        greenSec: ph.greenSec,
        curWalk: Math.round(cur.walk),
        curFdw: Math.round(cur.fdw),
        recWalk: rec.walkSec,
        recFdw: rec.fdwSec,
        needG: need,
        short: ph.greenSec < need,
        controlFace: face0?.approachName ?? '—',
        lengthM: face0?.lengthM ?? 0,
      }
    })
}

export function pedTimingOptBoardSvg(
  signal: SignalScheme,
  approaches: Approach[],
  opts: { width?: number } = {},
): string {
  const W = opts.width ?? 800
  const rows = collectPedOptRows(signal, approaches)
  const rowH = 28
  const top = 52
  const H = top + 24 + Math.max(1, rows.length) * rowH + 40

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="32" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">行人 Walk/FDW 优化</text>`
  g += `<text x="24" y="46" fill="#64748b" font-size="11">v=1.2m/s · 推算后可一键写入</text>`

  const xs = [24, 120, 180, 250, 320, 390, 460, 560]
  ;['相位', 'G', '现W', '现F', '推W', '推F', '需G', '控制面'].forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${top}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })

  if (!rows.length) {
    g += `<text x="24" y="${top + 28}" fill="#94a3b8" font-size="12">无行人相位</text>`
  }
  rows.forEach((r, i) => {
    const y = top + 22 + i * rowH
    const fill = r.short ? '#dc2626' : '#0f172a'
    g += `<text x="24" y="${y}" fill="#0f172a" font-size="11" font-weight="600">${esc(r.phaseName.slice(0, 10))}</text>`
    ;[r.greenSec, r.curWalk, r.curFdw, r.recWalk, r.recFdw, r.needG].forEach((v, j) => {
      g += `<text x="${xs[j + 1]}" y="${y}" fill="${j === 5 && r.short ? fill : '#0f172a'}" font-size="11" font-weight="${j === 5 && r.short ? 700 : 400}">${v}${j === 5 && r.short ? '!' : ''}</text>`
    })
    g += `<text x="${xs[7]}" y="${y}" fill="#475569" font-size="10">${esc(r.controlFace.slice(0, 12))}</text>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export function pedTimingOptMarkdown(
  projectName: string,
  signal: SignalScheme,
  approaches: Approach[],
): string {
  const rows = collectPedOptRows(signal, approaches)
  const after = applyPedTimingToSignal(signal, approaches)
  const afterRows = collectPedOptRows(after, approaches)
  return [
    `# ${projectName} · 行人 Walk/FDW 优化`,
    '',
    `| 相位 | G | 现W/F | 推W/F | 需G | 控制面 L(m) |`,
    `|------|--:|------:|------:|----:|-------------|`,
    ...rows.map(
      (r) =>
        `| ${r.phaseName} | ${r.greenSec} | ${r.curWalk}/${r.curFdw} | ${r.recWalk}/${r.recFdw} | ${r.needG}${r.short ? ' !' : ''} | ${r.controlFace} ${r.lengthM.toFixed(1)} |`,
    ),
    '',
    `应用后最短缺口相位数：${afterRows.filter((r) => r.short).length}`,
    '',
    '- 横道长度≈进口总宽；非完整 MUTCD/国标控制器',
  ].join('\n')
}

export function pedTimingOptCsv(signal: SignalScheme, approaches: Approach[]): string {
  const rows = collectPedOptRows(signal, approaches)
  return [
    'phase,green,curWalk,curFdw,recWalk,recFdw,needG,short,controlFace,lengthM',
    ...rows.map((r) =>
      [
        JSON.stringify(r.phaseName),
        r.greenSec,
        r.curWalk,
        r.curFdw,
        r.recWalk,
        r.recFdw,
        r.needG,
        r.short ? 1 : 0,
        JSON.stringify(r.controlFace),
        r.lengthM.toFixed(2),
      ].join(','),
    ),
  ].join('\n')
}

export { applyPedTimingToSignal, crosswalkLengthM }
