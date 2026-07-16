/**
 * Approach storage length check board (queue vs entry-widen bay).
 * Short labels only — no long footnotes on figure.
 */
import type { AnalysisResult, Approach, SignalScheme } from '@/domain/types'
import {
  collectStorageCheckRows,
  storageCheckSummary,
  type StorageCheckRow,
} from '@/domain/channel/storageCheck'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function statusColor(st: StorageCheckRow['status']): string {
  if (st === 'overflow') return '#dc2626'
  if (st === 'tight') return '#ea580c'
  return '#16a34a'
}

export function storageCheckBoardSvg(
  approaches: Approach[],
  signal: SignalScheme,
  analysis: AnalysisResult,
  opts: { width?: number } = {},
): string {
  const rows = collectStorageCheckRows(approaches, signal, analysis)
  const sum = storageCheckSummary(rows)
  const W = opts.width ?? 860
  const rowH = 26
  const top = 56
  const H = top + 24 + Math.max(1, rows.length) * rowH + 32

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="30" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">进口道储存校核</text>`
  g += `<text x="24" y="46" fill="#64748b" font-size="11">溢出 ${sum.overflow} · 紧张 ${sum.tight} · 正常 ${sum.ok} · 最大 ${(sum.maxRatio * 100).toFixed(0)}%</text>`

  const xs = [24, 130, 200, 280, 360, 440, 540, 640]
  ;['进口', '转向', '排队m', '展宽m', '可用m', '利用率', '状态', ''].forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${top}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })

  if (!rows.length) {
    g += `<text x="24" y="${top + 28}" fill="#94a3b8" font-size="12">无车道组</text>`
  }

  const maxQ = Math.max(1, ...rows.map((r) => Math.max(r.queueM, r.availableM)))
  const barW = 90

  rows.forEach((r, i) => {
    const y = top + 20 + i * rowH
    const col = statusColor(r.status)
    g += `<text x="24" y="${y}" fill="#0f172a" font-size="11">${esc(r.approachName.slice(0, 8))}</text>`
    g += `<text x="130" y="${y}" fill="#0f172a" font-size="11">${esc(r.movement)}</text>`
    g += `<text x="200" y="${y}" fill="#0f172a" font-size="11">${r.queueM.toFixed(1)}</text>`
    g += `<text x="280" y="${y}" fill="#0f172a" font-size="11">${r.bayM.toFixed(0)}</text>`
    g += `<text x="360" y="${y}" fill="#0f172a" font-size="11">${r.availableM.toFixed(0)}</text>`
    // mini bar: queue vs available
    const qBar = Math.max(2, (r.queueM / maxQ) * barW)
    const aBar = Math.max(2, (r.availableM / maxQ) * barW)
    g += `<rect x="440" y="${y - 12}" width="${aBar}" height="6" rx="2" fill="#e2e8f0"/>`
    g += `<rect x="440" y="${y - 4}" width="${qBar}" height="6" rx="2" fill="${col}"/>`
    g += `<text x="540" y="${y}" fill="${col}" font-size="11" font-weight="600">${(r.ratio * 100).toFixed(0)}%</text>`
    g += `<text x="640" y="${y}" fill="${col}" font-size="11" font-weight="700">${r.status === 'overflow' ? '溢出' : r.status === 'tight' ? '紧张' : '正常'}</text>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export {
  collectStorageCheckRows,
  storageCheckMarkdown,
  storageCheckCsv,
  storageCheckSummary,
} from '@/domain/channel/storageCheck'
