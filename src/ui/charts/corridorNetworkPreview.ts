/**
 * High-resolution corridor / arterial network preview (chainage layout).
 * Textbook-style: dual carriageway ribbon, nodes as mini crosses, segment
 * labels (L, t, o), green-wave chevrons. No basemap / no lat-lon UI.
 * Data: BandCorridor + BandResult only.
 */
import type { BandCorridor, BandResult } from '@/domain/types'
import { escapeXml } from './chartStandards'

export function corridorNetworkPreviewSvg(
  corridor: BandCorridor,
  result?: Pick<BandResult, 'bandwidthRatio' | 'forwardBandwidthSec' | 'backwardBandwidthSec' | 'bandwidthSec' | 'standardSpeedKmh' | 'method' | 'offsets'>,
  opts: { width?: number; height?: number } = {},
): string {
  const W = opts.width ?? 1200
  const H = opts.height ?? 420
  const padL = 56
  const padR = 40
  const padT = 52
  const padB = 48
  const nodes = [...corridor.nodes].sort((a, b) => a.distanceM - b.distanceM)
  if (!nodes.length) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="24" y="40" fill="#64748b">无走廊节点</text></svg>`
  }
  const maxD = Math.max(1, nodes[nodes.length - 1].distanceM)
  const plotW = W - padL - padR
  const midY = padT + (H - padT - padB) * 0.55
  const roadHalf = 14
  const v = corridor.speedKmh
  const vMps = (v * 1000) / 3600

  const xOf = (d: number) => padL + (d / maxD) * plotW
  const offMap = new Map((result?.offsets ?? []).map((o) => [o.id, o.offsetSec]))
  const C = nodes[0]?.cycleSec || 90

  let g = ''
  g += `<defs>
    <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <marker id="arrF" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#16a34a"/>
    </marker>
    <marker id="arrB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#2563eb"/>
    </marker>
  </defs>`
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="none" stroke="#e2e8f0"/>`
  g += `<text x="20" y="28" fill="#0f172a" font-size="15" font-weight="700" font-family="system-ui,sans-serif">干道路网预览 · ${escapeXml(corridor.name)}</text>`
  const br =
    result?.bandwidthRatio != null ? `带宽比 ${(result.bandwidthRatio * 100).toFixed(1)}%` : ''
  const bf = result?.forwardBandwidthSec ?? result?.bandwidthSec
  const bb = result?.backwardBandwidthSec
  g += `<text x="${W - 20}" y="28" text-anchor="end" fill="#64748b" font-size="11" font-family="system-ui,sans-serif">${escapeXml(result?.method ?? corridor.method)} · V=${v} km/h · C≈${C}s ${br}</text>`
  if (bf != null) {
    g += `<text x="${W - 20}" y="44" text-anchor="end" fill="#16a34a" font-size="10">b↑ ${bf.toFixed(1)}s${bb != null ? ` · b↓ ${bb.toFixed(1)}s` : ''}</text>`
  }

  // chainage axis
  g += `<line x1="${padL}" y1="${H - padB + 8}" x2="${padL + plotW}" y2="${H - padB + 8}" stroke="#94a3b8" stroke-width="1"/>`
  for (let i = 0; i <= 8; i++) {
    const d = (maxD * i) / 8
    const x = xOf(d)
    g += `<line x1="${x}" y1="${H - padB + 4}" x2="${x}" y2="${H - padB + 12}" stroke="#94a3b8"/>`
    g += `<text x="${x}" y="${H - padB + 26}" text-anchor="middle" fill="#64748b" font-size="9">${Math.round(d)}m</text>`
  }
  g += `<text x="${padL + plotW / 2}" y="${H - 8}" text-anchor="middle" fill="#94a3b8" font-size="10">桩号（链式距离）</text>`

  // road ribbon
  const x0 = xOf(nodes[0].distanceM)
  const x1 = xOf(nodes[nodes.length - 1].distanceM)
  g += `<rect x="${x0 - 4}" y="${midY - roadHalf}" width="${x1 - x0 + 8}" height="${roadHalf * 2}" rx="6" fill="url(#rd)" stroke="#1e293b" stroke-width="1"/>`
  // center dashed
  g += `<line x1="${x0}" y1="${midY}" x2="${x1}" y2="${midY}" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="10 8"/>`
  // edge lines
  g += `<line x1="${x0}" y1="${midY - roadHalf + 2}" x2="${x1}" y2="${midY - roadHalf + 2}" stroke="#e2e8f0" stroke-width="1.2"/>`
  g += `<line x1="${x0}" y1="${midY + roadHalf - 2}" x2="${x1}" y2="${midY + roadHalf - 2}" stroke="#e2e8f0" stroke-width="1.2"/>`

  // green wave chevrons (forward above, backward below) — schematic travel slope
  if (nodes.length >= 2 && vMps > 0.1) {
    const travel = (nodes[nodes.length - 1].distanceM - nodes[0].distanceM) / vMps
    // forward band strip
    g += `<path d="M${x0} ${midY - roadHalf - 10} L${x1} ${midY - roadHalf - 10}" stroke="#16a34a" stroke-width="3" opacity="0.35" marker-end="url(#arrF)"/>`
    g += `<text x="${(x0 + x1) / 2}" y="${midY - roadHalf - 16}" text-anchor="middle" fill="#16a34a" font-size="10" font-weight="600">上行协调 · t≈${travel.toFixed(0)}s</text>`
    g += `<path d="M${x1} ${midY + roadHalf + 10} L${x0} ${midY + roadHalf + 10}" stroke="#2563eb" stroke-width="3" opacity="0.35" marker-end="url(#arrB)"/>`
    g += `<text x="${(x0 + x1) / 2}" y="${midY + roadHalf + 24}" text-anchor="middle" fill="#2563eb" font-size="10" font-weight="600">下行协调</text>`
  }

  // segments labels
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1]
    const b = nodes[i]
    const xa = xOf(a.distanceM)
    const xb = xOf(b.distanceM)
    const mx = (xa + xb) / 2
    const len = b.distanceM - a.distanceM
    const tSec = vMps > 0 ? len / vMps : 0
    const oa = offMap.get(a.id) ?? a.offsetSec
    const ob = offMap.get(b.id) ?? b.offsetSec
    let dO = ob - oa
    // normalize to (-C/2, C/2]
    while (dO > C / 2) dO -= C
    while (dO <= -C / 2) dO += C
    g += `<text x="${mx}" y="${midY - roadHalf - 28}" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="600">${Math.round(len)} m</text>`
    g += `<text x="${mx}" y="${midY + roadHalf + 40}" text-anchor="middle" fill="#64748b" font-size="9">t=${tSec.toFixed(1)}s · Δo=${dO >= 0 ? '+' : ''}${dO.toFixed(1)}s</text>`
  }

  // nodes as mini cross intersections
  nodes.forEach((n, i) => {
    const x = xOf(n.distanceM)
    const o = offMap.get(n.id) ?? n.offsetSec
    const active = i === 0
    // cross arms
    const arm = 18
    g += `<rect x="${x - 5}" y="${midY - arm}" width="10" height="${arm * 2}" fill="#1e293b" stroke="#e2e8f0" stroke-width="1"/>`
    g += `<rect x="${x - arm}" y="${midY - 5}" width="${arm * 2}" height="10" fill="#1e293b" stroke="#e2e8f0" stroke-width="1"/>`
    g += `<circle cx="${x}" cy="${midY}" r="8" fill="${active ? '#0ea5e9' : '#0f172a'}" stroke="#fff" stroke-width="2"/>`
    g += `<text x="${x}" y="${midY + 4}" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">${i + 1}</text>`
    // name + params
    const labelY = i % 2 === 0 ? midY - arm - 36 : midY + arm + 56
    g += `<rect x="${x - 52}" y="${labelY - 22}" width="104" height="36" rx="6" fill="#fff" stroke="${n.lockedOffset ? '#dc2626' : '#cbd5e1'}" stroke-width="${n.lockedOffset ? 1.5 : 1}"/>`
    g += `<text x="${x}" y="${labelY - 8}" text-anchor="middle" fill="#0f172a" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(n.name)}</text>`
    g += `<text x="${x}" y="${labelY + 6}" text-anchor="middle" fill="#64748b" font-size="9">λ=${n.greenRatio.toFixed(2)} · o=${o.toFixed(1)}s${n.lockedOffset ? ' 锁' : ''}</text>`
  })

  g += `<text x="20" y="${H - 10}" fill="#94a3b8" font-size="9">链式路网示意 · 非 GIS 底图 · 与走廊参数/优化结果同源</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}
