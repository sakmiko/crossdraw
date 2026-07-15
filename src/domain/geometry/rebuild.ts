import { degToRad, round } from '@/shared/math'
import type { Approach, ChannelizationScheme, FlowScheme, Mesh, Movement } from '../types'
import { buildFlowMesh } from '../flow/convert'
import { emptyMesh, pushLabel, pushLine, pushPoly, recomputeBBox } from './mesh'

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

    // right-turn channelization island for approach a
    if (a.rightTurn.enabled && a.rightTurn.style !== 'none') {
      const r = Math.max(8, a.rightTurn.radiusM)
      const w = Math.max(3.5, a.rightTurn.widthM)
      // island center in the right-turn corner pocket
      const center = add(add(mul(ux, core + r * 0.42), mul(px, halfA + r * 0.22)), mul(midDir, -r * 0.08))
      // outer arc (roadside) and inner arc (island body)
      const ang0 = degToRad(a.bearingDeg) - 0.15
      const ang1 = degToRad(a.bearingDeg) + Math.PI * 0.72
      const outer = arcPoints(center, r * 0.92, ang0, ang1, 24)
      const inner = arcPoints(center, Math.max(2.2, r * 0.92 - w * 0.85), ang1, ang0, 20)
      const island = [...outer, ...inner]
      pushPoly(mesh, {
        layer: 'ISLAND',
        points: island,
        fill: a.rightTurn.style === 'solid' ? THEME.island : THEME.island,
        stroke: THEME.islandEdge,
        strokeWidth: 0.4,
        alpha: a.rightTurn.style === 'painted' ? 0.35 : 0.95,
      })
      // channel path centerline
      pushLine(mesh, {
        layer: 'MARKING',
        points: arcPoints(center, r * 0.92 - w * 0.4, ang0 + 0.05, ang1 - 0.05, 20),
        stroke: THEME.marking,
        strokeWidth: 0.22,
        dashed: true,
      })
      // yield triangle near merge
      const tip = add(center, [Math.cos((ang0 + ang1) / 2) * (r * 0.5), Math.sin((ang0 + ang1) / 2) * (r * 0.5)])
      pushPoly(mesh, {
        layer: 'MARKING',
        points: [
          tip,
          add(tip, mul(px, 1.2)),
          add(tip, mul(ux, 1.4)),
        ],
        fill: THEME.yellow,
        alpha: 0.85,
      })
      pushLabel(mesh, {
        text: `R=${r.toFixed(0)}m`,
        at: add(center, mul(midDir, r * 0.15)),
        color: THEME.islandEdge,
        size: 2.1,
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
  const taper = Math.max(15, ap.widen.entryTaperM)
  const widenLen = Math.max(20, ap.widen.entryWidenLengthM)
  const end = start + len
  const widenExtra =
    ap.widen.entryWidenCount > 0 ? Math.max(0, ap.widen.entryWidenCount * ap.widen.entryWidenWidthM - 0) * 0.35 : 0

  // main road body with optional widen near stop line
  const outerL = (s: number, extra = 0): Vec => add(mul(ux, s), mul(px, -half - extra))
  const outerR = (s: number, extra = 0): Vec => add(mul(ux, s), mul(px, half + extra))

  const body: Vec[] = [
    outerL(start, widenExtra),
    outerL(start + taper, 0),
    outerL(end, 0),
    outerR(end, 0),
    outerR(start + taper, 0),
    outerR(start, widenExtra * 0.25),
  ]
  pushPoly(mesh, {
    layer: 'ROAD',
    points: body,
    fill: THEME.laneFill,
    stroke: THEME.asphaltEdge,
    strokeWidth: 0.3,
    meta: { approachId: ap.id },
  })

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

  // movement arrows per entry lane (respect actual lane widths)
  off = -half
  for (const ln of ap.entryLanes) {
    const mid = off + ln.widthM / 2
    const base = add(mul(ux, start + 12), mul(px, mid))
    drawMovementArrow(mesh, base, ux, px, ln.movements)
    // width label near stop line
    pushLabel(mesh, {
      text: `${ln.widthM.toFixed(2)}m`,
      at: add(mul(ux, start + 3.5), mul(px, mid)),
      color: '#e2e8f0',
      size: 1.8,
      align: 'center',
    })
    off += ln.widthM
  }

  // widen dimension annotation
  if (widenExtra > 0) {
    pushLabel(mesh, {
      text: `展宽 ${ap.widen.entryWidenLengthM}m / 渐变 ${ap.widen.entryTaperM}m`,
      at: add(mul(ux, start + widenLen * 0.35), mul(px, -half - 4)),
      color: '#334155',
      size: 2.4,
      align: 'center',
    })
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
    text: ap.name,
    at: add(mul(ux, end - 6), [0, 0]),
    color: THEME.text,
    size: 4.0,
    align: 'center',
    meta: { approachId: ap.id },
  })
  pushLabel(mesh, {
    text: `${ap.bearingDeg.toFixed(0)}° · ${ap.entryLanes.length}进/${ap.exitLanes.length}出`,
    at: add(mul(ux, end - 2), [0, 0]),
    color: '#475569',
    size: 2.2,
    align: 'center',
  })
}

function drawMovementArrow(mesh: Mesh, base: Vec, ux: Vec, px: Vec, movements: Movement[]) {
  const tip = sub(base, mul(ux, 4.8))
  pushLine(mesh, {
    layer: 'MARKING',
    points: [base, tip],
    stroke: THEME.marking,
    strokeWidth: 0.35,
  })
  // head
  pushPoly(mesh, {
    layer: 'MARKING',
    points: [tip, add(add(tip, mul(ux, 1.5)), mul(px, 1.1)), add(add(tip, mul(ux, 1.5)), mul(px, -1.1))],
    fill: THEME.marking,
  })
  // L/R hooks
  if (movements.includes('L')) {
    const p = sub(base, mul(ux, 2))
    pushLine(mesh, {
      layer: 'MARKING',
      points: [p, add(p, mul(px, -2.2)), add(add(p, mul(px, -2.2)), mul(ux, -1))],
      stroke: THEME.marking,
      strokeWidth: 0.28,
    })
  }
  if (movements.includes('R')) {
    const p = sub(base, mul(ux, 2))
    pushLine(mesh, {
      layer: 'MARKING',
      points: [p, add(p, mul(px, 2.2)), add(add(p, mul(px, 2.2)), mul(ux, -1))],
      stroke: THEME.marking,
      strokeWidth: 0.28,
    })
  }
  pushLabel(mesh, {
    text: movements.join('') || 'T',
    at: add(base, mul(ux, 2.5)),
    color: '#e2e8f0',
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
  const x0 = -155
  const y0 = 95
  const rows: { color: string; label: string; stroke?: string }[] = [
    { color: THEME.laneFill, label: '机动车道', stroke: THEME.asphaltEdge },
    { color: THEME.island, label: '渠化岛/中分', stroke: THEME.islandEdge },
    { color: THEME.sidewalk, label: '人行道' },
    { color: THEME.bike, label: '非机动车道' },
    { color: THEME.flow, label: '流量箭头' },
  ]
  pushPoly(mesh, {
    layer: 'ANNO',
    points: [
      [x0 - 2, y0 - 6],
      [x0 + 48, y0 - 6],
      [x0 + 48, y0 + rows.length * 7 + 6],
      [x0 - 2, y0 + rows.length * 7 + 6],
    ],
    fill: '#f8fafc',
    stroke: '#94a3b8',
    strokeWidth: 0.3,
    alpha: 0.92,
  })
  pushLabel(mesh, { text: '图例', at: [x0 + 22, y0 - 2], color: THEME.text, size: 2.6, align: 'center' })
  rows.forEach((r, i) => {
    const y = y0 + 4 + i * 7
    pushPoly(mesh, {
      layer: 'ANNO',
      points: [
        [x0 + 2, y - 2],
        [x0 + 10, y - 2],
        [x0 + 10, y + 2],
        [x0 + 2, y + 2],
      ],
      fill: r.color,
      stroke: r.stroke ?? r.color,
      strokeWidth: 0.2,
    })
    pushLabel(mesh, { text: r.label, at: [x0 + 12, y + 0.8], color: '#334155', size: 2.1, align: 'left' })
  })
  pushLabel(mesh, {
    text: `类型 ${scheme.intersectionType} · ${scheme.approaches.length} 进口`,
    at: [x0 + 22, y0 + rows.length * 7 + 3],
    color: '#64748b',
    size: 1.9,
    align: 'center',
  })
}

function drawAnnotations(mesh: Mesh, scheme: ChannelizationScheme) {
  if (scheme.display.northArrow) {
    pushLine(mesh, {
      layer: 'ANNO',
      points: [
        [125, -118],
        [125, -138],
      ],
      stroke: THEME.text,
      strokeWidth: 0.9,
    })
    pushPoly(mesh, {
      layer: 'ANNO',
      points: [
        [125, -138],
        [121.5, -132],
        [128.5, -132],
      ],
      fill: THEME.text,
    })
    pushLabel(mesh, { text: 'N', at: [125, -143], color: THEME.text, size: 5, align: 'center' })
  }

  pushLabel(mesh, {
    text: scheme.name,
    at: [0, -158],
    color: THEME.text,
    size: 5.2,
    align: 'center',
  })

  // drawing frame
  pushLine(mesh, {
    layer: 'FRAME',
    points: [
      [-155, -155],
      [155, -155],
      [155, 155],
      [-155, 155],
      [-155, -155],
    ],
    stroke: '#475569',
    strokeWidth: 0.5,
  })
  // title block
  pushPoly(mesh, {
    layer: 'FRAME',
    points: [
      [70, 125],
      [150, 125],
      [150, 150],
      [70, 150],
    ],
    fill: '#f8fafc',
    stroke: '#334155',
    strokeWidth: 0.3,
  })
  pushLabel(mesh, { text: 'CROSSDRAW', at: [110, 132], color: '#0f172a', size: 2.6, align: 'center' })
  pushLabel(mesh, { text: '交叉口渠化图', at: [110, 139], color: '#334155', size: 2.4, align: 'center' })
  pushLabel(mesh, { text: '比例示意 1:1000', at: [110, 145], color: '#64748b', size: 2.1, align: 'center' })

  // scale bar
  pushLine(mesh, {
    layer: 'ANNO',
    points: [
      [-140, 140],
      [-90, 140],
    ],
    stroke: THEME.text,
    strokeWidth: 0.8,
  })
  pushLine(mesh, { layer: 'ANNO', points: [[-140, 138], [-140, 142]], stroke: THEME.text, strokeWidth: 0.5 })
  pushLine(mesh, { layer: 'ANNO', points: [[-90, 138], [-90, 142]], stroke: THEME.text, strokeWidth: 0.5 })
  pushLabel(mesh, { text: '0', at: [-140, 145], color: THEME.text, size: 2.2, align: 'center' })
  pushLabel(mesh, { text: '50m', at: [-90, 145], color: THEME.text, size: 2.2, align: 'center' })
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
