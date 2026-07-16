/**
 * Pedestrian concurrent-walk strip for timing diagram (示意).
 * Uses phase.pedestrian + walk/FDW split inside greenSec.
 */
import type { Approach, SignalScheme } from '@/domain/types'
import { pedCrossingsOf, pedWalkFdw, phaseHasPed } from '@/domain/signal/pedestrian'
import { CHART_COLORS, escapeXml, fmtNum } from './chartStandards'

export function pedestrianPhaseStripSvg(
  signal: SignalScheme,
  approaches: Approach[],
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 520
  const main = signal.phases.filter((p) => !p.isOverlap)
  const rowH = 26
  const head = 36
  const left = 88
  const right = 12
  const foot = 28
  const height = opts.height ?? head + Math.max(1, main.length) * rowH + foot
  const C = Math.max(1, signal.cycleSec)
  const scale = (width - left - right) / C

  let t = 0
  let body = ''
  body += `<text x="12" y="18" fill="${CHART_COLORS.axis}" font-size="12" font-weight="700" font-family="system-ui,sans-serif">行人过街相位条</text>`
  body += `<text x="${width - right}" y="16" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="9">Walk/FDW ∈ G · 与机动车相位并行</text>`

  main.forEach((ph, i) => {
    const y = head + i * rowH
    const g = ph.greenSec
    const ysec = ph.yellowSec
    const ar = ph.allRedSec
    const { walk, fdw } = pedWalkFdw(ph)
    const has = phaseHasPed(ph)
    body += `<text x="${left - 6}" y="${y + 16}" text-anchor="end" fill="${CHART_COLORS.axis}" font-size="10">${escapeXml(ph.name)}</text>`
    // vehicle green background faint
    body += `<rect x="${left + t * scale}" y="${y + 4}" width="${Math.max(0, g * scale)}" height="16" rx="2" fill="#14532d" opacity="0.35"/>`
    if (has && g > 0) {
      const wWalk = Math.min(walk, g) * scale
      const wFdw = Math.min(fdw, Math.max(0, g - walk)) * scale
      body += `<rect x="${left + t * scale}" y="${y + 6}" width="${Math.max(1, wWalk)}" height="12" rx="2" fill="#38bdf8" opacity="0.9"/>`
      body += `<rect x="${left + (t + Math.min(walk, g)) * scale}" y="${y + 6}" width="${Math.max(0, wFdw)}" height="12" rx="2" fill="#f59e0b" opacity="0.9"/>`
      const faces = pedCrossingsOf(ph)
        .map((p) => approaches.find((a) => a.id === p.approachId)?.name.replace('进口', '') ?? '')
        .filter(Boolean)
        .join(',')
      body += `<text x="${left + t * scale + 4}" y="${y + 15}" fill="#0f172a" font-size="9" font-weight="700">${escapeXml(faces || '行人')}</text>`
    } else {
      body += `<text x="${left + t * scale + 4}" y="${y + 15}" fill="${CHART_COLORS.muted}" font-size="9">—</text>`
    }
    // yellow/allred marks
    body += `<rect x="${left + (t + g) * scale}" y="${y + 4}" width="${Math.max(0, ysec * scale)}" height="16" rx="1" fill="${CHART_COLORS.yellow}" opacity="0.5"/>`
    body += `<rect x="${left + (t + g + ysec) * scale}" y="${y + 4}" width="${Math.max(0, ar * scale)}" height="16" rx="1" fill="${CHART_COLORS.red}" opacity="0.35"/>`
    t += g + ysec + ar
  })

  body += `<text x="10" y="${height - 10}" fill="${CHART_COLORS.muted}" font-size="9">蓝=Walk · 琥珀=FDW · 未勾选进口面则无行人条</text>`

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">
  <rect width="100%" height="100%" fill="${CHART_COLORS.bg}"/>
  ${body}
</svg>`
}
