/**
 * Cycle C sensitivity board — delay & max v/c vs cycle (fixed-cycle y split).
 */
import type { Approach, FlowScheme, SignalScheme } from '@/domain/types'
import {
  scanCycleSensitivity,
  type CycleScanResult,
} from '@/domain/analysis/cycleScan'

export function cycleScanBoardSvg(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  opts: {
    width?: number
    height?: number
    minCycle?: number
    maxCycle?: number
    stepSec?: number
    scan?: CycleScanResult
  } = {},
): string {
  const scan =
    opts.scan ??
    scanCycleSensitivity(approaches, flow, signal, {
      minCycle: opts.minCycle,
      maxCycle: opts.maxCycle,
      stepSec: opts.stepSec,
    })
  const W = opts.width ?? 900
  const H = opts.height ?? 300
  const padL = 52
  const padR = 52
  const padT = 56
  const padB = 36
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const pts = scan.points
  const maxD = Math.max(1, ...pts.map((p) => p.avgDelay), scan.bestDelay.avgDelay)
  const maxV = Math.max(0.5, ...pts.map((p) => p.maxVc), 1.2)
  const minC = scan.minCycle
  const maxC = scan.maxCycle

  const xOf = (c: number) => padL + ((c - minC) / Math.max(1, maxC - minC)) * plotW
  const yD = (d: number) => padT + plotH - (d / maxD) * plotH
  const yV = (v: number) => padT + plotH - (v / maxV) * plotH

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="30" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">周期 C 敏感性</text>`
  g += `<text x="24" y="46" fill="#64748b" font-size="11">最小延误 C=${scan.bestDelay.cycleSec}s · 最小maxVC C=${scan.bestVc.cycleSec}s · 当前 ${scan.currentCycle}s</text>`

  g += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#cbd5e1"/>`
  g += `<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#cbd5e1"/>`

  if (pts.length) {
    let dd = `M ${xOf(pts[0].cycleSec).toFixed(1)} ${yD(pts[0].avgDelay).toFixed(1)}`
    let dv = `M ${xOf(pts[0].cycleSec).toFixed(1)} ${yV(pts[0].maxVc).toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      dd += ` L ${xOf(pts[i].cycleSec).toFixed(1)} ${yD(pts[i].avgDelay).toFixed(1)}`
      dv += ` L ${xOf(pts[i].cycleSec).toFixed(1)} ${yV(pts[i].maxVc).toFixed(1)}`
    }
    g += `<path d="${dd}" fill="none" stroke="#0284c7" stroke-width="2"/>`
    g += `<path d="${dv}" fill="none" stroke="#ea580c" stroke-width="1.5" opacity="0.9"/>`
  }

  // best delay marker
  g += `<circle cx="${xOf(scan.bestDelay.cycleSec)}" cy="${yD(scan.bestDelay.avgDelay)}" r="5" fill="#dc2626"/>`
  // current
  const cc = Math.min(maxC, Math.max(minC, scan.currentCycle))
  g += `<circle cx="${xOf(cc)}" cy="${yD(scan.current.avgDelay)}" r="4" fill="#6366f1" stroke="#fff" stroke-width="1"/>`

  g += `<text x="${padL}" y="${H - 14}" fill="#64748b" font-size="10">C (s)</text>`
  g += `<text x="14" y="${padT + 10}" fill="#0284c7" font-size="10">延误</text>`
  g += `<text x="${W - 48}" y="${padT + 10}" fill="#ea580c" font-size="10">maxVC</text>`
  g += `<text x="${W - 24}" y="30" text-anchor="end" fill="#94a3b8" font-size="10">蓝延误 · 橙maxVC · 红最优延误 · 紫当前</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export {
  scanCycleSensitivity,
  applyCycleScanBest,
  cycleScanMarkdown,
  cycleScanCsv,
} from '@/domain/analysis/cycleScan'
