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

  // paper background
  const ground: Vec[] = []
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2
    ground.push([Math.cos(a) * 175, Math.sin(a) * 175])
  }
  pushPoly(mesh, {
    layer: 'FRAME',
    points: ground,
    fill: scheme.display.background || THEME.paper,
    alpha: 1,
  })

  // subtle grid
  for (let g = -140; g <= 140; g += 10) {
    pushLine(mesh, {
      layer: 'FRAME',
      points: [
        [g, -140],
        [g, 140],
      ],
      stroke: THEME.grid,
      strokeWidth: 0.08,
      alpha: 0.25,
    })
    pushLine(mesh, {
      layer: 'FRAME',
      points: [
        [-140, g],
        [140, g],
      ],
      stroke: THEME.grid,
      strokeWidth: 0.08,
      alpha: 0.25,
    })
  }

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

  // corner islands between adjacent approaches (for cross)
  drawCornerFillets(mesh, approaches, core)

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
    const arc = arcPoints(mid, r * 0.9, a0, a0 + d, 12)
    pts.push(...arc)
  }
  return pts.map(([x, y]) => [round(x), round(y)] as Vec)
}

function drawCornerFillets(mesh: Mesh, approaches: Approach[], core: number) {
  if (approaches.length < 3) return
  const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]
    const b = sorted[(i + 1) % sorted.length]
    if (a.rightTurn.enabled && a.rightTurn.style !== 'none') {
      const ux = dirFromBearing(a.bearingDeg)
      const px = perpFromBearing(a.bearingDeg)
      const half = totalWidth(a) / 2
      const r = a.rightTurn.radiusM
      const center = add(mul(ux, core + r * 0.35), mul(px, half + r * 0.25))
      const island = arcPoints(center, r * 0.55, degToRad(a.bearingDeg), degToRad(a.bearingDeg) + Math.PI * 0.65, 14)
      island.push(add(center, mul(px, r * 0.2)))
      pushPoly(mesh, {
        layer: 'ISLAND',
        points: island,
        fill: a.rightTurn.style === 'solid' ? THEME.island : 'transparent',
        stroke: THEME.islandEdge,
        strokeWidth: 0.35,
        alpha: a.rightTurn.style === 'painted' ? 0.3 : 0.95,
      })
      // RT lane guide
      pushLine(mesh, {
        layer: 'MARKING',
        points: arcPoints(center, r * 0.85, degToRad(a.bearingDeg) - 0.2, degToRad(a.bearingDeg) + 1.1, 12),
        stroke: THEME.marking,
        strokeWidth: 0.2,
        dashed: true,
      })
    }
    void b
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

  // stop line
  pushLine(mesh, {
    layer: 'MARKING',
    points: [add(mul(ux, start), mul(px, -half)), add(mul(ux, start), mul(px, half))],
    stroke: THEME.marking,
    strokeWidth: 0.55,
  })

  // crosswalk bars
  const cw = start - 3.5
  for (let i = -5; i <= 5; i++) {
    const o = (i / 5) * (half * 0.92)
    pushLine(mesh, {
      layer: 'MARKING',
      points: [add(mul(ux, cw - 1.3), mul(px, o)), add(mul(ux, cw + 1.3), mul(px, o))],
      stroke: THEME.crosswalk,
      strokeWidth: 0.6,
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

  // wait areas
  if (ap.leftWait || ap.throughWait) {
    pushPoly(mesh, {
      layer: 'MARKING',
      points: [
        add(mul(ux, start + 1), mul(px, -half * 0.2)),
        add(mul(ux, start + 8), mul(px, -half * 0.2)),
        add(mul(ux, start + 8), mul(px, half * 0.2)),
        add(mul(ux, start + 1), mul(px, half * 0.2)),
      ],
      fill: '#fde68a',
      alpha: 0.35,
    })
  }

  // movement arrows per entry lane
  off = -half
  for (const ln of ap.entryLanes) {
    const mid = off + ln.widthM / 2
    const base = add(mul(ux, start + 12), mul(px, mid))
    drawMovementArrow(mesh, base, ux, px, ln.movements)
    off += ln.widthM
  }

  // widen dimension annotation
  if (widenExtra > 0) {
    pushLabel(mesh, {
      text: `展宽 ${ap.widen.entryWidenLengthM}m`,
      at: add(mul(ux, start + widenLen * 0.35), mul(px, -half - 4)),
      color: '#334155',
      size: 2.4,
      align: 'center',
    })
  }

  pushLabel(mesh, {
    text: ap.name,
    at: add(mul(ux, end - 6), [0, 0]),
    color: THEME.text,
    size: 3.8,
    align: 'center',
    meta: { approachId: ap.id },
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
    pushLabel(mesh, { text: 'N', at: [125, -143], color: THEME.text, size: 4, align: 'center' })
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

/** T-junction template helper: drop one approach */
export function asTJunction(scheme: ChannelizationScheme, dropBearing = 180): ChannelizationScheme {
  return {
    ...scheme,
    intersectionType: 't',
    approaches: scheme.approaches.filter((a) => a.bearingDeg !== dropBearing),
  }
}
