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

export const THEME = {
  asphalt: '#374151',
  asphaltEdge: '#0f172a',
  laneFill: '#4b5563',
  laneAlt: '#526072',
  marking: '#f8fafc',
  yellow: '#f59e0b',
  doubleYellow: '#eab308',
  island: '#4ade80',
  islandEdge: '#15803d',
  sidewalk: '#e7e5e4',
  bike: '#34d399',
  crosswalk: '#ffffff',
  flow: '#38bdf8',
  flowL: '#22d3ee',
  flowT: '#60a5fa',
  flowR: '#a78bfa',
  paper: '#dbeafe',
  grid: '#94a3b8',
  text: '#0f172a',
  accent: '#0ea5e9',
  curb: '#1e293b',
  stop: '#f8fafc',
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
  const half = Math.max(...approaches.map((a) => totalWidth(a) / 2), 8)
  return half + 6
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

  // modern rectangular paper (not circular vignette)
  const halfPaper = 170
  pushPoly(mesh, {
    layer: 'FRAME',
    points: [
      [-halfPaper, -halfPaper],
      [halfPaper, -halfPaper],
      [halfPaper, halfPaper],
      [-halfPaper, halfPaper],
    ],
    fill: scheme.display.background || THEME.paper,
    alpha: 1,
  })
  // outer soft margin
  pushPoly(mesh, {
    layer: 'FRAME',
    points: [
      [-halfPaper - 8, -halfPaper - 8],
      [halfPaper + 8, -halfPaper - 8],
      [halfPaper + 8, halfPaper + 8],
      [-halfPaper - 8, halfPaper + 8],
    ],
    fill: '#0a1020',
    alpha: 0.35,
    stroke: '#1e293b',
    strokeWidth: 0.4,
  })

  // subtle grid
  for (let g = -150; g <= 150; g += 10) {
    pushLine(mesh, {
      layer: 'FRAME',
      points: [
        [g, -150],
        [g, 150],
      ],
      stroke: THEME.grid,
      strokeWidth: 0.08,
      alpha: 0.22,
    })
    pushLine(mesh, {
      layer: 'FRAME',
      points: [
        [-150, g],
        [150, g],
      ],
      stroke: THEME.grid,
      strokeWidth: 0.08,
      alpha: 0.22,
    })
  }

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
        strokeWidth: 0.45,
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

  // center marker (subtle)
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

  drawAnnotations(mesh, scheme)
  drawLegend(mesh, scheme)
  return recomputeBBox(mesh)
}

function buildIntersectionCurb(approaches: Approach[], core: number): Vec[] {
  // sample outer corners of each approach stop line in bearing order
  const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
  const pts: Vec[] = []
  for (let i = 0; i < sorted.length; i++) {
    const ap = sorted[i]
    const next = sorted[(i + 1) % sorted.length]
    const ux = dirFromBearing(ap.bearingDeg)
    const px = perpFromBearing(ap.bearingDeg)
    const half = totalWidth(ap) / 2
    const left: Vec = add(mul(ux, core), mul(px, -half))
    const right: Vec = add(mul(ux, core), mul(px, half))
    pts.push(left, right)

    // curb arc to next approach left corner
    const nux = dirFromBearing(next.bearingDeg)
    const npx = perpFromBearing(next.bearingDeg)
    const nhalf = totalWidth(next) / 2
    const nextLeft: Vec = add(mul(nux, core), mul(npx, -nhalf))
    const r = Math.max(6, Math.min(18, (half + nhalf) * 0.22))
    // approximate arc through corner region
    const midDir = norm(add(ux, nux))
    const mid = mul(midDir, core - r * 0.35)
    const a0 = Math.atan2(right[1] - mid[1], right[0] - mid[0])
    const a1 = Math.atan2(nextLeft[1] - mid[1], nextLeft[0] - mid[0])
    // unwrap angle to go the short exterior way
    let d = a1 - a0
    while (d <= -Math.PI) d += Math.PI * 2
    while (d > Math.PI) d -= Math.PI * 2
    const arc = arcPoints(mid, r * 0.9, a0, a0 + d, 20)
    pts.push(...arc)
  }
  return pts.map(([x, y]) => [round(x), round(y)] as Vec)
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

    // corner curb fillet (between a right edge and b left edge)
    const rCurb = Math.max(4, Math.min(14, (halfA + halfB) * 0.18))
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
        pushLabel(mesh, {
          text: si.label || '安全岛',
          at: add(siCenter, [0, siR + 1.8]),
          color: THEME.islandEdge,
          size: 1.9,
          align: 'center',
        })
        pushLabel(mesh, {
          text: `r=${siR.toFixed(1)}m`,
          at: add(siCenter, [0, -siR - 1.2]),
          color: '#475569',
          size: 1.7,
          align: 'center',
        })
      }

      pushLabel(mesh, {
        text: `R=${r.toFixed(0)}m · 道宽${chW.toFixed(1)}`,
        at: add(center, mul(midDir, r * 0.12)),
        color: THEME.islandEdge,
        size: 2.0,
        align: 'center',
      })
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
    fill: THEME.laneFill,
    stroke: THEME.asphaltEdge,
    strokeWidth: 0.3,
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

  // lane dividers (entry)
  off = -half
  for (let i = 0; i < ap.entryLanes.length - 1; i++) {
    off += ap.entryLanes[i].widthM
    pushLine(mesh, {
      layer: 'MARKING',
      points: [
        add(mul(ux, start + 2), mul(px, off)),
        add(mul(ux, end - 6), mul(px, off)),
      ],
      stroke: THEME.marking,
      strokeWidth: 0.16,
      dashed: true,
    })
  }

  // median
  const medL = -half + eW
  const medR = medL + med
  const medianFill =
    ap.median.style === 'greenBelt'
      ? THEME.island
      : ap.median.style === 'doubleYellow' || ap.median.style === 'singleYellow' || ap.median.style === 'yellowHatch'
        ? THEME.yellow
        : ap.median.style === 'barrier'
          ? '#9ca3af'
          : THEME.doubleYellow
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
  // stop-line chainage + tick outside entry curb
  {
    const tick0 = add(mul(ux, start), mul(px, -half - 0.8))
    const tick1 = add(mul(ux, start), mul(px, -half - 2.4))
    pushLine(mesh, {
      layer: 'ANNO',
      points: [tick0, tick1],
      stroke: THEME.accent,
      strokeWidth: 0.28,
    })
    pushLabel(mesh, {
      text: stopLineStationLabel(start),
      at: add(mul(ux, start + 0.2), mul(px, -half - 4.2)),
      color: THEME.accent,
      size: 2.0,
      align: 'center',
      meta: { kind: 'stop-station', approachId: ap.id, stationM: start },
    })
    pushLabel(mesh, {
      text: `${approachCode(ap)} ${stopLineStationShort(start)}`,
      at: add(mul(ux, start + 0.2), mul(px, half + 3.6)),
      color: '#0f172a',
      size: 1.9,
      align: 'center',
      meta: { kind: 'stop-code', approachId: ap.id },
    })
  }

  // crosswalk zebra (denser bars + outline)
  const cw = start - 3.8
  const cwHalf = half * 0.95
  pushLine(mesh, {
    layer: 'MARKING',
    points: [add(mul(ux, cw - 1.6), mul(px, -cwHalf)), add(mul(ux, cw - 1.6), mul(px, cwHalf))],
    stroke: THEME.crosswalk,
    strokeWidth: 0.2,
    alpha: 0.7,
  })
  pushLine(mesh, {
    layer: 'MARKING',
    points: [add(mul(ux, cw + 1.6), mul(px, -cwHalf)), add(mul(ux, cw + 1.6), mul(px, cwHalf))],
    stroke: THEME.crosswalk,
    strokeWidth: 0.2,
    alpha: 0.7,
  })
  for (let i = -7; i <= 7; i++) {
    const o = (i / 7) * cwHalf
    pushLine(mesh, {
      layer: 'MARKING',
      points: [add(mul(ux, cw - 1.35), mul(px, o)), add(mul(ux, cw + 1.35), mul(px, o))],
      stroke: THEME.crosswalk,
      strokeWidth: 0.55,
    })
  }

  // sidewalk
  if (ap.sidewalkWidthM > 0) {
    const sw = ap.sidewalkWidthM
    pushPoly(mesh, {
      layer: 'ROAD',
      points: [
        add(mul(ux, start), mul(px, -half - sw)),
        add(mul(ux, end), mul(px, -half - sw)),
        add(mul(ux, end), mul(px, -half)),
        add(mul(ux, start), mul(px, -half)),
      ],
      fill: THEME.sidewalk,
      alpha: 0.95,
    })
  }
  if (ap.bikeEnabled) {
    const bw = ap.bikeWidthM
    pushPoly(mesh, {
      layer: 'ROAD',
      points: [
        add(mul(ux, start), mul(px, half)),
        add(mul(ux, end), mul(px, half)),
        add(mul(ux, end), mul(px, half + bw)),
        add(mul(ux, start), mul(px, half + bw)),
      ],
      fill: THEME.bike,
      alpha: 0.9,
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
      pushLabel(mesh, {
        text: `辅路 ${aw.toFixed(1)}m`,
        at: add(mul(ux, (aStart + end) / 2), mul(px, outer0 + aw * 0.55)),
        color: '#e7e5e4',
        size: 1.8,
        align: 'center',
      })
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
    pushLabel(mesh, {
      text: '左转待转',
      at: add(mul(ux, start + 5.5), mul(px, -half + bay * 0.55)),
      color: '#78350f',
      size: 2,
      align: 'center',
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
    pushLabel(mesh, {
      text: '直行待行',
      at: add(mul(ux, start + 5), [0, 0]),
      color: '#713f12',
      size: 2,
      align: 'center',
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
    pushLabel(mesh, {
      text: '借道左转',
      at: add(mul(ux, start + 8), mul(px, medL + 1)),
      color: '#9a3412',
      size: 2,
      align: 'center',
    })
  }

  // red-light right-turn annotation
  if (ap.redRightTurn) {
    pushLabel(mesh, {
      text: `红灯右转 ${(ap.redRightTurnRatio * 100).toFixed(0)}%`,
      at: add(mul(ux, start + 18), mul(px, half * 0.55)),
      color: '#b91c1c',
      size: 2.2,
      align: 'center',
    })
  }

  // movement arrows + lane numbers (E1.. from median outward) per entry lane
  off = -half
  ap.entryLanes.forEach((ln, li) => {
    const mid = off + ln.widthM / 2
    const base = add(mul(ux, start + 12), mul(px, mid))
    drawMovementArrow(mesh, base, ux, px, ln.movements, !!ln.variable)
    // lane number stamp near stop line (median→curb = E1..)
    pushLabel(mesh, {
      text: entryLaneStamp(li, ln.movements, !!ln.variable),
      at: add(mul(ux, start + 4.2), mul(px, mid)),
      color: ln.variable ? THEME.yellow : '#f8fafc',
      size: 2.0,
      align: 'center',
      meta: { kind: 'lane-no', approachId: ap.id, laneId: ln.id, index: li + 1 },
    })
    // width under number
    pushLabel(mesh, {
      text: `${ln.widthM.toFixed(2)}m`,
      at: add(mul(ux, start + 2.2), mul(px, mid)),
      color: '#cbd5e1',
      size: 1.55,
      align: 'center',
    })
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
  // exit lane numbers X1.. from median
  {
    let xoff = medR
    ap.exitLanes.forEach((ln, xi) => {
      const mid = xoff + ln.widthM / 2
      pushLabel(mesh, {
        text: exitLaneStamp(xi),
        at: add(mul(ux, start + 5.5), mul(px, mid)),
        color: '#94a3b8',
        size: 1.75,
        align: 'center',
        meta: { kind: 'exit-lane-no', approachId: ap.id, index: xi + 1 },
      })
      xoff += ln.widthM
    })
  }

  // widen dimension annotation (同源 WidenParams)
  const wAnno = widenAnnotation(ap)
  if (wAnno) {
    const sLab = Math.min(len * 0.35, Math.max(8, profile.stations.entryFullEnd * 0.5 + 4))
    pushLabel(mesh, {
      text: wAnno,
      at: add(mul(ux, start + sLab), mul(px, -half - profile.entryExtraM - 3.5)),
      color: '#0f172a',
      size: 2.2,
      align: 'center',
    })
    // station ticks: bay end / taper end
    for (const [s, lab] of [
      [profile.stations.entryFullEnd, '段尽'],
      [profile.stations.entryTaperEnd, '渐尽'],
    ] as const) {
      if (s <= 0 || s >= len) continue
      const p0 = add(mul(ux, start + s), mul(px, -half - profile.entryExtraM - 1))
      const p1 = add(mul(ux, start + s), mul(px, -half + 1))
      pushLine(mesh, {
        layer: 'ANNO',
        points: [p0, p1],
        stroke: THEME.accent,
        strokeWidth: 0.25,
      })
      pushLabel(mesh, {
        text: lab,
        at: add(p0, mul(px, -2)),
        color: THEME.accent,
        size: 1.7,
        align: 'center',
      })
    }
  }

  // total width dimension
  const dimY = half + ap.sidewalkWidthM + 2.5
  pushLine(mesh, {
    layer: 'ANNO',
    points: [add(mul(ux, start + 22), mul(px, -half)), add(mul(ux, start + 22), mul(px, half))],
    stroke: THEME.accent,
    strokeWidth: 0.25,
  })
  pushLine(mesh, {
    layer: 'ANNO',
    points: [add(mul(ux, start + 20.5), mul(px, -half)), add(mul(ux, start + 23.5), mul(px, -half))],
    stroke: THEME.accent,
    strokeWidth: 0.25,
  })
  pushLine(mesh, {
    layer: 'ANNO',
    points: [add(mul(ux, start + 20.5), mul(px, half)), add(mul(ux, start + 23.5), mul(px, half))],
    stroke: THEME.accent,
    strokeWidth: 0.25,
  })
  pushLabel(mesh, {
    text: `B=${totalWidth(ap).toFixed(1)}m`,
    at: add(mul(ux, start + 22), mul(px, 0)),
    color: THEME.accent,
    size: 2.2,
    align: 'center',
  })

  pushLabel(mesh, {
    text: `${approachCode(ap)} ${ap.name}`,
    at: add(mul(ux, end - 6), [0, 0]),
    color: THEME.text,
    size: 4.0,
    align: 'center',
    meta: { approachId: ap.id, code: approachCode(ap) },
  })
  pushLabel(mesh, {
    text: `${ap.bearingDeg.toFixed(0)}° · ${ap.entryLanes.length}进/${ap.exitLanes.length}出 · ${stopLineStationShort(start)}`,
    at: add(mul(ux, end - 2), [0, 0]),
    color: '#475569',
    size: 2.2,
    align: 'center',
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
  const tip = sub(base, mul(ux, 4.8))
  pushLine(mesh, {
    layer: 'MARKING',
    points: [base, tip],
    stroke: variable ? THEME.yellow : THEME.marking,
    strokeWidth: variable ? 0.42 : 0.35,
  })
  // head
  pushPoly(mesh, {
    layer: 'MARKING',
    points: [tip, add(add(tip, mul(ux, 1.5)), mul(px, 1.1)), add(add(tip, mul(ux, 1.5)), mul(px, -1.1))],
    fill: variable ? THEME.yellow : THEME.marking,
  })
  // L/R hooks
  if (movements.includes('L')) {
    const p = sub(base, mul(ux, 2))
    pushLine(mesh, {
      layer: 'MARKING',
      points: [p, add(p, mul(px, -2.2)), add(add(p, mul(px, -2.2)), mul(ux, -1))],
      stroke: variable ? THEME.yellow : THEME.marking,
      strokeWidth: 0.28,
    })
  }
  if (movements.includes('R')) {
    const p = sub(base, mul(ux, 2))
    pushLine(mesh, {
      layer: 'MARKING',
      points: [p, add(p, mul(px, 2.2)), add(add(p, mul(px, 2.2)), mul(ux, -1))],
      stroke: variable ? THEME.yellow : THEME.marking,
      strokeWidth: 0.28,
    })
  }
  pushLabel(mesh, {
    text: variable ? `${movements.join('') || 'T'}·变` : movements.join('') || 'T',
    at: add(base, mul(ux, 2.5)),
    color: variable ? THEME.yellow : '#e2e8f0',
    size: 2.1,
    align: 'center',
  })
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
    pushLabel(mesh, {
      text: String(Math.round(ar.volume)),
      at: lerp(base, tip, 0.5),
      color: '#0c4a6e',
      size: 2.3,
      align: 'center',
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
  const outerR = core + 8
  const innerR = Math.max(6, core * 0.45)
  const ring = arcPoints([0, 0], outerR, 0, Math.PI * 2, 48)
  pushPoly(mesh, {
    layer: 'ROAD',
    points: ring,
    fill: THEME.asphalt,
    stroke: THEME.curb,
    strokeWidth: 0.5,
  })
  // central island
  pushPoly(mesh, {
    layer: 'ISLAND',
    points: arcPoints([0, 0], innerR, 0, Math.PI * 2, 36),
    fill: THEME.island,
    stroke: THEME.islandEdge,
    strokeWidth: 0.4,
  })
  // circulatory lane marking
  pushLine(mesh, {
    layer: 'MARKING',
    points: arcPoints([0, 0], (outerR + innerR) / 2, 0, Math.PI * 2, 48),
    stroke: THEME.marking,
    strokeWidth: 0.25,
    dashed: true,
    alpha: 0.85,
  })
  for (const ap of approaches) {
    drawApproach(mesh, ap, outerR - 2, 90)
  }
  pushLabel(mesh, {
    text: '环形交叉口（示意）',
    at: [0, -outerR - 8],
    color: THEME.text,
    size: 3,
    align: 'center',
  })
}

/** T-junction template helper: drop one approach */
export function asTJunction(scheme: ChannelizationScheme, dropBearing = 180): ChannelizationScheme {
  return {
    ...scheme,
    intersectionType: 't',
    approaches: scheme.approaches.filter((a) => a.bearingDeg !== dropBearing),
  }
}
