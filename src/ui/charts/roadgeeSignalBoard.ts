/**
 * RoadGee-style signal phase faces + multi-phase timing strip.
 * Light canvas, no watermark. Data from SignalScheme phases/releases/G/Y/AR/C.
 */
import type { Approach, Phase, SignalScheme } from '@/domain/types'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'
import { escapeXml, fmtNum } from './chartStandards'

function polar(cx: number, cy: number, r: number, bearingDeg: number) {
  const rad = ((bearingDeg - 90) * Math.PI) / 180
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r, rad, cos: Math.cos(rad), sin: Math.sin(rad) }
}

/** One gray cross face with green movement arrows for releases in this phase. */
export function roadgeePhaseFaceSvg(
  approaches: Approach[],
  phase: Phase,
  opts: { size?: number; roadWidth?: number } = {},
): string {
  const size = opts.size ?? 120
  const roadW = opts.roadWidth ?? Math.max(14, size * 0.16)
  const cx = size / 2
  const cy = size / 2 + 4
  const arm = size * 0.42
  let g = ''
  g += `<rect width="${size}" height="${size}" fill="#ffffff"/>`
  // cross roads
  for (const ap of approaches) {
    const o = polar(cx, cy, arm, ap.bearingDeg)
    g += `<line x1="${cx}" y1="${cy}" x2="${o.x}" y2="${o.y}" stroke="#94a3b8" stroke-width="${roadW}" stroke-linecap="round"/>`
  }
  g += `<circle cx="${cx}" cy="${cy}" r="${roadW * 0.35}" fill="#cbd5e1"/>`
  // green movements
  for (const ap of approaches) {
    const movs = phase.releases[ap.id] ?? []
    if (!movs.length) continue
    const entry = polar(cx, cy, arm * 0.78, ap.bearingDeg)
    const near = polar(cx, cy, arm * 0.22, ap.bearingDeg)
    for (const m of movs) {
      if (m === 'T') {
        // through toward opposite
        const opp = approaches.find(
          (a) => Math.abs((((a.bearingDeg - ap.bearingDeg) % 360) + 360) % 360 - 180) < 40,
        )
        const out = opp
          ? polar(cx, cy, arm * 0.72, opp.bearingDeg)
          : polar(cx, cy, arm * 0.15, ap.bearingDeg + 180)
        g += arrowPath(entry.x, entry.y, out.x, out.y, '#16a34a', 3.2)
      } else if (m === 'L') {
        const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
        const i = sorted.findIndex((a) => a.id === ap.id)
        const left = sorted[(i - 1 + sorted.length) % sorted.length]
        const out = polar(cx, cy, arm * 0.65, left.bearingDeg)
        const ctrl = polar(cx, cy, arm * 0.15, (ap.bearingDeg + left.bearingDeg) / 2)
        g += `<path d="M ${entry.x} ${entry.y} Q ${ctrl.x} ${ctrl.y} ${out.x} ${out.y}" fill="none" stroke="#16a34a" stroke-width="3.2" stroke-linecap="round"/>`
        g += arrowHead(out.x, out.y, Math.atan2(out.y - ctrl.y, out.x - ctrl.x), 7, '#16a34a')
      } else if (m === 'R') {
        const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
        const i = sorted.findIndex((a) => a.id === ap.id)
        const right = sorted[(i + 1) % sorted.length]
        const out = polar(cx, cy, arm * 0.65, right.bearingDeg)
        const ctrl = polar(cx, cy, arm * 0.15, (ap.bearingDeg + right.bearingDeg) / 2)
        g += `<path d="M ${entry.x} ${entry.y} Q ${ctrl.x} ${ctrl.y} ${out.x} ${out.y}" fill="none" stroke="#16a34a" stroke-width="3.2" stroke-linecap="round"/>`
        g += arrowHead(out.x, out.y, Math.atan2(out.y - ctrl.y, out.x - ctrl.x), 7, '#16a34a')
      }
    }
    void near
  }
  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--phase-face">${g}</svg>`
}

function arrowHead(x: number, y: number, angle: number, size: number, fill: string): string {
  const x1 = x + Math.cos(angle + 2.6) * size
  const y1 = y + Math.sin(angle + 2.6) * size
  const x2 = x + Math.cos(angle - 2.6) * size
  const y2 = y + Math.sin(angle - 2.6) * size
  return `<polygon points="${x},${y} ${x1},${y1} ${x2},${y2}" fill="${fill}"/>`
}

function arrowPath(x1: number, y1: number, x2: number, y2: number, color: string, w: number): string {
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const len = Math.hypot(x2 - x1, y2 - y1) || 1
  const bx = x2 - Math.cos(ang) * Math.min(10, len * 0.15)
  const by = y2 - Math.sin(ang) * Math.min(10, len * 0.15)
  return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>${arrowHead(x2, y2, ang, 7, color)}`
}

/**
 * Multi-phase strip: face icons on top + G/Y/R bars on C axis (RoadGee signal page).
 */
export function roadgeeSignalBoardSvg(
  approaches: Approach[],
  signal: SignalScheme,
  opts: { width?: number; faceSize?: number } = {},
): string {
  const al = buildSignalTimingAlignment(signal)
  const main = signal.phases.filter((p) => !p.isOverlap)
  const C = al.cycleSec
  const faceSize = opts.faceSize ?? 100
  const n = Math.max(1, main.length)
  const width = opts.width ?? Math.max(520, n * (faceSize + 24) + 40)
  const faceRowH = faceSize + 36
  const barRowH = 28
  const head = 36
  const left = 88
  const padR = 16
  const barAreaH = n * barRowH + 40
  const height = head + faceRowH + barAreaH + 24
  const scale = (width - left - padR) / Math.max(1, C)

  let g = ''
  g += `<rect width="${width}" height="${height}" fill="#ffffff"/>`
  g += `<text x="14" y="22" fill="#0f172a" font-size="13" font-weight="700" font-family="system-ui,sans-serif">有信号控制 · 相位灯态</text>`
  g += `<text x="${width - 14}" y="22" text-anchor="end" fill="#64748b" font-size="11" font-family="system-ui,sans-serif">C=${fmtNum(C, 'int')}s · ${al.closed ? '闭合' : '未闭合'}</text>`

  // phase faces row
  main.forEach((ph, i) => {
    const x = 20 + i * (faceSize + 24)
    const y = head
    const face = roadgeePhaseFaceSvg(approaches, ph, { size: faceSize })
    // embed face paths without outer svg - re-generate inline simpler: use foreignObject-less: image as group via nested
    // Use image href data - avoid; draw mini face again inline by calling logic simplified
    g += `<g transform="translate(${x},${y})">`
    g += face
      .replace(/<\/?svg[^>]*>/g, '')
      .replace(/class="[^"]*"/g, '')
    g += `</g>`
    const dur = ph.greenSec + ph.yellowSec + ph.allRedSec
    g += `<text x="${x + faceSize / 2}" y="${y + faceSize + 16}" text-anchor="middle" fill="#0f172a" font-size="11" font-weight="600" font-family="system-ui,sans-serif">第${i + 1}相位: ${fmtNum(ph.greenSec, 'int')} 秒</text>`
    g += `<text x="${x + faceSize / 2}" y="${y + faceSize + 30}" text-anchor="middle" fill="#64748b" font-size="9" font-family="system-ui,sans-serif">${escapeXml(ph.name.slice(0, 10))} · ${fmtNum(dur, 'int')}s</text>`
  })

  // timing bars
  const barTop = head + faceRowH + 8
  // axis
  g += `<line x1="${left}" y1="${barTop}" x2="${width - padR}" y2="${barTop}" stroke="#cbd5e1"/>`
  for (let t = 0; t <= C + 0.01; t += C <= 60 ? 10 : 20) {
    const x = left + t * scale
    g += `<line x1="${x}" y1="${barTop - 4}" x2="${x}" y2="${barTop + 4}" stroke="#94a3b8"/>`
    g += `<text x="${x}" y="${barTop - 8}" text-anchor="middle" fill="#64748b" font-size="9">${fmtNum(t, 'int')}</text>`
  }

  let cursor = 0
  main.forEach((ph, i) => {
    const y = barTop + 16 + i * barRowH
    const lambda = C > 0 ? ph.greenSec / C : 0
    g += `<text x="10" y="${y + 14}" fill="#334155" font-size="10" font-family="system-ui,sans-serif">第${i + 1}相位 λ:${lambda.toFixed(2)}</text>`
    // red rest
    g += `<rect x="${left}" y="${y + 4}" width="${C * scale}" height="16" fill="#fecaca" opacity="0.5"/>`
    const x0 = left + cursor * scale
    const gW = ph.greenSec * scale
    const yW = ph.yellowSec * scale
    g += `<rect x="${x0}" y="${y + 4}" width="${Math.max(1, gW)}" height="16" fill="#22c55e" rx="2"/>`
    if (gW > 14) {
      g += `<text x="${x0 + gW / 2}" y="${y + 16}" text-anchor="middle" fill="#052e16" font-size="10" font-weight="700">${fmtNum(ph.greenSec, 'int')}</text>`
    }
    g += `<rect x="${x0 + gW}" y="${y + 4}" width="${Math.max(0.5, yW)}" height="16" fill="#eab308" rx="1"/>`
    if (yW > 10) {
      g += `<text x="${x0 + gW + yW / 2}" y="${y + 16}" text-anchor="middle" fill="#422006" font-size="9" font-weight="700">${fmtNum(ph.yellowSec, 'int')}</text>`
    }
    const arW = ph.allRedSec * scale
    if (arW > 0.5) {
      g += `<rect x="${x0 + gW + yW}" y="${y + 4}" width="${arW}" height="16" fill="#7f1d1d" rx="1"/>`
    }
    cursor += ph.greenSec + ph.yellowSec + ph.allRedSec
  })

  g += `<text x="14" y="${height - 8}" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">绿=G · 黄=Y · 底红=周期剩余 · 无水印 · 与相位表同源</text>`

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro chart-svg--roadgee-signal">${g}</svg>`
}

/** Compact Y / auto-timing summary line for UI. */
export function signalYSummaryText(Y: number, cycleSec: number, targetVc: number): string {
  return `Y=${Y.toFixed(3)} · C=${cycleSec}s · 目标v/c=${targetVc}`
}
