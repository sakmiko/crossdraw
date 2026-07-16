/**
 * Speed sensitivity chart — Σb vs design speed (offsets fixed).
 */
import type { BandCorridor } from '@/domain/types'
import {
  scanCorridorSpeeds,
  type SpeedScanResult,
} from '@/domain/analysis/speedScan'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function speedScanBoardSvg(
  corridor: BandCorridor,
  opts: {
    width?: number
    height?: number
    minKmh?: number
    maxKmh?: number
    stepKmh?: number
    scan?: SpeedScanResult
  } = {},
): string {
  const scan =
    opts.scan ??
    scanCorridorSpeeds(corridor, {
      minKmh: opts.minKmh,
      maxKmh: opts.maxKmh,
      stepKmh: opts.stepKmh,
    })
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
  const minS = scan.minKmh
  const maxS = scan.maxKmh

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="30" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">速度敏感性</text>`
  g += `<text x="24" y="46" fill="#64748b" font-size="11">最优 v=${scan.best.speedKmh} km/h · Σb=${scan.best.totalSec.toFixed(1)}s · 当前 ${scan.currentSpeedKmh}</text>`

  g += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#cbd5e1"/>`
  g += `<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#cbd5e1"/>`

  const xOf = (s: number) => padL + ((s - minS) / Math.max(1, maxS - minS)) * plotW
  const yOf = (t: number) => padT + plotH - (t / maxT) * plotH

  if (pts.length) {
    let d = `M ${xOf(pts[0].speedKmh).toFixed(1)} ${yOf(pts[0].totalSec).toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${xOf(pts[i].speedKmh).toFixed(1)} ${yOf(pts[i].totalSec).toFixed(1)}`
    }
    g += `<path d="${d}" fill="none" stroke="#0284c7" stroke-width="2"/>`
    let df = `M ${xOf(pts[0].speedKmh).toFixed(1)} ${yOf(pts[0].forwardSec).toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      df += ` L ${xOf(pts[i].speedKmh).toFixed(1)} ${yOf(pts[i].forwardSec).toFixed(1)}`
    }
    g += `<path d="${df}" fill="none" stroke="#16a34a" stroke-width="1.2" opacity="0.85"/>`
    let db = `M ${xOf(pts[0].speedKmh).toFixed(1)} ${yOf(pts[0].backwardSec).toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      db += ` L ${xOf(pts[i].speedKmh).toFixed(1)} ${yOf(pts[i].backwardSec).toFixed(1)}`
    }
    g += `<path d="${db}" fill="none" stroke="#ea580c" stroke-width="1.2" opacity="0.85"/>`
  }

  const bx = xOf(scan.best.speedKmh)
  const by = yOf(scan.best.totalSec)
  g += `<circle cx="${bx}" cy="${by}" r="5" fill="#dc2626"/>`
  const cx = xOf(Math.min(maxS, Math.max(minS, scan.currentSpeedKmh)))
  const cy = yOf(scan.current.totalSec)
  g += `<circle cx="${cx}" cy="${cy}" r="4" fill="#6366f1" stroke="#fff" stroke-width="1"/>`

  g += `<text x="${padL}" y="${H - 14}" fill="#64748b" font-size="10">v (km/h)</text>`
  g += `<text x="16" y="${padT + 8}" fill="#64748b" font-size="10">Σb</text>`
  g += `<text x="${W - 24}" y="30" text-anchor="end" fill="#94a3b8" font-size="10">蓝Σ · 绿↑ · 橙↓ · 红最优 · 紫当前</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export {
  scanCorridorSpeeds,
  applySpeedScanBest,
  speedScanMarkdown,
  speedScanCsv,
} from '@/domain/analysis/speedScan'
