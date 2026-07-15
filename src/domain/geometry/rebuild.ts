import { degToRad, round } from '@/shared/math'
import type { Approach, ChannelizationScheme, Mesh } from '../types'
import { emptyMesh, pushLabel, pushLine, pushPoly, recomputeBBox, rectPoly } from './mesh'

/** Aesthetic palette for professional drawings */
export const THEME = {
  asphalt: '#3f4a5a',
  asphaltEdge: '#111827',
  laneFill: '#5b6574',
  marking: '#f8fafc',
  yellow: '#f59e0b',
  island: '#4ade80',
  islandEdge: '#15803d',
  sidewalk: '#e7e5e4',
  bike: '#6ee7b7',
  crosswalk: '#ffffff',
  flow: '#38bdf8',
  flowHot: '#f97316',
  paper: '#dbe7f3',
  grid: '#94a3b8',
  text: '#0f172a',
  accent: '#0ea5e9',
  shadow: 'rgba(15,23,42,0.25)',
}

function entryWidth(ap: Approach): number {
  const lanes = ap.entryLanes.reduce((s, l) => s + l.widthM, 0)
  const widen = ap.widen.entryWidenCount * ap.widen.entryWidenWidthM
  return Math.max(lanes, lanes + Math.max(0, widen - lanes * 0))
}

function exitWidth(ap: Approach): number {
  return ap.exitLanes.reduce((s, l) => s + l.widthM, 0)
}

function halfRoad(ap: Approach): number {
  return entryWidth(ap) + ap.median.widthM / 2 + exitWidth(ap)
}

/**
 * Rebuild channelization mesh for a scheme.
 * Geometry uses a polar layout: each approach extends outward from origin along bearing.
 * Looks like a professional schematic (not CAD survey accuracy, but consistent & beautiful).
 */
export function rebuildChannelMesh(scheme: ChannelizationScheme): Mesh {
  const mesh = emptyMesh()
  const core = 14 // intersection core half-size-ish
  const approachLen = 90

  // soft ground disk
  const ground: [number, number][] = []
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    ground.push([Math.cos(a) * 160, Math.sin(a) * 160])
  }
  pushPoly(mesh, {
    layer: 'FRAME',
    points: ground,
    fill: scheme.display.background || THEME.paper,
    alpha: 1,
  })

  // intersection core plaza
  pushPoly(mesh, {
    layer: 'ROAD',
    points: rectPoly(0, 0, core + 8, core + 8, 0),
    fill: THEME.asphalt,
    stroke: THEME.asphaltEdge,
    strokeWidth: 0.3,
  })

  for (const ap of scheme.approaches) {
    drawApproach(mesh, ap, core, approachLen)
  }

  // center emblem
  pushPoly(mesh, {
    layer: 'ISLAND',
    points: rectPoly(0, 0, 2.2, 2.2, Math.PI / 4),
    fill: THEME.island,
    stroke: THEME.islandEdge,
    strokeWidth: 0.25,
  })

  if (scheme.display.northArrow) {
    pushLine(mesh, {
      layer: 'ANNO',
      points: [
        [120, -120],
        [120, -135],
      ],
      stroke: THEME.text,
      strokeWidth: 0.8,
    })
    pushLabel(mesh, { text: 'N', at: [120, -140], color: THEME.text, size: 4, align: 'center' })
  }

  pushLabel(mesh, {
    text: scheme.name,
    at: [0, -150],
    color: THEME.text,
    size: 5,
    align: 'center',
  })

  pushLine(mesh, {
    layer: 'FRAME',
    points: [
      [-145, -145],
      [145, -145],
      [145, 145],
      [-145, 145],
      [-145, -145],
    ],
    stroke: '#64748b',
    strokeWidth: 0.4,
  })
  pushLine(mesh, {
    layer: 'ANNO',
    points: [
      [-120, 135],
      [-70, 135],
    ],
    stroke: THEME.text,
    strokeWidth: 0.7,
  })
  pushLabel(mesh, {
    text: '50 m',
    at: [-95, 140],
    color: THEME.text,
    size: 2.8,
    align: 'center',
  })
  pushLabel(mesh, {
    text: 'Crossdraw · 参数驱动出图',
    at: [0, 150],
    color: '#334155',
    size: 3,
    align: 'center',
  })

  return recomputeBBox(mesh)
}

function drawApproach(mesh: Mesh, ap: Approach, core: number, len: number) {
  const rot = degToRad(ap.bearingDeg - 90) // 0° north -> up screen negative Y later in canvas; here math angle from +X
  // Use bearing: 0 north = -Y direction in cartesian drawing
  const dir = degToRad(ap.bearingDeg - 90)
  // Actually: 0° -> -Y, 90° -> +X
  const ux = Math.sin(degToRad(ap.bearingDeg))
  const uy = -Math.cos(degToRad(ap.bearingDeg))
  const px = Math.cos(degToRad(ap.bearingDeg)) // perpendicular
  const py = Math.sin(degToRad(ap.bearingDeg))

  const eW = entryWidth(ap)
  const xW = exitWidth(ap)
  const med = ap.median.widthM
  const total = eW + med + xW
  const start = core + 2
  const end = start + len

  // main carriageway polygon (centerline along approach)
  const half = total / 2
  const p1: [number, number] = [ux * start + px * -half, uy * start + py * -half]
  const p2: [number, number] = [ux * end + px * -half, uy * end + py * -half]
  const p3: [number, number] = [ux * end + px * half, uy * end + py * half]
  const p4: [number, number] = [ux * start + px * half, uy * start + py * half]
  pushPoly(mesh, {
    layer: 'ROAD',
    points: [p1, p2, p3, p4],
    fill: THEME.laneFill,
    stroke: THEME.asphaltEdge,
    strokeWidth: 0.25,
    meta: { approachId: ap.id },
  })

  // widen flare near stop line
  if (ap.widen.entryWidenCount > 0) {
    const flare = ap.widen.entryWidenWidthM * 0.5
    const mid = start + 18
    pushPoly(mesh, {
      layer: 'ROAD',
      points: [
        [ux * start + px * (-half - flare), uy * start + py * (-half - flare)],
        [ux * mid + px * -half, uy * mid + py * -half],
        [ux * mid + px * half, uy * mid + py * half],
        [ux * start + px * (half + flare * 0.3), uy * start + py * (half + flare * 0.3)],
      ],
      fill: '#5b6470',
      alpha: 0.95,
    })
  }

  // lane dividers
  let offset = -half
  for (let i = 0; i < ap.entryLanes.length; i++) {
    offset += ap.entryLanes[i].widthM
    if (i < ap.entryLanes.length - 1) {
      pushLine(mesh, {
        layer: 'MARKING',
        points: [
          [ux * (start + 3) + px * offset, uy * (start + 3) + py * offset],
          [ux * (end - 5) + px * offset, uy * (end - 5) + py * offset],
        ],
        stroke: THEME.marking,
        strokeWidth: 0.18,
        dashed: true,
      })
    }
  }

  // median strip
  const medL = -half + eW
  const medR = medL + med
  pushPoly(mesh, {
    layer: ap.median.style === 'greenBelt' ? 'ISLAND' : 'MARKING',
    points: [
      [ux * (start + 1) + px * medL, uy * (start + 1) + py * medL],
      [ux * (end - 2) + px * medL, uy * (end - 2) + py * medL],
      [ux * (end - 2) + px * medR, uy * (end - 2) + py * medR],
      [ux * (start + 1) + px * medR, uy * (start + 1) + py * medR],
    ],
    fill: ap.median.style === 'greenBelt' ? THEME.island : THEME.yellow,
    stroke: THEME.islandEdge,
    strokeWidth: 0.15,
  })

  // stop line
  pushLine(mesh, {
    layer: 'MARKING',
    points: [
      [ux * start + px * -half, uy * start + py * -half],
      [ux * start + px * half, uy * start + py * half],
    ],
    stroke: THEME.marking,
    strokeWidth: 0.45,
  })

  // crosswalk
  const cw = start - 3.2
  for (let i = -4; i <= 4; i++) {
    const o = (i / 4) * (half * 0.9)
    pushLine(mesh, {
      layer: 'MARKING',
      points: [
        [ux * (cw - 1.2) + px * o, uy * (cw - 1.2) + py * o],
        [ux * (cw + 1.2) + px * o, uy * (cw + 1.2) + py * o],
      ],
      stroke: THEME.crosswalk,
      strokeWidth: 0.55,
    })
  }

  // sidewalk bands
  if (ap.sidewalkWidthM > 0) {
    const sw = ap.sidewalkWidthM
    pushPoly(mesh, {
      layer: 'ROAD',
      points: [
        [ux * start + px * (-half - sw), uy * start + py * (-half - sw)],
        [ux * end + px * (-half - sw), uy * end + py * (-half - sw)],
        [ux * end + px * -half, uy * end + py * -half],
        [ux * start + px * -half, uy * start + py * -half],
      ],
      fill: THEME.sidewalk,
      alpha: 0.9,
    })
  }
  if (ap.bikeEnabled) {
    const bw = ap.bikeWidthM
    pushPoly(mesh, {
      layer: 'ROAD',
      points: [
        [ux * start + px * (half), uy * start + py * half],
        [ux * end + px * half, uy * end + py * half],
        [ux * end + px * (half + bw), uy * end + py * (half + bw)],
        [ux * start + px * (half + bw), uy * start + py * (half + bw)],
      ],
      fill: THEME.bike,
      alpha: 0.85,
    })
  }

  // right-turn channel island
  if (ap.rightTurn.enabled && ap.rightTurn.style !== 'none') {
    const r = ap.rightTurn.radiusM
    const island: [number, number][] = []
    const baseAng = degToRad(ap.bearingDeg)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const ang = baseAng + (Math.PI / 2) * t * 0.9
      island.push([
        ux * (core + 4) + Math.sin(ang) * r * 0.55 + px * (half + 2),
        uy * (core + 4) - Math.cos(ang) * r * 0.55 + py * (half + 2),
      ])
    }
    island.push([ux * (core + 10) + px * (half + 6), uy * (core + 10) + py * (half + 6)])
    pushPoly(mesh, {
      layer: 'ISLAND',
      points: island,
      fill: ap.rightTurn.style === 'solid' ? THEME.island : 'transparent',
      stroke: THEME.islandEdge,
      strokeWidth: 0.3,
    })
  }

  // movement arrows near stop line
  const arrowBase = start + 10
  let laneOff = -half
  for (const ln of ap.entryLanes) {
    const mid = laneOff + ln.widthM / 2
    const cx = ux * arrowBase + px * mid
    const cy = uy * arrowBase + py * mid
    drawArrow(mesh, cx, cy, ux, uy, ln.movements.join(''))
    laneOff += ln.widthM
  }

  // label
  pushLabel(mesh, {
    text: ap.name,
    at: [ux * (end - 8) + px * 0, uy * (end - 8) + py * 0],
    color: THEME.text,
    size: 3.6,
    align: 'center',
    meta: { approachId: ap.id },
  })
}

function drawArrow(mesh: Mesh, x: number, y: number, ux: number, uy: number, tag: string) {
  const len = 4.5
  const tipX = x - ux * len
  const tipY = y - uy * len
  pushLine(mesh, {
    layer: 'MARKING',
    points: [
      [x, y],
      [tipX, tipY],
    ],
    stroke: THEME.marking,
    strokeWidth: 0.35,
  })
  // arrow head
  const px = -uy
  const py = ux
  pushPoly(mesh, {
    layer: 'MARKING',
    points: [
      [tipX, tipY],
      [tipX + ux * 1.4 + px * 1.1, tipY + uy * 1.4 + py * 1.1],
      [tipX + ux * 1.4 - px * 1.1, tipY + uy * 1.4 - py * 1.1],
    ],
    fill: THEME.marking,
  })
  pushLabel(mesh, {
    text: tag || 'T',
    at: [x + ux * 2, y + uy * 2],
    color: '#e2e8f0',
    size: 2.2,
    align: 'center',
  })
}

export function meshAreaRoad(mesh: Mesh): number {
  // approximate by bbox area of ROAD polys sum of shoe lace
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
