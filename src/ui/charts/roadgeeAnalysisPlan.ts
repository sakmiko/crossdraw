/**
 * RoadGee-style analysis plan diagrams on intersection outline.
 * Modes: LOS | delay | queue | saturation (v/c).
 * Center circle + approach movement boxes; color by metric; NO watermark.
 * Data from AnalysisResult.lanes — live recompute when flow/signal changes.
 */
import type { AnalysisLaneResult, AnalysisResult, Approach } from '@/domain/types'
import { LOS_COLORS, escapeXml, fmtNum } from './chartStandards'

export type AnalysisPlanMetric = 'los' | 'delay' | 'queue' | 'vc'

export type AnalysisPlanOpts = {
  size?: number
  metric?: AnalysisPlanMetric
}

function polar(cx: number, cy: number, r: number, bearingDeg: number) {
  const rad = ((bearingDeg - 90) * Math.PI) / 180
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r, rad }
}

function losColor(los: string): string {
  return LOS_COLORS[los] ?? '#ef4444'
}

function delayColor(d: number): string {
  if (d <= 10) return LOS_COLORS.A
  if (d <= 20) return LOS_COLORS.B
  if (d <= 35) return LOS_COLORS.C
  if (d <= 55) return LOS_COLORS.D
  if (d <= 80) return LOS_COLORS.E
  return LOS_COLORS.F
}

function queueColor(q: number): string {
  if (q <= 20) return LOS_COLORS.A
  if (q <= 40) return LOS_COLORS.B
  if (q <= 70) return LOS_COLORS.C
  if (q <= 100) return LOS_COLORS.D
  if (q <= 140) return LOS_COLORS.E
  return LOS_COLORS.F
}

function vcColor(vc: number): string {
  if (vc <= 0.6) return LOS_COLORS.A
  if (vc <= 0.75) return LOS_COLORS.B
  if (vc <= 0.85) return LOS_COLORS.C
  if (vc <= 0.95) return LOS_COLORS.D
  if (vc <= 1.0) return LOS_COLORS.E
  return LOS_COLORS.F
}

function laneMetric(l: AnalysisLaneResult, metric: AnalysisPlanMetric): { text: string; color: string } {
  switch (metric) {
    case 'delay':
      return { text: fmtNum(l.delaySec, 'delay'), color: delayColor(l.delaySec) }
    case 'queue':
      return { text: fmtNum(l.queueM, 'm'), color: queueColor(l.queueM) }
    case 'vc':
      return { text: fmtNum(l.vc, 'vc'), color: vcColor(l.vc) }
    case 'los':
    default: {
      // derive LOS from delay for box color (matches analysis thresholds)
      const los =
        l.delaySec <= 10
          ? 'A'
          : l.delaySec <= 20
            ? 'B'
            : l.delaySec <= 35
              ? 'C'
              : l.delaySec <= 55
                ? 'D'
                : l.delaySec <= 80
                  ? 'E'
                  : 'F'
      return { text: los, color: losColor(los) }
    }
  }
}

function centerMetric(analysis: AnalysisResult, metric: AnalysisPlanMetric): { text: string; color: string } {
  switch (metric) {
    case 'delay':
      return { text: fmtNum(analysis.avgDelay, 'delay'), color: delayColor(analysis.avgDelay) }
    case 'queue':
      return { text: fmtNum(analysis.avgQueueM, 'm'), color: queueColor(analysis.avgQueueM) }
    case 'vc':
      return { text: fmtNum(analysis.avgVc, 'vc'), color: vcColor(analysis.avgVc) }
    case 'los':
    default:
      return { text: analysis.losFinal, color: losColor(analysis.losFinal) }
  }
}

const METRIC_TITLE: Record<AnalysisPlanMetric, string> = {
  los: '服务水平',
  delay: '延误时间',
  queue: '排队长度',
  vc: '饱和度',
}

const METRIC_UNIT: Record<AnalysisPlanMetric, string> = {
  los: 'LOS · 延误分级',
  delay: '单位 s/pcu',
  queue: '单位 m',
  vc: 'v/c',
}

/**
 * Plan-view analysis diagram (RoadGee 饱和度/延误/排队/服务水平 style).
 */
export function roadgeeAnalysisPlanSvg(
  approaches: Approach[],
  analysis: AnalysisResult,
  opts: AnalysisPlanOpts = {},
): string {
  const size = opts.size ?? 520
  const metric = opts.metric ?? 'los'
  const cx = size / 2
  const cy = size / 2 - 4
  const arm = size * 0.34
  const core = size * 0.11

  let g = ''
  g += `<rect width="${size}" height="${size}" fill="#ffffff"/>`
  g += `<text x="14" y="22" fill="#0f172a" font-size="13" font-weight="700" font-family="system-ui,sans-serif">${METRIC_TITLE[metric]}</text>`
  g += `<text x="14" y="38" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">${METRIC_UNIT[metric]} · 与分析表同源</text>`

  // cross outline (dashed cyan like RoadGee)
  for (const ap of approaches) {
    const o = polar(cx, cy, arm + 8, ap.bearingDeg)
    const i = polar(cx, cy, core, ap.bearingDeg)
    g += `<line x1="${o.x}" y1="${o.y}" x2="${i.x}" y2="${i.y}" stroke="#67e8f9" stroke-width="22" stroke-linecap="round" opacity="0.35"/>`
    g += `<line x1="${o.x}" y1="${o.y}" x2="${i.x}" y2="${i.y}" stroke="#0e7490" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7"/>`
  }
  g += `<circle cx="${cx}" cy="${cy}" r="${core}" fill="#f8fafc" stroke="#0e7490" stroke-width="1.5" stroke-dasharray="4 3"/>`

  // per-approach movement boxes from analysis.lanes
  for (const ap of approaches) {
    const lanes = analysis.lanes.filter((l) => l.approachId === ap.id)
    const byMov = (m: string) => lanes.find((l) => l.movement === m)
    const movs: Array<'L' | 'T' | 'R'> = ['L', 'T', 'R']
    const present = movs.filter((m) => byMov(m))
    if (!present.length && lanes.length) {
      // fallback: show first two lanes
      present.push(...(lanes.slice(0, 2).map((l) => l.movement as 'L' | 'T' | 'R')))
    }
    const base = polar(cx, cy, arm * 0.72, ap.bearingDeg)
    const nameP = polar(cx, cy, arm * 1.12, ap.bearingDeg)
    g += `<text x="${nameP.x}" y="${nameP.y}" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(ap.name.replace('进口', '方向') || ap.name)}</text>`

    present.slice(0, 2).forEach((m, mi) => {
      const lane = byMov(m) ?? lanes[mi]
      if (!lane) return
      const { text, color } = laneMetric(lane, metric)
      const side = mi === 0 ? -1 : 1
      const ox = -Math.sin(base.rad) * side * 28
      const oy = Math.cos(base.rad) * side * 28
      const bx = base.x + ox - 22
      const by = base.y + oy - 16
      g += `<rect x="${bx}" y="${by}" width="44" height="32" rx="5" fill="${color}" stroke="#0f172a" stroke-width="0.6"/>`
      // movement arrow glyph
      const arrow =
        m === 'L' ? '↰' : m === 'R' ? '↱' : '↑'
      g += `<text x="${bx + 22}" y="${by + 13}" text-anchor="middle" fill="#fff" font-size="11" font-family="system-ui,sans-serif">${arrow}</text>`
      g += `<text x="${bx + 22}" y="${by + 27}" text-anchor="middle" fill="#fff" font-size="11" font-weight="800" font-family="system-ui,sans-serif">${escapeXml(text)}</text>`
    })
  }

  // center aggregate
  const cm = centerMetric(analysis, metric)
  g += `<circle cx="${cx}" cy="${cy}" r="${core * 0.72}" fill="${cm.color}" stroke="#0f172a" stroke-width="1"/>`
  g += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#fff" font-size="${metric === 'los' ? 22 : 14}" font-weight="800" font-family="system-ui,sans-serif">${escapeXml(cm.text)}</text>`

  // A–F legend
  const levels = ['A', 'B', 'C', 'D', 'E', 'F'] as const
  levels.forEach((lv, i) => {
    const x = 16 + i * 42
    const y = size - 28
    g += `<rect x="${x}" y="${y}" width="36" height="14" rx="2" fill="${losColor(lv)}"/>`
    g += `<text x="${x + 18}" y="${y + 11}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">${lv}</text>`
  })

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro chart-svg--roadgee-plan">${g}</svg>`
}

export function analysisPlanExportFilename(metric: AnalysisPlanMetric): string {
  return `crossdraw-${METRIC_TITLE[metric]}.svg`
}
