/**
 * Multi-corridor offset-link result board.
 */
import type { MultiCorridorLinkResult } from '@/domain/analysis/multiCorridorLink'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function multiCorridorLinkBoardSvg(
  r: MultiCorridorLinkResult,
  opts: { width?: number } = {},
): string {
  const W = opts.width ?? 820
  const rowH = 28
  const top = 52
  const H = top + 24 + Math.max(1, r.rows.length) * rowH + 36
  const modeLabel =
    r.mode === 'offset-scan' ? '扫描' : r.mode === 'progressive-reverse' ? '反向连续' : '连续相位差'

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="30" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">多走廊相位差联动</text>`
  g += `<text x="24" y="46" fill="#64748b" font-size="11">${modeLabel} · ${r.rows.length} 走廊 · 未变差 ${r.improvedCount}</text>`

  const xs = [24, 160, 240, 320, 400, 500]
  ;['走廊', '前Σb', '后Σb', 'Δ', '后比', '详情'].forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${top}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })

  if (!r.rows.length) {
    g += `<text x="24" y="${top + 28}" fill="#94a3b8" font-size="12">无走廊</text>`
  }
  r.rows.forEach((row, i) => {
    const y = top + 22 + i * rowH
    const d = row.afterTotal - row.beforeTotal
    const col = d >= -1e-6 ? '#16a34a' : '#dc2626'
    g += `<text x="24" y="${y}" fill="#0f172a" font-size="11" font-weight="600">${esc(row.name.slice(0, 12))}</text>`
    g += `<text x="160" y="${y}" fill="#0f172a" font-size="11">${row.beforeTotal.toFixed(1)}</text>`
    g += `<text x="240" y="${y}" fill="#0f172a" font-size="11">${row.afterTotal.toFixed(1)}</text>`
    g += `<text x="320" y="${y}" fill="${col}" font-size="11" font-weight="700">${d >= 0 ? '+' : ''}${d.toFixed(1)}</text>`
    g += `<text x="400" y="${y}" fill="#0f172a" font-size="11">${(row.afterRatio * 100).toFixed(1)}%</text>`
    g += `<text x="500" y="${y}" fill="#64748b" font-size="10">${esc(row.detail.slice(0, 28))}</text>`
  })

  g += `<text x="24" y="${H - 14}" fill="#94a3b8" font-size="10">${esc(r.honesty)}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export {
  linkMultiCorridorOffsets,
  multiCorridorLinkMarkdown,
  multiCorridorLinkCsv,
  type MultiCorridorLinkMode,
  type MultiCorridorLinkResult,
} from '@/domain/analysis/multiCorridorLink'
