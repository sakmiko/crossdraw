/**
 * RoadGee-style multi-scheme scorecard: baseline + ranked cards + delta bars.
 * Homology: collectCompareRows / AnalysisResult only.
 */
import type { SchemeKpi } from '@/domain/analysis/schemeDiff'
import { schemeDeltas } from '@/domain/analysis/schemeDiff'
import { escapeXml } from './chartStandards'

const LOS_C: Record<string, string> = {
  A: '#22c55e',
  B: '#16a34a',
  C: '#84cc16',
  D: '#eab308',
  E: '#f97316',
  F: '#ef4444',
}

export function schemeScorecardSvg(
  kpis: SchemeKpi[],
  opts: { width?: number; height?: number; baseIndex?: number } = {},
): string {
  const W = opts.width ?? 720
  const list = kpis.slice(0, 8)
  if (!list.length) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="120"><text x="20" y="60" fill="#64748b">暂无方案</text></svg>`
  }
  const baseIdx = Math.min(opts.baseIndex ?? 0, list.length - 1)
  const base = list[baseIdx]
  const cardH = 88
  const pad = 12
  const H = 48 + list.length * (cardH + 8) + 24
  const maxDelay = Math.max(1, ...list.map((k) => k.avgDelay))
  const maxVc = Math.max(0.1, ...list.map((k) => k.avgVc))

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#fafafa"/>`
  g += `<text x="14" y="22" fill="#0f172a" font-size="13" font-weight="700" font-family="system-ui,sans-serif">方案比选记分卡</text>`
  g += `<text x="14" y="38" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">基准：${escapeXml(base.label)} · 延误/ v/c 同源评价</text>`

  list.forEach((k, i) => {
    const y = 48 + i * (cardH + 8)
    const isBase = i === baseIdx
    const dDelay = k.avgDelay - base.avgDelay
    const dVc = k.avgVc - base.avgVc
    const better = !isBase && (dDelay < -0.5 || (Math.abs(dDelay) < 0.5 && dVc < -0.02))
    const border = isBase ? '#0369a1' : better ? '#16a34a' : '#e2e8f0'
    g += `<rect x="${pad}" y="${y}" width="${W - pad * 2}" height="${cardH}" rx="8" fill="#fff" stroke="${border}" stroke-width="${isBase ? 2 : 1}"/>`
    g += `<text x="${pad + 12}" y="${y + 20}" fill="#0f172a" font-size="12" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(k.label)}${isBase ? ' · 基准' : better ? ' · 更优' : ''}</text>`
    const los = LOS_C[k.los] ?? '#64748b'
    g += `<rect x="${W - pad - 44}" y="${y + 8}" width="32" height="22" rx="4" fill="${los}"/>`
    g += `<text x="${W - pad - 28}" y="${y + 24}" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">${escapeXml(k.los)}</text>`

    // delay bar
    const barX = pad + 12
    const barW = W - pad * 2 - 160
    const dw = (k.avgDelay / maxDelay) * barW
    g += `<text x="${barX}" y="${y + 40}" fill="#64748b" font-size="9">延误</text>`
    g += `<rect x="${barX + 36}" y="${y + 32}" width="${barW}" height="8" rx="2" fill="#e2e8f0"/>`
    g += `<rect x="${barX + 36}" y="${y + 32}" width="${Math.max(2, dw)}" height="8" rx="2" fill="#0ea5e9"/>`
    g += `<text x="${barX + 36 + barW + 6}" y="${y + 40}" fill="#0f172a" font-size="10" font-weight="600">${k.avgDelay.toFixed(1)}s</text>`

    // vc bar
    const vw = (k.avgVc / maxVc) * barW
    g += `<text x="${barX}" y="${y + 60}" fill="#64748b" font-size="9">v/c</text>`
    g += `<rect x="${barX + 36}" y="${y + 52}" width="${barW}" height="8" rx="2" fill="#e2e8f0"/>`
    g += `<rect x="${barX + 36}" y="${y + 52}" width="${Math.max(2, vw)}" height="8" rx="2" fill="${k.avgVc > 0.9 ? '#ef4444' : '#22c55e'}"/>`
    g += `<text x="${barX + 36 + barW + 6}" y="${y + 60}" fill="#0f172a" font-size="10" font-weight="600">${k.avgVc.toFixed(2)}</text>`

    g += `<text x="${barX}" y="${y + 78}" fill="#94a3b8" font-size="9" font-family="system-ui,sans-serif">C=${k.cycleSec}s${isBase ? '' : ` · Δ延误 ${dDelay >= 0 ? '+' : ''}${dDelay.toFixed(1)}s · Δv/c ${dVc >= 0 ? '+' : ''}${dVc.toFixed(3)}`}</text>`
  })

  g += `<text x="${W - 12}" y="${H - 8}" text-anchor="end" fill="#94a3b8" font-size="8">与评价模型同源</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export function kpisFromCompareRows(
  rows: { channel: string; flow: string; signal: string; avgVc: number; avgDelay: number; los: string }[],
  cycleByLabel?: Record<string, number>,
): SchemeKpi[] {
  return rows.map((r) => {
    const label = `${r.channel}/${r.flow}/${r.signal}`
    return {
      label,
      avgVc: r.avgVc,
      avgDelay: r.avgDelay,
      los: r.los,
      cycleSec: cycleByLabel?.[label] ?? 0,
    }
  })
}

export function recommendBestLabel(kpis: SchemeKpi[]): string | null {
  if (!kpis.length) return null
  const sorted = [...kpis].sort((a, b) => a.avgDelay - b.avgDelay || a.avgVc - b.avgVc)
  return sorted[0].label
}

/** Re-export deltas helper for UI */
export { schemeDeltas }
