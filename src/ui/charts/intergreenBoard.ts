/**
 * Intergreen review board — yellow / all-red vs recommendation.
 */
import type { Approach, SignalScheme } from '@/domain/types'
import {
  collectIntergreenRows,
  type IntergreenRow,
} from '@/domain/signal/intergreen'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function col(st: IntergreenRow['status']): string {
  if (st === 'short') return '#dc2626'
  if (st === 'long') return '#ea580c'
  return '#16a34a'
}

export function intergreenBoardSvg(
  signal: SignalScheme,
  approaches: Approach[],
  opts: { width?: number } = {},
): string {
  const rows = collectIntergreenRows(signal, approaches)
  const W = opts.width ?? 860
  const rowH = 26
  const top = 56
  const H = top + 24 + Math.max(1, rows.length) * rowH + 28
  const shortN = rows.filter((r) => r.status === 'short').length

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="30" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">清空间隔审查</text>`
  g += `<text x="24" y="46" fill="#64748b" font-size="11">偏短 ${shortN} · 推黄 ${rows[0]?.recYellow ?? '—'}s · 推全红 ${rows[0]?.recAllRed ?? '—'}s · v≈${rows[0]?.speedKmh ?? '—'}km/h</text>`

  const xs = [24, 160, 230, 300, 370, 450, 540]
  ;['相位', '黄s', '推黄', '全红', '推全红', '状态', ''].forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${top}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })

  rows.forEach((r, i) => {
    const y = top + 20 + i * rowH
    const c = col(r.status)
    if (r.status === 'short') {
      g += `<rect x="12" y="${y - 16}" width="${W - 24}" height="${rowH - 2}" rx="4" fill="#fef2f2"/>`
    }
    g += `<text x="24" y="${y}" fill="#0f172a" font-size="11" font-weight="600">${esc(r.phaseName.slice(0, 10))}${r.isOverlap ? '·搭' : ''}</text>`
    g += `<text x="160" y="${y}" fill="${r.yellowOk ? '#0f172a' : '#dc2626'}" font-size="11">${r.yellowSec}</text>`
    g += `<text x="230" y="${y}" fill="#64748b" font-size="11">${r.recYellow}</text>`
    g += `<text x="300" y="${y}" fill="${r.allRedOk ? '#0f172a' : '#dc2626'}" font-size="11">${r.allRedSec}</text>`
    g += `<text x="370" y="${y}" fill="#64748b" font-size="11">${r.recAllRed}</text>`
    g += `<text x="450" y="${y}" fill="${c}" font-size="11" font-weight="700">${r.status === 'short' ? '偏短' : r.status === 'long' ? '偏长' : '正常'}</text>`
    g += `<text x="540" y="${y}" fill="#64748b" font-size="10">${esc(r.note)}</text>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export {
  collectIntergreenRows,
  applyIntergreenRecommendations,
  intergreenMarkdown,
  intergreenCsv,
  recommendYellowSec,
  recommendAllRedSec,
} from '@/domain/signal/intergreen'
