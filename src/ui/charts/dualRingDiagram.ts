/**
 * Professional dual-ring barrier diagram (NEMA-style schematic).
 * Two concurrent rings with barrier stages; stage width = max(R1,R2) of that barrier.
 * Data from buildDualRingAlignment / phase G·Y·AR — no decorative shrink.
 */
import type { SignalScheme } from '@/domain/types'
import {
  buildDualRingAlignment,
  dualRingSummaryText,
  phaseDuration,
  type DualRingStage,
} from '@/domain/signal/dualRing'
import { CHART_COLORS, escapeXml, fmtNum } from './chartStandards'

function paintPhase(
  x: number,
  y: number,
  wG: number,
  wY: number,
  wAR: number,
  name: string,
  h: number,
): string {
  let s = ''
  s += `<rect x="${x}" y="${y}" width="${Math.max(0, wG)}" height="${h}" fill="#16a34a"/>`
  s += `<rect x="${x + wG}" y="${y}" width="${Math.max(0, wY)}" height="${h}" fill="#ca8a04"/>`
  s += `<rect x="${x + wG + wY}" y="${y}" width="${Math.max(0, wAR)}" height="${h}" fill="#7f1d1d"/>`
  if (wG + wY + wAR > 36) {
    s += `<text x="${x + 4}" y="${y + h * 0.65}" fill="#f8fafc" font-size="9" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(name)}</text>`
  }
  return s
}

function stageBlocks(st: DualRingStage, scale: number, y: number, h: number, which: 'ring1' | 'ring2'): string {
  const list = which === 'ring1' ? st.ring1 : st.ring2
  let x = 0
  let body = ''
  for (const p of list) {
    const g = Math.max(0, p.greenSec) * scale
    const ye = Math.max(0, p.yellowSec) * scale
    const ar = Math.max(0, p.allRedSec) * scale
    body += paintPhase(x, y, g, ye, ar, p.name, h)
    x += g + ye + ar
  }
  // pad remainder of stage to stageSec (idle red)
  const used = list.reduce((s, p) => s + phaseDuration(p), 0) * scale
  const stageW = st.stageSec * scale
  if (stageW > used + 0.5) {
    body += `<rect x="${used}" y="${y}" width="${stageW - used}" height="${h}" fill="#7f1d1d" opacity="0.35"/>`
  }
  return body
}

export function dualRingDiagramSvg(
  signal: SignalScheme,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 520
  const align = buildDualRingAlignment(signal)
  const head = 40
  const foot = 36
  const rowH = 34
  const gap = 10
  const left = 56
  const right = 16
  const height = opts.height ?? head + rowH * 2 + gap + foot + 8

  let g = ''
  g += `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${CHART_COLORS.bg}" stroke="${CHART_COLORS.grid}"/>`
  g += `<text x="14" y="20" fill="${CHART_COLORS.axis}" font-size="12" font-weight="700" font-family="system-ui,sans-serif">双环栏</text>`
  g += `<text x="${width - 14}" y="20" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="10" font-family="system-ui,sans-serif">C=${fmtNum(align.cycleSec, 'int')}s</text>`

  if (!align.enabled || !align.stages.length) {
    g += `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="12" font-family="system-ui,sans-serif">未启用双环</text>`
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">${g}</svg>`
  }

  const C = Math.max(1, align.cycleSec)
  const plotW = width - left - right
  const scale = plotW / C
  const y1 = head + 6
  const y2 = y1 + rowH + gap

  // full cycle background
  g += `<rect x="${left}" y="${y1}" width="${plotW}" height="${rowH}" fill="#7f1d1d" opacity="0.25" rx="3"/>`
  g += `<rect x="${left}" y="${y2}" width="${plotW}" height="${rowH}" fill="#7f1d1d" opacity="0.25" rx="3"/>`

  // stages along time
  let t = 0
  for (const st of align.stages) {
    const x0 = left + t * scale
    const sw = st.stageSec * scale
    // barrier divider
    g += `<line x1="${x0}" y1="${y1 - 4}" x2="${x0}" y2="${y2 + rowH + 4}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3 2"/>`
    g += `<g transform="translate(${x0},0)">`
    g += stageBlocks(st, scale, y1, rowH, 'ring1')
    g += stageBlocks(st, scale, y2, rowH, 'ring2')
    g += `</g>`
    // stage label
    if (sw > 48) {
      g += `<text x="${x0 + sw / 2}" y="${y2 + rowH + 12}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="8" font-family="system-ui,sans-serif">B${st.barrierIndex}</text>`
    }
    t += st.stageSec
  }
  // end barrier
  g += `<line x1="${left + plotW}" y1="${y1 - 4}" x2="${left + plotW}" y2="${y2 + rowH + 4}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3 2"/>`

  g += `<text x="12" y="${y1 + rowH * 0.65}" fill="${CHART_COLORS.axis}" font-size="11" font-weight="700" font-family="system-ui,sans-serif">R1</text>`
  g += `<text x="12" y="${y2 + rowH * 0.65}" fill="${CHART_COLORS.axis}" font-size="11" font-weight="700" font-family="system-ui,sans-serif">R2</text>`

  // ticks
  g += `<text x="${left}" y="${height - 10}" fill="${CHART_COLORS.muted}" font-size="9" font-family="system-ui,sans-serif">0</text>`
  g += `<text x="${left + plotW}" y="${height - 10}" text-anchor="end" fill="${align.closed ? '#34d399' : '#f87171'}" font-size="9" font-family="system-ui,sans-serif">${align.closed ? '闭合' : '未闭合'}</text>`

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">${g}</svg>`
}
