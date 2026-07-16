/**
 * Offset scan chart — total bandwidth vs free-node offset.
 * Homology: scanCorridorOffsets / scoreOffsets.
 */
import type { BandCorridor } from '@/domain/types'
import {
  scanCorridorOffsets,
  type OffsetScanResult,
} from '@/domain/analysis/offsetScan'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function offsetScanBoardSvg(
  corridor: BandCorridor,
  opts: { width?: number; height?: number; stepSec?: number; scan?: OffsetScanResult } = {},
): string {
  const scan = opts.scan ?? scanCorridorOffsets(corridor, { stepSec: opts.stepSec ?? 2 })
  const W = opts.width ?? 880
  const H = opts.height ?? 280
  const padL = 48
  const padR = 24
  const padT = 56
  const padB = 36
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const pts = scan.points
  const maxT = Math.max(1, ...pts.map((p) => p.totalSec), scan.best.totalSec)
  const C = scan.C

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="30" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">相位差扫描</text>`
  g += `<text x="24" y="46" fill="#64748b" font-size="11">${esc(scan.freeNodeName)} · 最优 o=${scan.bestDeltaSec.toFixed(0)}s · Σb=${scan.best.totalSec.toFixed(1)}s</text>`

  // axes
  g += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#cbd5e1" />`
  g += `<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#cbd5e1" />`

  const xOf = (o: number) => padL + (o / Math.max(1, C)) * plotW
  const yOf = (t: number) => padT + plotH - (t / maxT) * plotH

  // area path total
  if (pts.length) {
    let d = `M ${xOf(pts[0].deltaSec).toFixed(1)} ${yOf(pts[0].totalSec).toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${xOf(pts[i].deltaSec).toFixed(1)} ${yOf(pts[i].totalSec).toFixed(1)}`
    }
    g += `<path d="${d}" fill="none" stroke="#0284c7" stroke-width="2"/>`
    // forward thinner
    let df = `M ${xOf(pts[0].deltaSec).toFixed(1)} ${yOf(pts[0].forwardSec).toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      df += ` L ${xOf(pts[i].deltaSec).toFixed(1)} ${yOf(pts[i].forwardSec).toFixed(1)}`
    }
    g += `<path d="${df}" fill="none" stroke="#16a34a" stroke-width="1.2" opacity="0.85"/>`
    let db = `M ${xOf(pts[0].deltaSec).toFixed(1)} ${yOf(pts[0].backwardSec).toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      db += ` L ${xOf(pts[i].deltaSec).toFixed(1)} ${yOf(pts[i].backwardSec).toFixed(1)}`
    }
    g += `<path d="${db}" fill="none" stroke="#ea580c" stroke-width="1.2" opacity="0.85"/>`
  }

  // best marker
  const bx = xOf(scan.bestDeltaSec)
  const by = yOf(scan.best.totalSec)
  g += `<circle cx="${bx}" cy="${by}" r="5" fill="#dc2626"/>`
  // current marker
  const cx = xOf(scan.current.deltaSec)
  const cy = yOf(scan.current.totalSec)
  g += `<circle cx="${cx}" cy="${cy}" r="4" fill="#6366f1" stroke="#fff" stroke-width="1"/>`

  g += `<text x="${padL}" y="${H - 14}" fill="#64748b" font-size="10">o (s)</text>`
  g += `<text x="16" y="${padT + 8}" fill="#64748b" font-size="10">Σb</text>`
  g += `<text x="${W - 24}" y="30" text-anchor="end" fill="#94a3b8" font-size="10">蓝Σ · 绿↑ · 橙↓ · 红最优 · 紫当前</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export {
  scanCorridorOffsets,
  applyOffsetScanBest,
  offsetScanMarkdown,
  offsetScanCsv,
} from '@/domain/analysis/offsetScan'
