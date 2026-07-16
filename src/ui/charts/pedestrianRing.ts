/**
 * Professional pedestrian ring / face diagram.
 * Shows concurrent Walk/FDW faces on approach stop-lines for a focus phase
 * (or all phases if focus is null). Engineering schematic — not trajectory sim.
 */
import type { Approach, Phase, SignalScheme } from '@/domain/types'
import {
  inferPhaseKind,
  pedCrossingsOf,
  pedWalkFdw,
  phaseHasPed,
} from '@/domain/signal/pedestrian'
import { CHART_COLORS, escapeXml, fmtNum } from './chartStandards'

function dirFromBearing(bearingDeg: number): [number, number] {
  const r = (bearingDeg * Math.PI) / 180
  return [Math.sin(r), -Math.cos(r)]
}

function esc(s: string): string {
  return escapeXml(s)
}

export type PedRingOptions = {
  width?: number
  height?: number
  /** highlight this phase; null = show union of all ped faces */
  focusPhaseId?: string | null
  title?: string
}

/**
 * Polar layout: approaches around a ring; active ped faces get Walk/FDW chips.
 */
export function pedestrianRingSvg(
  approaches: Approach[],
  signal: SignalScheme,
  opts: PedRingOptions = {},
): string {
  const width = opts.width ?? 420
  const height = opts.height ?? 320
  const cx = width / 2
  const cy = height / 2 + 6
  const R = Math.min(width, height) * 0.28
  const focus =
    opts.focusPhaseId != null
      ? signal.phases.find((p) => p.id === opts.focusPhaseId) ?? null
      : null

  // collect faces: approachId -> { exclusive, phases[] }
  type Face = { exclusive: boolean; phases: string[]; walk: number; fdw: number }
  const faces = new Map<string, Face>()

  const phases: Phase[] = focus ? [focus] : signal.phases.filter((p) => !p.isOverlap)
  for (const ph of phases) {
    if (!phaseHasPed(ph)) continue
    const { walk, fdw } = pedWalkFdw(ph)
    for (const ped of pedCrossingsOf(ph)) {
      const cur = faces.get(ped.approachId) ?? {
        exclusive: !!ped.exclusive,
        phases: [],
        walk: 0,
        fdw: 0,
      }
      cur.exclusive = cur.exclusive || !!ped.exclusive
      cur.phases.push(ph.name)
      cur.walk = Math.max(cur.walk, walk)
      cur.fdw = Math.max(cur.fdw, fdw)
      faces.set(ped.approachId, cur)
    }
  }

  let g = ''
  g += `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${CHART_COLORS.bg}" stroke="${CHART_COLORS.grid}"/>`
  const title = opts.title ?? (focus ? `行人过街环图 · ${focus.name}` : '行人过街环图 · 全相位并集')
  g += `<text x="14" y="20" fill="${CHART_COLORS.axis}" font-size="12" font-weight="700" font-family="system-ui,sans-serif">${esc(title)}</text>`
  g += `<text x="14" y="34" fill="${CHART_COLORS.muted}" font-size="9.5" font-family="system-ui,sans-serif">斑马线面 = 进口停车线 · 蓝 Walk / 琥珀 FDW · 红框=独占 · 非轨迹仿真</text>`

  // outer ring guide
  g += `<circle cx="${cx}" cy="${cy}" r="${R + 28}" fill="none" stroke="${CHART_COLORS.grid}" stroke-width="1" stroke-dasharray="4 4"/>`
  g += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(15,23,42,0.55)" stroke="${CHART_COLORS.axis}" stroke-width="1.2"/>`
  g += `<circle cx="${cx}" cy="${cy}" r="${R * 0.35}" fill="rgba(30,41,59,0.9)" stroke="${CHART_COLORS.grid}"/>`
  g += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="10" font-family="system-ui,sans-serif">C=${fmtNum(signal.cycleSec, 'int')}s</text>`

  approaches.forEach((ap) => {
    const [dx, dy] = dirFromBearing(ap.bearingDeg)
    // stop-line face slightly outside ring
    const fx = cx + dx * (R + 18)
    const fy = cy + dy * (R + 18)
    const face = faces.get(ap.id)
    const active = !!face

    // approach arm stub
    const ix = cx + dx * (R - 4)
    const iy = cy + dy * (R - 4)
    g += `<line x1="${ix}" y1="${iy}" x2="${cx + dx * (R + 42)}" y2="${cy + dy * (R + 42)}" stroke="${active ? '#38bdf8' : CHART_COLORS.grid}" stroke-width="${active ? 2.4 : 1.2}" stroke-linecap="round"/>`

    // crosswalk bar (perpendicular)
    const px = -dy
    const py = dx
    const half = 16
    const x1 = fx + px * half
    const y1 = fy + py * half
    const x2 = fx - px * half
    const y2 = fy - py * half
    if (active) {
      // zebra stripes
      for (let k = -3; k <= 3; k++) {
        const sx = fx + px * (k * 4)
        const sy = fy + py * (k * 4)
        const ox = dx * 5
        const oy = dy * 5
        g += `<line x1="${sx - ox}" y1="${sy - oy}" x2="${sx + ox}" y2="${sy + oy}" stroke="#f8fafc" stroke-width="2.2" opacity="0.95"/>`
      }
      // exclusive frame
      if (face!.exclusive) {
        g += `<rect x="${Math.min(x1, x2) - 8}" y="${Math.min(y1, y2) - 8}" width="${Math.abs(x2 - x1) + 16}" height="${Math.abs(y2 - y1) + 16}" fill="none" stroke="#f87171" stroke-width="1.6" rx="4"/>`
      }
      // walk / fdw chips
      const chipX = cx + dx * (R + 52)
      const chipY = cy + dy * (R + 52)
      g += `<rect x="${chipX - 28}" y="${chipY - 18}" width="56" height="14" rx="3" fill="#38bdf8"/>`
      g += `<text x="${chipX}" y="${chipY - 8}" text-anchor="middle" fill="#0f172a" font-size="8" font-weight="700" font-family="system-ui,sans-serif">W ${fmtNum(face!.walk, 'int')}s</text>`
      g += `<rect x="${chipX - 28}" y="${chipY - 2}" width="56" height="14" rx="3" fill="#f59e0b"/>`
      g += `<text x="${chipX}" y="${chipY + 8}" text-anchor="middle" fill="#0f172a" font-size="8" font-weight="700" font-family="system-ui,sans-serif">FDW ${fmtNum(face!.fdw, 'int')}s</text>`
    } else {
      g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${CHART_COLORS.grid}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`
    }

    const label = ap.name.replace('进口', '')
    const lx = cx + dx * (R + 72)
    const ly = cy + dy * (R + 72)
    g += `<text x="${lx}" y="${ly}" text-anchor="middle" fill="${active ? CHART_COLORS.axis : CHART_COLORS.muted}" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${esc(label)}</text>`
    if (active && face!.phases.length) {
      g += `<text x="${lx}" y="${ly + 12}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="8" font-family="system-ui,sans-serif">${esc(face!.phases.join('/'))}</text>`
    }
  })

  // legend
  const ly0 = height - 18
  g += `<rect x="14" y="${ly0 - 8}" width="10" height="10" rx="2" fill="#38bdf8"/><text x="28" y="${ly0}" fill="${CHART_COLORS.muted}" font-size="9" font-family="system-ui,sans-serif">Walk</text>`
  g += `<rect x="70" y="${ly0 - 8}" width="10" height="10" rx="2" fill="#f59e0b"/><text x="84" y="${ly0}" fill="${CHART_COLORS.muted}" font-size="9" font-family="system-ui,sans-serif">FDW</text>`
  g += `<rect x="126" y="${ly0 - 8}" width="12" height="10" rx="2" fill="none" stroke="#f87171" stroke-width="1.5"/><text x="144" y="${ly0}" fill="${CHART_COLORS.muted}" font-size="9" font-family="system-ui,sans-serif">独占</text>`
  g += `<text x="${width - 14}" y="${ly0}" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="9" font-family="system-ui,sans-serif">活跃面 ${faces.size}/${approaches.length}</text>`

  // phase kind note when focus
  if (focus) {
    const kind = inferPhaseKind(focus)
    g += `<text x="${width - 14}" y="20" text-anchor="end" fill="${kind === 'pedestrian' ? '#34d399' : CHART_COLORS.muted}" font-size="10" font-weight="600" font-family="system-ui,sans-serif">${kind === 'pedestrian' ? '专用行人相位' : kind === 'mixed' ? '人车混合' : '机动车相位'}</text>`
  }

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">${g}</svg>`
}
