import { degToRad, round } from '@/shared/math'
import type { Approach, ChannelizationScheme, FlowScheme, Mesh, Movement } from '../types'
import { buildFlowMesh } from '../flow/convert'
import { emptyMesh, pushLabel, pushLine, pushPoly, recomputeBBox } from './mesh'
import { buildWidenProfile, entryLateralExtraAt, exitLateralExtraAt, widenAnnotation } from './widen'
import { laneMovementLabel } from './laneGroups'
import {
  approachCode,
  entryLaneStamp,
  exitLaneStamp,
  stopLineStationLabel,
  stopLineStationShort,
} from './annotations'
import { computeRoundaboutLayout, roundaboutAnnotation } from './roundabout'
import {
  placeMovementArrow,
  placeZebra,
  placeYield,
  placeTeardropSplitter,
  placeCirclePoly,
  placeCircleLine,
  type Frame,
} from './glyphs'

export const THEME = {
  /** carriageway fill — unified so core/approach don't flash different greys */
  asphalt: '#3f4a5a',
  asphaltEdge: '#0b1220',
  laneFill: '#3f4a5a',
  laneAlt: '#465366',
  /** lane line white */
  marking: '#f1f5f9',
  /** edge/curb — dark, continuous */
  curb: '#0f172a',
  yellow: '#fbbf24',
  doubleYellow: '#facc15',
  island: '#86efac',
  islandEdge: '#166534',
  sidewalk: '#d6d3d1',
  bike: '#5eead4',
  crosswalk: '#ffffff',
  flow: '#38bdf8',
  flowL: '#22d3ee',
  flowT: '#60a5fa',
  flowR: '#a78bfa',
  paper: '#e2e8f0',
  grid: '#94a3b8',
  text: '#0f172a',
  accent: '#0ea5e9',
  stop: '#ffffff',
}

type Vec = [number, number]

function add(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1]]
}
function sub(a: Vec, b: Vec): Vec {
  return [a[0] - b[0], a[1] - b[1]]
}
function mul(a: Vec, s: number): Vec {
  return [a[0] * s, a[1] * s]
}
function len(a: Vec): number {
  return Math.hypot(a[0], a[1])
}
function norm(a: Vec): Vec {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l]
}
function rot90(a: Vec): Vec {
  return [-a[1], a[0]]
}
function lerp(a: Vec, b: Vec, t: number): Vec {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}
function dirFromBearing(bearingDeg: number): Vec {
  // 0° north = -Y, 90° east = +X
  return [Math.sin(degToRad(bearingDeg)), -Math.cos(degToRad(bearingDeg))]
}
function perpFromBearing(bearingDeg: number): Vec {
  return rot90(dirFromBearing(bearingDeg))
}

function entryWidth(ap: Approach): number {
  return ap.entryLanes.reduce((s, l) => s + l.widthM, 0)
}
function exitWidth(ap: Approach): number {
  return ap.exitLanes.reduce((s, l) => s + l.widthM, 0)
}
function totalWidth(ap: Approach): number {
  return entryWidth(ap) + ap.median.widthM + exitWidth(ap)
}

function stopLineDistance(approaches: Approach[]): number {
  // core radius from widest half-width + curb clearance
  // skewed / acute angles need slightly more room so fillets don't crash
  const half = Math.max(...approaches.map((a) => totalWidth(a) / 2), 8)
  const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
  let minAngle = 90
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i].bearingDeg
    const b = sorted[(i + 1) % sorted.length].bearingDeg
    let d = Math.abs(b - a) % 360
    if (d > 180) d = 360 - d
    minAngle = Math.min(minAngle, d || 90)
  }
  const acuteBoost = minAngle < 75 ? 4 : minAngle < 90 ? 2 : 0
  return half + 6 + acuteBoost
}

function arcPoints(center: Vec, r: number, a0: number, a1: number, steps = 16): Vec[] {
  const pts: Vec[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = a0 + (a1 - a0) * t
    pts.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r])
  }
  return pts
}

/**
 * Production-oriented schematic geometry:
 * - approach ribbons with true per-lane widths
 * - taper/widen segments
 * - rounded intersection core by connecting stop-line corners with curb arcs
 * - medians, crosswalks, RT channel islands, movement arrows
 * - optional flow volume arrows overlay
 */
export function rebuildChannelMesh(scheme: ChannelizationScheme, flow?: FlowScheme | null): Mesh {
  const mesh = emptyMesh()
  const approaches = scheme.approaches
  if (!approaches.length) return recomputeBBox(mesh)

  const core = stopLineDistance(approaches)
  const approachLen = 95

  // Quiet model backdrop (no drafting sheet / grid / title frame)
  const halfPaper = 160
  pushPoly(mesh, {
    layer: 'FRAME',
    points: [
      [-halfPaper, -halfPaper],
      [halfPaper, -halfPaper],
      [halfPaper, halfPaper],
      [-halfPaper, halfPaper],
    ],
    fill: scheme.display.background || THEME.paper,
    alpha: 0.35,
  })

  if (scheme.intersectionType === 'roundabout') {
    drawRoundabout(mesh, approaches, core)
  } else {
    // intersection core as rounded asphalt using outer curb path
    const curb = buildIntersectionCurb(approaches, core)
    if (curb.length >= 3) {
      pushPoly(mesh, {
        layer: 'ROAD',
        points: curb,
        fill: THEME.asphalt,
        stroke: THEME.curb,
        strokeWidth: 0.55,
      })
    }
    for (const ap of approaches) {
      drawApproach(mesh, ap, core, approachLen)
    }
    // corner islands between adjacent approaches
    drawCornerFillets(mesh, approaches, core)
  }

  if (flow) {
    drawFlowArrows(mesh, approaches, flow, core)
  }

  // center marker only for non-roundabout (diamond would look like square island)
  if (scheme.intersectionType !== 'roundabout') {
    pushPoly(mesh, {
      layer: 'MARKING',
      points: [
        [0, -1.2],
        [1.2, 0],
        [0, 1.2],
        [-1.2, 0],
      ],
      fill: '#94a3b8',
      alpha: 0.5,
    })
  }

  // Canvas shows pure intersection geometry only (no legend / title block / scale).
  // Export packs may re-add drafting chrome later if needed.
  return recomputeBBox(mesh)
}

function buildIntersectionCurb(approaches: Approach[], core: number): Vec[] {
  /**
   * Closed curb path: for each approach stop-line, connect right curb corner
   * to next approach left corner with an angle-aware fillet.
   * Fixes Y/skewed gaps where old mid-dir arc jumped outside the pocket.
   */
  const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
  const pts: Vec[] = []
  for (let i = 0; i < sorted.length; i++) {
    const ap = sorted[i]
    const next = sorted[(i + 1) % sorted.length]
    const ux = dirFromBearing(ap.bearingDeg)
    const px = perpFromBearing(ap.bearingDeg)
    const nux = dirFromBearing(next.bearingDeg)
    const npx = perpFromBearing(next.bearingDeg)
    const half = totalWidth(ap) / 2
    const nhalf = totalWidth(next) / 2
    const left: Vec = add(mul(ux, core), mul(px, -half))
    const right: Vec = add(mul(ux, core), mul(px, half))
    const nextLeft: Vec = add(mul(nux, core), mul(npx, -nhalf))

    // stop-line edge (left → right) only once per approach
    if (i === 0) pts.push(left)
    pts.push(right)

    const angle = cornerAngleDeg(ap.bearingDeg, next.bearingDeg)
    // acute: smaller fillet pulled outward; obtuse: larger smoother
    const r = Math.max(
      3.5,
      Math.min(20, (half + nhalf) * (angle < 70 ? 0.12 : angle < 100 ? 0.2 : 0.28)),
    )
    // Fillet center along bisector of outward normals (approach outbound dirs)
    // For corners between right of A and left of next, bisector of ux and nux points into sector.
    const bis = norm(add(ux, nux))
    // pull center slightly inside core so arc stays continuous with both curbs
    const pull = angle < 75 ? 0.55 : 0.4
    const mid = mul(bis, Math.max(2, core - r * pull))
    const a0 = Math.atan2(right[1] - mid[1], right[0] - mid[0])
    const a1 = Math.atan2(nextLeft[1] - mid[1], nextLeft[0] - mid[0])
    let d = a1 - a0
    while (d <= -Math.PI) d += Math.PI * 2
    while (d > Math.PI) d -= Math.PI * 2
    // prefer the exterior short turn; if sector is acute, d may need flip for smooth outer curb
    if (angle < 80 && Math.abs(d) < Math.PI * 0.35) {
      // keep as-is
    }
    const steps = angle < 70 ? 28 : 20
    const arc = arcPoints(mid, r, a0, a0 + d, steps)
    // drop first arc point if coincides with right
    pts.push(...arc.slice(1))
    pts.push(nextLeft)
  }
  return pts.map(([x, y]) => [round(x), round(y)] as Vec)
}

function cornerAngleDeg(bearingA: number, bearingB: number): number {
  let d = Math.abs(bearingB - bearingA) % 360
  if (d > 180) d = 360 - d
  return d
}

function drawCornerFillets(mesh: Mesh, approaches: Approach[], core: number) {
  if (approaches.length < 2) return
  const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]
    const b = sorted[(i + 1) % sorted.length]
    const ux = dirFromBearing(a.bearingDeg)
    const px = perpFromBearing(a.bearingDeg)
    const nux = dirFromBearing(b.bearingDeg)
    const npx = perpFromBearing(b.bearingDeg)
    const halfA = totalWidth(a) / 2
    const halfB = totalWidth(b) / 2
    const angle = cornerAngleDeg(a.bearingDeg, b.bearingDeg)
    // acute corners need tighter radius; obtuse can open up
    const angleScale = angle < 75 ? 0.72 : angle > 120 ? 1.15 : 1

    // corner curb fillet (between a right edge and b left edge)
    const rCurb = Math.max(3.5, Math.min(16, (halfA + halfB) * 0.18 * angleScale))
    const aRight = add(mul(ux, core), mul(px, halfA))
    const bLeft = add(mul(nux, core), mul(npx, -halfB))
    const midDir = norm(add(ux, nux))
    const filletCenter = mul(midDir, Math.max(2, core - rCurb * 0.55))
    const a0 = Math.atan2(aRight[1] - filletCenter[1], aRight[0] - filletCenter[0])
    const a1 = Math.atan2(bLeft[1] - filletCenter[1], bLeft[0] - filletCenter[0])
    let d = a1 - a0
    while (d <= -Math.PI) d += Math.PI * 2
    while (d > Math.PI) d -= Math.PI * 2
    // curb arc line (visual polish)
    pushLine(mesh, {
      layer: 'MARKING',
      points: arcPoints(filletCenter, rCurb, a0, a0 + d, 18),
      stroke: THEME.curb,
      strokeWidth: 0.35,
      alpha: 0.7,
    })
    // corner angle callout when not ~90° (skewed / Y)
    if (Math.abs(angle - 90) > 12) {
            // extra soft curb offset line for acute pockets
      if (angle < 80) {
        pushLine(mesh, {
          layer: 'MARKING',
          points: arcPoints(filletCenter, rCurb * 1.12, a0, a0 + d, 14),
          stroke: THEME.accent,
          strokeWidth: 0.2,
          dashed: true,
          alpha: 0.55,
        })
      }
    }

    // right-turn channelization + optional safety island (parameter-driven)
    if (a.rightTurn.enabled && a.rightTurn.style !== 'none') {
      const r = Math.max(6, a.rightTurn.radiusM)
      const chW = Math.max(3.0, a.rightTurn.channelWidthM ?? a.rightTurn.widthM)
      const islandW = Math.max(2.0, a.rightTurn.widthM)
      const off = a.rightTurn.islandOffsetM ?? 0
      // island / channel center in the right-turn corner pocket
      const center = add(
        add(mul(ux, core + r * 0.42 + off * 0.15), mul(px, halfA + r * 0.22 + off)),
        mul(midDir, -r * 0.08),
      )
      const ang0 = degToRad(a.bearingDeg) - 0.12
      const ang1 = degToRad(a.bearingDeg) + Math.PI * 0.7
      const outerR = r * 0.95
      const midR = Math.max(outerR - chW * 0.55, 2.5)
      const innerR = Math.max(midR - islandW * 0.55, 1.8)

      // free-right channel ribbon (between outer curb arc and island outer)
      const chOuter = arcPoints(center, outerR, ang0, ang1, 26)
      const chInner = arcPoints(center, midR, ang1, ang0, 22)
      pushPoly(mesh, {
        layer: 'ROAD',
        points: [...chOuter, ...chInner],
        fill: THEME.laneFill,
        stroke: THEME.asphaltEdge,
        strokeWidth: 0.25,
        alpha: 0.92,
      })
      // channel edge lines
      pushLine(mesh, {
        layer: 'MARKING',
        points: arcPoints(center, outerR, ang0, ang1, 22),
        stroke: THEME.marking,
        strokeWidth: 0.2,
      })
      pushLine(mesh, {
        layer: 'MARKING',
        points: arcPoints(center, midR, ang0 + 0.02, ang1 - 0.02, 20),
        stroke: THEME.marking,
        strokeWidth: 0.18,
        dashed: true,
      })

      // main channelization island body (between midR and innerR)
      const outer = arcPoints(center, midR, ang0, ang1, 24)
      const inner = arcPoints(center, innerR, ang1, ang0, 20)
      const painted = a.rightTurn.style === 'painted'
      pushPoly(mesh, {
        layer: 'ISLAND',
        points: [...outer, ...inner],
        fill: painted ? THEME.yellow : THEME.island,
        stroke: THEME.islandEdge,
        strokeWidth: 0.4,
        alpha: painted ? 0.4 : 0.95,
      })
      if (painted) {
        // hatch suggestion via parallel arcs
        for (const frac of [0.35, 0.55, 0.75]) {
          const rr = innerR + (midR - innerR) * frac
          pushLine(mesh, {
            layer: 'MARKING',
            points: arcPoints(center, rr, ang0 + 0.08, ang1 - 0.08, 12),
            stroke: THEME.doubleYellow,
            strokeWidth: 0.15,
            alpha: 0.7,
          })
        }
      }

      // safety island (refuge) — smaller disc near pedestrian path
      const si = a.rightTurn.safetyIsland
      if (si?.enabled) {
        const siR = Math.max(1.2, si.radiusM)
        const setback = si.setbackM ?? 1.5
        const siCenter = add(
          center,
          add(mul(midDir, -siR * 0.2 - setback * 0.3), mul(px, -siR * 0.15)),
        )
        const surfaceFill =
          si.surface === 'landscaped' ? THEME.island : si.surface === 'painted' ? THEME.yellow : '#d6d3d1'
        const segs = 20
        const disc: Vec[] = []
        for (let i = 0; i < segs; i++) {
          const th = (i / segs) * Math.PI * 2
          disc.push([siCenter[0] + Math.cos(th) * siR, siCenter[1] + Math.sin(th) * siR])
        }
        pushPoly(mesh, {
          layer: 'ISLAND',
          points: disc,
          fill: surfaceFill,
          stroke: THEME.islandEdge,
          strokeWidth: 0.35,
          alpha: si.surface === 'painted' ? 0.45 : 0.98,
        })
        // curb ring
        const ring: Vec[] = []
        for (let i = 0; i <= segs; i++) {
          const th = (i / segs) * Math.PI * 2
          ring.push([siCenter[0] + Math.cos(th) * siR, siCenter[1] + Math.sin(th) * siR])
        }
        pushLine(mesh, {
          layer: 'ANNO',
          points: ring,
          stroke: THEME.curb,
          strokeWidth: 0.3,
        })
        if (si.showYield) {
          const tip = add(siCenter, mul(ux, siR * 0.15))
          pushPoly(mesh, {
            layer: 'MARKING',
            points: [tip, add(tip, mul(px, 1.0)), add(tip, mul(ux, 1.2))],
            fill: THEME.yellow,
            alpha: 0.9,
          })
        }
        // no island parameter labels on canvas
      }

      // no free-right dimension label on canvas
    }
  }
}

function drawApproach(mesh: Mesh, ap: Approach, core: number, len: number) {
  const ux = dirFromBearing(ap.bearingDeg)
  const px = perpFromBearing(ap.bearingDeg)
  const eW = entryWidth(ap)
  const xW = exitWidth(ap)
  const med = ap.median.widthM
  const half = totalWidth(ap) / 2
  const start = core
  const end = start + len
  const profile = buildWidenProfile(ap, len)
  // entry side is -px (left when looking outbound from center); exit side +px

  // sample stations along approach for accurate bay + taper polyline
  const stations: number[] = [0]
  for (const s of [
    profile.stations.entryFullEnd,
    profile.stations.entryTaperEnd,
    profile.stations.exitFullStart,
    profile.stations.exitTaperStart,
    len,
  ]) {
    if (s > 0 && s < len) stations.push(s)
  }
  stations.push(len)
  const uniq = Array.from(new Set(stations.map((x) => Math.round(x * 100) / 100))).sort((a, b) => a - b)

  const leftPts: Vec[] = []
  const rightPts: Vec[] = []
  for (const s of uniq) {
    const eExtra = entryLateralExtraAt(profile, s)
    const xExtra = exitLateralExtraAt(profile, s, len)
    // left = entry curb (more negative with entry widen)
    leftPts.push(add(mul(ux, start + s), mul(px, -half - eExtra)))
    // right = exit curb
    rightPts.push(add(mul(ux, start + s), mul(px, half + xExtra)))
  }
  const body: Vec[] = [...leftPts, ...rightPts.slice().reverse()]
  pushPoly(mesh, {
    layer: 'ROAD',
    points: body,
    fill: THEME.asphalt,
    stroke: THEME.curb,
    strokeWidth: 0.35,
    meta: { approachId: ap.id },
  })
  // edge highlight for widen bay
  if (profile.entryExtraM > 0) {
    const bayEdge: Vec[] = []
    for (const s of uniq) {
      if (s > profile.stations.entryTaperEnd + 0.5) break
      bayEdge.push(add(mul(ux, start + s), mul(px, -half - entryLateralExtraAt(profile, s))))
    }
    if (bayEdge.length >= 2) {
      pushLine(mesh, {
        layer: 'MARKING',
        points: bayEdge,
        stroke: THEME.accent,
        strokeWidth: 0.35,
        alpha: 0.85,
      })
    }
  }

  // per-lane coloring for entry lanes
  let off = -half
  ap.entryLanes.forEach((ln, i) => {
    const a = off
    const b = off + ln.widthM
    const poly: Vec[] = [
      add(mul(ux, start + 0.5), mul(px, a)),
      add(mul(ux, end - 8), mul(px, a)),
      add(mul(ux, end - 8), mul(px, b)),
      add(mul(ux, start + 0.5), mul(px, b)),
    ]
    pushPoly(mesh, {
      layer: 'ROAD',
      points: poly,
      fill: i % 2 === 0 ? THEME.laneFill : THEME.laneAlt,
      alpha: 0.55,
      meta: { approachId: ap.id, laneId: ln.id },
    })
    off = b
  })

  // carriageway edge lines (solid white) along widen profile
  if (leftPts.length >= 2) {
    pushLine(mesh, {
      layer: 'MARKING',
      points: leftPts,
      stroke: THEME.marking,
      strokeWidth: 0.22,
      alpha: 0.95,
    })
  }
  if (rightPts.length >= 2) {
    pushLine(mesh, {
      layer: 'MARKING',
      points: rightPts,
      stroke: THEME.marking,
      strokeWidth: 0.22,
      alpha: 0.95,
    })
  }
  // lane dividers (entry) — dashed white at exact width boundaries
  off = -half
  for (let i = 0; i < ap.entryLanes.length - 1; i++) {
    off += ap.entryLanes[i].widthM
    pushLine(mesh, {
      layer: 'MARKING',
      points: [
        add(mul(ux, start + 1.2), mul(px, off)),
        add(mul(ux, end - 5), mul(px, off)),
      ],
      stroke: THEME.marking,
      strokeWidth: 0.12,
      dashed: true,
      alpha: 0.9,
    })
  }

  // median
  const medL = -half + eW
  const medR = medL + med
  const medianFill =
    ap.median.style === 'greenBelt' || ap.median.style === 'fishBelly'
      ? THEME.island
      : ap.median.style === 'doubleYellow' || ap.median.style === 'singleYellow' || ap.median.style === 'yellowHatch'
        ? THEME.yellow
        : ap.median.style === 'barrier'
          ? '#9ca3af'
          : THEME.doubleYellow
  if (ap.median.style !== 'fishBelly') {
    pushPoly(mesh, {
      layer: ap.median.style === 'greenBelt' ? 'ISLAND' : 'MARKING',
      points: [
        add(mul(ux, start + 1), mul(px, medL)),
        add(mul(ux, end - 3), mul(px, medL)),
        add(mul(ux, end - 3), mul(px, medR)),
        add(mul(ux, start + 1), mul(px, medR)),
      ],
      fill: medianFill,
      stroke: THEME.islandEdge,
      strokeWidth: 0.15,
    })
  }
  if (ap.median.style === 'doubleYellow') {
    pushLine(mesh, {
      layer: 'MARKING',
      points: [add(mul(ux, start + 1), mul(px, (medL + medR) / 2 - 0.15)), add(mul(ux, end - 3), mul(px, (medL + medR) / 2 - 0.15))],
      stroke: THEME.doubleYellow,
      strokeWidth: 0.12,
    })
    pushLine(mesh, {
      layer: 'MARKING',
      points: [add(mul(ux, start + 1), mul(px, (medL + medR) / 2 + 0.15)), add(mul(ux, end - 3), mul(px, (medL + medR) / 2 + 0.15))],
      stroke: THEME.doubleYellow,
      strokeWidth: 0.12,
    })
  }
  // fish-belly median: wider near stop line, taper to far (engineering schematic)
  if (ap.median.style === 'fishBelly' && med > 0.5) {
    const mid = (medL + medR) / 2
    const halfNear = med * 0.55
    const halfFar = Math.max(0.4, med * 0.22)
    const s0 = start + 2
    const s1 = start + (end - start) * 0.35
    const s2 = end - 8
    pushPoly(mesh, {
      layer: 'ISLAND',
      points: [
        add(mul(ux, s0), mul(px, mid - halfNear)),
        add(mul(ux, s1), mul(px, mid - halfNear * 0.85)),
        add(mul(ux, s2), mul(px, mid - halfFar)),
        add(mul(ux, s2), mul(px, mid + halfFar)),
        add(mul(ux, s1), mul(px, mid + halfNear * 0.85)),
        add(mul(ux, s0), mul(px, mid + halfNear)),
      ],
      fill: THEME.island,
      stroke: THEME.islandEdge,
      strokeWidth: 0.2,
      alpha: 0.95,
    })
    // no on-road parameter labels
  }

  // exit lane dividers
  let eoff = medR
  for (let i = 0; i < ap.exitLanes.length - 1; i++) {
    eoff += ap.exitLanes[i].widthM
    pushLine(mesh, {
      layer: 'MARKING',
      points: [add(mul(ux, start + 2), mul(px, eoff)), add(mul(ux, end - 6), mul(px, eoff))],
      stroke: THEME.marking,
      strokeWidth: 0.14,
      dashed: true,
    })
  }

  // stop line (double bar — clearer at export scale)
  pushLine(mesh, {
    layer: 'MARKING',
    points: [add(mul(ux, start), mul(px, -half + 0.3)), add(mul(ux, start), mul(px, half - 0.3))],
    stroke: THEME.marking,
    strokeWidth: 0.65,
  })
  pushLine(mesh, {
    layer: 'MARKING',
    points: [add(mul(ux, start + 0.7), mul(px, -half + 0.3)), add(mul(ux, start + 0.7), mul(px, half - 0.3))],
    stroke: THEME.marking,
    strokeWidth: 0.35,
  })
  // stop-line chainage labels omitted on canvas (params live in inspector)

  /**
   * Crosswalk via reusable glyph (bars along ux, pitch on px).
   */
  {
    const cwDepth = 3.0
    const cwCenter = start - 2.2 - cwDepth / 2
    const cwHalf = Math.max(1.5, half - 0.25)
    if (cwCenter - cwDepth / 2 > 1.0) {
      const frame = { origin: [0, 0] as [number, number], ux, px }
      placeZebra(mesh, frame, cwCenter, cwHalf, THEME, { depth: cwDepth, pitch: 1.0 })
    }
  }

  /**
   * Sidewalks: both curbs, follow widen profile (leftPts/rightPts).
   * No floating segments — only continuous ribbon from stop-line outward.
   */
  if (ap.sidewalkWidthM > 0 && leftPts.length >= 2 && rightPts.length >= 2) {
    const sw = ap.sidewalkWidthM
    // left (entry) sidewalk: outward of left curb = further -px
    const leftOuter: Vec[] = leftPts.map((p, i) => {
      const s = uniq[Math.min(i, uniq.length - 1)] ?? 0
      const eExtra = entryLateralExtraAt(profile, s)
      return add(mul(ux, start + s), mul(px, -half - eExtra - sw))
    })
    pushPoly(mesh, {
      layer: 'ROAD',
      points: [...leftOuter, ...leftPts.slice().reverse()],
      fill: THEME.sidewalk,
      stroke: '#a8a29e',
      strokeWidth: 0.12,
      alpha: 0.96,
      meta: { approachId: ap.id, kind: 'sidewalk-entry' },
    })
    // exit: optional bike then sidewalk, stacked outward from right curb (no overlap / dead gap)
    const bikeW = ap.bikeEnabled ? Math.max(0, ap.bikeWidthM) : 0
    if (bikeW > 0) {
      const bikeOuter: Vec[] = rightPts.map((_p, i) => {
        const s = uniq[Math.min(i, uniq.length - 1)] ?? 0
        const xExtra = exitLateralExtraAt(profile, s, len)
        return add(mul(ux, start + s), mul(px, half + xExtra + bikeW))
      })
      pushPoly(mesh, {
        layer: 'ROAD',
        points: [...rightPts, ...bikeOuter.slice().reverse()],
        fill: THEME.bike,
        stroke: '#0f766e',
        strokeWidth: 0.1,
        alpha: 0.88,
        meta: { approachId: ap.id, kind: 'bike' },
      })
    }
    const rightInner: Vec[] = rightPts.map((_p, i) => {
      const s = uniq[Math.min(i, uniq.length - 1)] ?? 0
      const xExtra = exitLateralExtraAt(profile, s, len)
      return add(mul(ux, start + s), mul(px, half + xExtra + bikeW))
    })
    const rightOuter: Vec[] = rightPts.map((_p, i) => {
      const s = uniq[Math.min(i, uniq.length - 1)] ?? 0
      const xExtra = exitLateralExtraAt(profile, s, len)
      return add(mul(ux, start + s), mul(px, half + xExtra + bikeW + sw))
    })
    pushPoly(mesh, {
      layer: 'ROAD',
      points: [...rightInner, ...rightOuter.slice().reverse()],
      fill: THEME.sidewalk,
      stroke: '#a8a29e',
      strokeWidth: 0.12,
      alpha: 0.96,
      meta: { approachId: ap.id, kind: 'sidewalk-exit' },
    })
  }

  // frontage / auxiliary road ribbon (outward of bike or main curb)
  if (ap.auxRoad?.enabled) {
    const aw = Math.max(3, ap.auxRoad.widthM)
    const off = ap.auxRoad.offsetM ?? 1.0
    const openNear = Math.max(8, ap.auxRoad.openNearM ?? 18)
    const outer0 = half + (ap.bikeEnabled ? ap.bikeWidthM : 0) + off
    // leave gap near stop line for main-road merge
    const aStart = start + openNear
    if (aStart < end - 5) {
      pushPoly(mesh, {
        layer: 'ROAD',
        points: [
          add(mul(ux, aStart), mul(px, outer0)),
          add(mul(ux, end), mul(px, outer0)),
          add(mul(ux, end), mul(px, outer0 + aw)),
          add(mul(ux, aStart), mul(px, outer0 + aw)),
        ],
        fill: '#57534e',
        stroke: THEME.asphaltEdge,
        strokeWidth: 0.25,
        alpha: 0.88,
      })
      pushLine(mesh, {
        layer: 'MARKING',
        points: [add(mul(ux, aStart), mul(px, outer0 + aw * 0.5)), add(mul(ux, end), mul(px, outer0 + aw * 0.5))],
        stroke: THEME.marking,
        strokeWidth: 0.15,
        dashed: true,
        alpha: 0.7,
      })
      // no aux width label on canvas
    }
  }

  // wait areas — distinct left / through bay
  if (ap.leftWait) {
    const bay = Math.min(half * 0.35, Math.max(2.5, (ap.entryLanes.find((l) => l.movements.includes('L'))?.widthM ?? 3.5)))
    pushPoly(mesh, {
      layer: 'MARKING',
      points: [
        add(mul(ux, start + 0.8), mul(px, -half + 0.2)),
        add(mul(ux, start + 10), mul(px, -half + 0.2)),
        add(mul(ux, start + 10), mul(px, -half + bay)),
        add(mul(ux, start + 0.8), mul(px, -half + bay)),
      ],
      fill: '#fbbf24',
      alpha: 0.4,
    })
  }
  if (ap.throughWait) {
    pushPoly(mesh, {
      layer: 'MARKING',
      points: [
        add(mul(ux, start + 0.8), mul(px, -1.6)),
        add(mul(ux, start + 9), mul(px, -1.6)),
        add(mul(ux, start + 9), mul(px, 1.6)),
        add(mul(ux, start + 0.8), mul(px, 1.6)),
      ],
      fill: '#fde68a',
      alpha: 0.35,
    })
  }

  // borrow-left: dashed pocket into opposing half
  if (ap.borrowLeft) {
    pushPoly(mesh, {
      layer: 'MARKING',
      points: [
        add(mul(ux, start + 2), mul(px, medL - 0.2)),
        add(mul(ux, start + 14), mul(px, medL - 0.2)),
        add(mul(ux, start + 14), mul(px, medL + med * 0.55)),
        add(mul(ux, start + 2), mul(px, medL + med * 0.55)),
      ],
      fill: '#f97316',
      alpha: 0.22,
    })
    pushLine(mesh, {
      layer: 'MARKING',
      points: [
        add(mul(ux, start + 2), mul(px, medL)),
        add(mul(ux, start + 14), mul(px, medL)),
      ],
      stroke: '#fb923c',
      strokeWidth: 0.25,
      dashed: true,
    })
  }


  // movement arrows only (no E1 / width / B= / approach name callouts on canvas)
  off = -half
  ap.entryLanes.forEach((ln) => {
    const mid = off + ln.widthM / 2
    const base = add(mul(ux, start + 12), mul(px, mid))
    drawMovementArrow(mesh, base, ux, px, ln.movements, !!ln.variable)
    if (ln.variable) {
      pushLine(mesh, {
        layer: 'MARKING',
        points: [
          add(mul(ux, start + 1), mul(px, off + 0.2)),
          add(mul(ux, start + 1), mul(px, off + ln.widthM - 0.2)),
        ],
        stroke: THEME.yellow,
        strokeWidth: 0.35,
        dashed: true,
      })
    }
    off += ln.widthM
  })
}

function drawMovementArrow(
  mesh: Mesh,
  base: Vec,
  ux: Vec,
  px: Vec,
  movements: Movement[],
  variable = false,
) {
  // frame origin at base; placeMovementArrow uses baseS=0 tip toward -ux
  const f: Frame = { origin: base, ux, px }
  placeMovementArrow(mesh, f, 0, 0, movements, THEME, variable)
}

function drawFlowArrows(mesh: Mesh, approaches: Approach[], flow: FlowScheme, core: number) {
  const { arrows } = buildFlowMesh(approaches, flow)
  const byAp = new Map(approaches.map((a) => [a.id, a]))
  for (const ar of arrows) {
    const ap = byAp.get(ar.approachId)
    if (!ap) continue
    const ux = dirFromBearing(ap.bearingDeg)
    const px = perpFromBearing(ap.bearingDeg)
    const half = totalWidth(ap) / 2
    const lateral =
      ar.movement === 'L' ? -half * 0.45 : ar.movement === 'R' ? half * 0.45 : ar.movement === 'U' ? -half * 0.15 : 0
    const base = add(mul(ux, core + 28), mul(px, lateral))
    let tip = sub(base, mul(ux, 10 + ar.width * 0.4))
    if (ar.movement === 'L') tip = add(tip, mul(px, -6))
    if (ar.movement === 'R') tip = add(tip, mul(px, 6))
    if (ar.movement === 'U') tip = add(base, mul(px, -8))
    const color = ar.movement === 'L' ? THEME.flowL : ar.movement === 'R' ? THEME.flowR : ar.movement === 'T' ? THEME.flowT : THEME.flow
    pushLine(mesh, {
      layer: 'FLOW',
      points: [base, tip],
      stroke: color,
      strokeWidth: Math.max(0.8, ar.width * 0.35),
      meta: { volume: ar.volume, movement: ar.movement },
    })
    pushPoly(mesh, {
      layer: 'FLOW',
      points: [tip, add(add(tip, mul(ux, 2)), mul(px, 1.4)), add(add(tip, mul(ux, 2)), mul(px, -1.4))],
      fill: color,
    })
      }
}


function drawLegend(mesh: Mesh, scheme: ChannelizationScheme) {
  // CAD-style legend block (upper-left outside carriageway)
  const x0 = -152
  const y0 = 78
  const rows: { color: string; label: string; stroke?: string; line?: boolean }[] = [
    { color: THEME.laneFill, label: '机动车道', stroke: THEME.asphaltEdge },
    { color: THEME.accent, label: '停车线桩号', stroke: THEME.accent },
    { color: '#f8fafc', label: '车道编号 E1…', stroke: THEME.marking },
    { color: THEME.island, label: '导流岛/中分带', stroke: THEME.islandEdge },
    { color: THEME.sidewalk, label: '人行道', stroke: '#94a3b8' },
    { color: THEME.bike, label: '非机动车道', stroke: '#64748b' },
    { color: THEME.crosswalk, label: '人行横道', stroke: '#e2e8f0' },
    { color: THEME.flow, label: '流量示意', stroke: THEME.flow },
    { color: 'none', label: '停止线', stroke: THEME.stop, line: true },
  ]
  const boxH = rows.length * 6.2 + 14
  const boxW = 46
  // legend panel (fill + outer stroke loop)
  pushPoly(mesh, {
    layer: 'ANNO',
    points: [
      [x0 - 1, y0 - 5],
      [x0 + boxW + 1, y0 - 5],
      [x0 + boxW + 1, y0 + boxH],
      [x0 - 1, y0 + boxH],
    ],
    fill: '#f8fafc',
    stroke: '#0f172a',
    strokeWidth: 0.45,
    alpha: 0.96,
  })
  pushLine(mesh, {
    layer: 'ANNO',
    points: [
      [x0 + 0.8, y0 - 3.4],
      [x0 + boxW - 0.8, y0 - 3.4],
      [x0 + boxW - 0.8, y0 + boxH - 1.4],
      [x0 + 0.8, y0 + boxH - 1.4],
      [x0 + 0.8, y0 - 3.4],
    ],
    stroke: '#94a3b8',
    strokeWidth: 0.2,
  })
  pushLabel(mesh, {
    text: '图  例',
    at: [x0 + boxW / 2, y0 - 0.5],
    color: '#0f172a',
    size: 2.5,
    align: 'center',
  })
  // title underline
  pushLine(mesh, {
    layer: 'ANNO',
    points: [
      [x0 + 4, y0 + 1.5],
      [x0 + boxW - 4, y0 + 1.5],
    ],
    stroke: '#94a3b8',
    strokeWidth: 0.2,
  })
  rows.forEach((r, i) => {
    const y = y0 + 6 + i * 6.2
    if (r.line) {
      pushLine(mesh, {
        layer: 'ANNO',
        points: [
          [x0 + 3, y],
          [x0 + 11, y],
        ],
        stroke: r.stroke ?? THEME.stop,
        strokeWidth: 0.7,
      })
    } else {
      pushPoly(mesh, {
        layer: 'ANNO',
        points: [
          [x0 + 3, y - 1.8],
          [x0 + 11, y - 1.8],
          [x0 + 11, y + 1.8],
          [x0 + 3, y + 1.8],
        ],
        fill: r.color === 'none' ? '#fff' : r.color,
        stroke: r.stroke ?? '#334155',
        strokeWidth: 0.2,
      })
    }
    pushLabel(mesh, {
      text: r.label,
      at: [x0 + 13, y + 0.7],
      color: '#1e293b',
      size: 2.05,
      align: 'left',
    })
  })
  pushLabel(mesh, {
    text: `${typeLabel(scheme.intersectionType)} · ${scheme.approaches.length}进口`,
    at: [x0 + boxW / 2, y0 + boxH - 3.2],
    color: '#475569',
    size: 1.85,
    align: 'center',
  })
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    cross: '十字',
    t: 'T型',
    y: 'Y型',
    skewed: '斜交',
    roundabout: '环形',
    custom: '自定义',
  }
  return map[t] ?? t
}

function drawAnnotations(mesh: Mesh, scheme: ChannelizationScheme) {
  // —— North arrow (classic engineering style) ——
  if (scheme.display.northArrow) {
    const nx = 132
    const ny = -128
    // circle
    const segs = 20
    const ring: [number, number][] = []
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2
      ring.push([nx + Math.cos(a) * 9, ny + Math.sin(a) * 9])
    }
    pushLine(mesh, { layer: 'ANNO', points: ring, stroke: '#0f172a', strokeWidth: 0.35 })
    // N triangle up
    pushPoly(mesh, {
      layer: 'ANNO',
      points: [
        [nx, ny - 11],
        [nx - 4.2, ny + 2],
        [nx + 4.2, ny + 2],
      ],
      fill: '#0f172a',
    })
    // white half cut for contrast
    pushPoly(mesh, {
      layer: 'ANNO',
      points: [
        [nx, ny - 11],
        [nx, ny + 2],
        [nx + 4.2, ny + 2],
      ],
      fill: '#f8fafc',
      stroke: '#0f172a',
      strokeWidth: 0.25,
    })
    pushLabel(mesh, { text: 'N', at: [nx, ny + 8], color: '#0f172a', size: 3.4, align: 'center' })
  }

  // drawing title (top center)
  pushLabel(mesh, {
    text: scheme.name,
    at: [0, -158],
    color: '#0f172a',
    size: 5.0,
    align: 'center',
  })
  pushLabel(mesh, {
    text: `${typeLabel(scheme.intersectionType)}交叉口渠化示意`,
    at: [0, -152],
    color: '#475569',
    size: 2.4,
    align: 'center',
  })

  // outer + inner drawing frame
  pushLine(mesh, {
    layer: 'FRAME',
    points: [
      [-158, -158],
      [158, -158],
      [158, 158],
      [-158, 158],
      [-158, -158],
    ],
    stroke: '#0f172a',
    strokeWidth: 0.75,
  })
  pushLine(mesh, {
    layer: 'FRAME',
    points: [
      [-155, -155],
      [155, -155],
      [155, 155],
      [-155, 155],
      [-155, -155],
    ],
    stroke: '#64748b',
    strokeWidth: 0.3,
  })

  // title block (lower-right) — multi-row CAD style
  const tb = { x0: 72, y0: 118, w: 78, h: 34 }
  pushPoly(mesh, {
    layer: 'FRAME',
    points: [
      [tb.x0, tb.y0],
      [tb.x0 + tb.w, tb.y0],
      [tb.x0 + tb.w, tb.y0 + tb.h],
      [tb.x0, tb.y0 + tb.h],
    ],
    fill: '#f8fafc',
    stroke: '#0f172a',
    strokeWidth: 0.4,
  })
  // horizontal rules
  for (const yy of [tb.y0 + 8, tb.y0 + 16, tb.y0 + 24]) {
    pushLine(mesh, {
      layer: 'FRAME',
      points: [
        [tb.x0, yy],
        [tb.x0 + tb.w, yy],
      ],
      stroke: '#94a3b8',
      strokeWidth: 0.2,
    })
  }
  pushLabel(mesh, { text: 'CROSSDRAW', at: [tb.x0 + tb.w / 2, tb.y0 + 5.5], color: '#0f172a', size: 2.3, align: 'center' })
  pushLabel(mesh, { text: '交叉口渠化图', at: [tb.x0 + tb.w / 2, tb.y0 + 13.2], color: '#1e293b', size: 2.15, align: 'center' })
  pushLabel(mesh, {
    text: `方案 ${scheme.name.slice(0, 12)}`,
    at: [tb.x0 + tb.w / 2, tb.y0 + 21.2],
    color: '#334155',
    size: 1.9,
    align: 'center',
  })
  pushLabel(mesh, {
    text: '比例示意 · 单位 m',
    at: [tb.x0 + tb.w / 2, tb.y0 + 29.5],
    color: '#64748b',
    size: 1.85,
    align: 'center',
  })

  // dual-band scale bar (0–25–50 m)
  const sx = -145
  const sy = 142
  pushLine(mesh, {
    layer: 'ANNO',
    points: [
      [sx, sy],
      [sx + 50, sy],
    ],
    stroke: '#0f172a',
    strokeWidth: 0.55,
  })
  // filled alternating segments
  pushPoly(mesh, {
    layer: 'ANNO',
    points: [
      [sx, sy - 1.6],
      [sx + 25, sy - 1.6],
      [sx + 25, sy + 1.6],
      [sx, sy + 1.6],
    ],
    fill: '#0f172a',
  })
  pushPoly(mesh, {
    layer: 'ANNO',
    points: [
      [sx + 25, sy - 1.6],
      [sx + 50, sy - 1.6],
      [sx + 50, sy + 1.6],
      [sx + 25, sy + 1.6],
    ],
    fill: '#f8fafc',
    stroke: '#0f172a',
    strokeWidth: 0.25,
  })
  for (const [d, lab] of [
    [0, '0'],
    [25, '25'],
    [50, '50m'],
  ] as const) {
    pushLine(mesh, {
      layer: 'ANNO',
      points: [
        [sx + d, sy - 2.4],
        [sx + d, sy + 2.4],
      ],
      stroke: '#0f172a',
      strokeWidth: 0.35,
    })
    pushLabel(mesh, {
      text: lab,
      at: [sx + d, sy + 5.5],
      color: '#0f172a',
      size: 2.0,
      align: 'center',
    })
  }
}

export function meshAreaRoad(mesh: Mesh): number {
  let area = 0
  for (const p of mesh.polygons.filter((x) => x.layer === 'ROAD')) {
    area += Math.abs(shoelace(p.points))
  }
  return round(area, 4)
}

function shoelace(pts: [number, number][]): number {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    s += x1 * y2 - x2 * y1
  }
  return s / 2
}


function drawRoundabout(mesh: Mesh, approaches: Approach[], core: number) {
  const layout = computeRoundaboutLayout(approaches, core)
  const { outerR, islandR, apronOuterR, laneRadii, laneCount } = layout

  // --- Continuous circulatory asphalt (full disk; island drawn on top) ---
  pushPoly(mesh, {
    layer: 'ROAD',
    points: arcPoints([0, 0], outerR, 0, Math.PI * 2, 96),
    fill: THEME.asphalt,
    stroke: THEME.curb,
    strokeWidth: 0.55,
  })

  // Outer edge highlight (inscribed circle)
  pushLine(mesh, {
    layer: 'MARKING',
    points: arcPoints([0, 0], outerR - 0.12, 0, Math.PI * 2, 96),
    stroke: THEME.asphaltEdge,
    strokeWidth: 0.28,
    alpha: 0.75,
  })

  // --- Truck apron (mountable ring, circular) ---
  // Approximate filled annulus with outer apron poly then island punch by draw order
  pushPoly(mesh, {
    layer: 'ISLAND',
    points: arcPoints([0, 0], apronOuterR, 0, Math.PI * 2, 72),
    fill: '#a8a29e',
    stroke: THEME.islandEdge,
    strokeWidth: 0.25,
    alpha: 0.95,
  })
  // apron radial hatch (schematic mountable texture)
  for (let k = 0; k < 24; k++) {
    const a0 = (k / 24) * Math.PI * 2
    const a1 = a0 + Math.PI / 48
    pushLine(mesh, {
      layer: 'MARKING',
      points: [
        [Math.cos(a0) * (islandR + 0.15), Math.sin(a0) * (islandR + 0.15)],
        [Math.cos(a1) * (apronOuterR - 0.1), Math.sin(a1) * (apronOuterR - 0.1)],
      ],
      stroke: '#78716c',
      strokeWidth: 0.18,
      alpha: 0.45,
    })
  }

  // --- Central island: TRUE CIRCLE (landscaped) ---
  pushPoly(mesh, {
    layer: 'ISLAND',
    points: arcPoints([0, 0], islandR, 0, Math.PI * 2, 72),
    fill: THEME.island,
    stroke: THEME.islandEdge,
    strokeWidth: 0.5,
  })
  // island curb ring
  pushLine(mesh, {
    layer: 'MARKING',
    points: arcPoints([0, 0], islandR, 0, Math.PI * 2, 72),
    stroke: THEME.curb,
    strokeWidth: 0.35,
    alpha: 0.9,
  })

  // Circulatory lane lines (full continuous circles, dashed)
  for (let i = 0; i < laneRadii.length; i++) {
    const rr = laneRadii[i]
    pushLine(mesh, {
      layer: 'MARKING',
      points: arcPoints([0, 0], rr, 0, Math.PI * 2, 80),
      stroke: THEME.marking,
      strokeWidth: i === 0 && laneCount > 1 ? 0.28 : 0.22,
      dashed: true,
      alpha: 0.92,
    })
  }
  // lane-divider at apron outer edge (solid)
  pushLine(mesh, {
    layer: 'MARKING',
    points: arcPoints([0, 0], apronOuterR + 0.05, 0, Math.PI * 2, 72),
    stroke: THEME.marking,
    strokeWidth: 0.2,
    alpha: 0.7,
  })

  // Circulation chevrons — counter-clockwise (China RHT), mid-ring only
  const midR = (apronOuterR + outerR) / 2
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * Math.PI * 2 + 0.15
    const x = Math.cos(ang) * midR
    const y = Math.sin(ang) * midR
    // tangent CCW
    const tx = -Math.sin(ang)
    const ty = Math.cos(ang)
    const nx = -ty
    const ny = tx
    pushLine(mesh, {
      layer: 'MARKING',
      points: [
        [x - tx * 2.0 + nx * 0.9, y - ty * 2.0 + ny * 0.9],
        [x + tx * 2.4, y + ty * 2.4],
        [x - tx * 2.0 - nx * 0.9, y - ty * 2.0 - ny * 0.9],
      ],
      stroke: THEME.marking,
      strokeWidth: 0.32,
      alpha: 0.7,
    })
  }

  // --- Approaches + teardrop splitters + set-back zebra + yield ---
  for (const ap of approaches) {
    const ux = dirFromBearing(ap.bearingDeg)
    const px = perpFromBearing(ap.bearingDeg)
    const half = totalWidth(ap) / 2
    const eW = entryWidth(ap)
    const xW = exitWidth(ap)
    const med = Math.max(ap.median.widthM, 2.4)

    // Attach approach outside outer curb with modest flare length
    drawApproach(mesh, ap, outerR + 0.8, 100)

    // Teardrop splitter island (elongated, NOT circular blob)
    // Sits between entry (-px) and exit (+px) along approach axis
    const splitNose = outerR + 3.5 // near circulating edge
    const splitTail = outerR + 22 // away from circle
    const noseHalf = Math.max(0.9, med * 0.22)
    const midHalf = Math.max(1.4, med * 0.38)
    const tailHalf = Math.max(1.1, med * 0.32)
    const splitter: Vec[] = [
      add(mul(ux, splitNose), mul(px, 0)), // pointed nose toward circle
      add(mul(ux, splitNose + 4), mul(px, -noseHalf)),
      add(mul(ux, (splitNose + splitTail) / 2), mul(px, -midHalf)),
      add(mul(ux, splitTail), mul(px, -tailHalf)),
      add(mul(ux, splitTail), mul(px, tailHalf)),
      add(mul(ux, (splitNose + splitTail) / 2), mul(px, midHalf)),
      add(mul(ux, splitNose + 4), mul(px, noseHalf)),
    ]
    pushPoly(mesh, {
      layer: 'ISLAND',
      points: splitter,
      fill: THEME.island,
      stroke: THEME.islandEdge,
      strokeWidth: 0.32,
      alpha: 0.95,
    })
    // splitter curb outline accent
    pushLine(mesh, {
      layer: 'MARKING',
      points: [...splitter, splitter[0]],
      stroke: THEME.curb,
      strokeWidth: 0.22,
      alpha: 0.55,
    })

    // Yield line at entry (give-way) — dashed, at outer curb, entry half only
    {
      const yAt = outerR + 0.35
      const entryLeft = -half
      const entryRight = -half + eW
      const yPts: Vec[] = []
      const n = 7
      for (let i = 0; i <= n; i++) {
        const t = i / n
        const lat = entryLeft + (entryRight - entryLeft) * t
        yPts.push(add(mul(ux, yAt), mul(px, lat)))
      }
      pushLine(mesh, {
        layer: 'MARKING',
        points: yPts,
        stroke: THEME.marking,
        strokeWidth: 0.45,
        dashed: true,
        alpha: 0.95,
      })
      // yield triangle (schematic, small)
      const midLat = (entryLeft + entryRight) / 2
      const tip = add(mul(ux, yAt + 2.4), mul(px, midLat))
      const base = yAt - 0.2
      pushPoly(mesh, {
        layer: 'MARKING',
        points: [
          tip,
          add(mul(ux, base), mul(px, midLat - 1.3)),
          add(mul(ux, base), mul(px, midLat + 1.3)),
        ],
        fill: THEME.marking,
        alpha: 0.88,
      })
    }

    // Crosswalk set BACK from yield (~6–8 m along approach) — bars along px (across road)
    {
      const zAt = outerR + 9.5
      const span = half * 0.92
      const barLen = 2.6 // along approach (ux)
      const nBars = Math.max(5, Math.round((span * 2) / 1.4))
      for (let i = 0; i < nBars; i++) {
        const lat = -span + (i + 0.5) * ((span * 2) / nBars)
        const c = add(mul(ux, zAt), mul(px, lat))
        pushLine(mesh, {
          layer: 'MARKING',
          points: [add(c, mul(ux, -barLen / 2)), add(c, mul(ux, barLen / 2))],
          stroke: THEME.crosswalk,
          strokeWidth: 0.95,
          alpha: 0.95,
        })
      }
    }

  }

  // no dimension callouts on canvas (clean geometry)
}

/** T-junction template helper: drop one approach */
export function asTJunction(scheme: ChannelizationScheme, dropBearing = 180): ChannelizationScheme {
  return {
    ...scheme,
    intersectionType: 't',
    approaches: scheme.approaches.filter((a) => a.bearingDeg !== dropBearing),
  }
}
