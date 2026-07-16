/**
 * Multi-method timing compare board (Webster / HCM-delay / equal / fixed-C).
 * Homology: compareTimingMethods + recommendTimingRow. Clean short labels.
 */
import type { Approach, FlowScheme, SignalScheme } from '@/domain/types'
import {
  compareTimingMethods,
  recommendTimingRow,
  type TimingCompareRow,
} from '@/domain/analysis/timingCompare'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function losColor(los: string): string {
  if (los === 'A' || los === 'B') return '#16a34a'
  if (los === 'C') return '#ca8a04'
  if (los === 'D') return '#ea580c'
  return '#dc2626'
}

export function buildTimingCompareRows(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  fixedCycle?: number,
): TimingCompareRow[] {
  return compareTimingMethods(approaches, flow, signal, {
    targetVc: 0.9,
    fixedCycle: fixedCycle && fixedCycle > 0 ? fixedCycle : signal.cycleSec,
  })
}

export function timingCompareBoardSvg(
  rows: TimingCompareRow[],
  opts: { width?: number; recommendMethod?: string } = {},
): string {
  const W = opts.width ?? 880
  const rec = opts.recommendMethod ?? recommendTimingRow(rows)?.method
  const maxD = Math.max(1, ...rows.map((r) => r.avgDelay))
  const barMax = 160
  const rowH = 36
  const top = 44
  const H = top + 24 + Math.max(1, rows.length) * rowH + 28

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="32" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">配时方法比选</text>`

  const xs = [24, 160, 230, 300, 380, 460, 540, 620]
  ;['方法', 'C', 'Y', 'v/c', '延误s', '排队m', 'LOS', '推荐'].forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${top}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })

  rows.forEach((r, i) => {
    const y = top + 22 + i * rowH
    const isRec = r.method === rec
    if (isRec) {
      g += `<rect x="12" y="${y - 16}" width="${W - 24}" height="${rowH - 4}" rx="4" fill="#ecfdf5"/>`
    }
    const bw = Math.max(4, (r.avgDelay / maxD) * barMax)
    g += `<text x="24" y="${y}" fill="#0f172a" font-size="11" font-weight="${isRec ? 700 : 400}">${esc(r.label)}</text>`
    g += `<text x="160" y="${y}" fill="#0f172a" font-size="11">${r.cycleSec}</text>`
    g += `<text x="230" y="${y}" fill="#0f172a" font-size="11">${r.Y.toFixed(3)}</text>`
    g += `<text x="300" y="${y}" fill="#0f172a" font-size="11">${r.avgVc.toFixed(3)}</text>`
    g += `<rect x="380" y="${y - 12}" width="${bw}" height="14" rx="3" fill="#0284c7"/>`
    g += `<text x="${380 + bw + 4}" y="${y}" fill="#0f172a" font-size="10">${r.avgDelay.toFixed(1)}</text>`
    g += `<text x="540" y="${y}" fill="#0f172a" font-size="11">${r.avgQueueM.toFixed(1)}</text>`
    g += `<text x="620" y="${y}" fill="${losColor(r.los)}" font-size="12" font-weight="700">${r.los}</text>`
    if (isRec) {
      g += `<text x="680" y="${y}" fill="#16a34a" font-size="11" font-weight="700">★</text>`
    }
  })

  if (!rows.length) {
    g += `<text x="24" y="${top + 28}" fill="#94a3b8" font-size="12">无数据</text>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export function timingCompareMarkdown(projectName: string, rows: TimingCompareRow[]): string {
  const rec = recommendTimingRow(rows)
  return [
    `# ${projectName} · 配时方法比选`,
    '',
    rec ? `- **推荐：${rec.label}**（C=${rec.cycleSec}s · 延误 ${rec.avgDelay.toFixed(1)}s · LOS ${rec.los}）` : '',
    '',
    '| 方法 | C | Y | v/c | 延误s | 排队m | LOS | ΣG |',
    '|------|--:|--:|----:|------:|------:|:---:|---:|',
    ...rows.map(
      (r) =>
        `| ${r.label}${r.method === rec?.method ? ' ★' : ''} | ${r.cycleSec} | ${r.Y.toFixed(3)} | ${r.avgVc.toFixed(3)} | ${r.avgDelay.toFixed(1)} | ${r.avgQueueM.toFixed(1)} | ${r.los} | ${r.sumGreen} |`,
    ),
    '',
    '## 规则',
    '- 推荐：在 v/c≤1.05 中取延误最低，否则取 v/c 最低',
    '- Webster / HCM延误 / 等绿灯 / 固定周期 · 工程近似',
  ].join('\n')
}

export function timingCompareCsv(rows: TimingCompareRow[]): string {
  return [
    'method,label,cycleSec,Y,avgVc,avgDelay,avgQueueM,los,sumGreen',
    ...rows.map((r) =>
      [
        r.method,
        JSON.stringify(r.label),
        r.cycleSec,
        r.Y.toFixed(4),
        r.avgVc.toFixed(4),
        r.avgDelay.toFixed(2),
        r.avgQueueM.toFixed(2),
        r.los,
        r.sumGreen,
      ].join(','),
    ),
  ].join('\n')
}
