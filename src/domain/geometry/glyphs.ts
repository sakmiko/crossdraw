/**
 * Reusable road-marking / channelization glyphs (fixed design size).
 * Place via local frame (origin, ux outbound from intersection, px left-of-ux).
 * Homology: widths from Approach lanes; no decorative shrink.
 */
import type { Mesh, Movement } from '../types'
import { pushLabel, pushLine, pushPoly } from './mesh'

export type Vec = [number, number]

export const GLYPH = {
  /** default design lane width (m) — actual width comes from data */
  designLaneW: 3.5,
  /** movement arrow body length along -ux (toward intersection) */
  arrowLen: 4.8,
  arrowHead: 1.5,
  arrowHalfW: 1.05,
  /** zebra */
  zebraDepth: 3.0,
  zebraPitch: 1.35,
  zebraBarW: 0.95,
  /** yield triangle */
  yieldH: 2.4,
  yieldHalf: 1.3,
} as const

export type Frame = {
  origin: Vec
  ux: Vec
  px: Vec
}

export function add(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1]]
}
export function mul(a: Vec, s: number): Vec {
  return [a[0] * s, a[1] * s]
}
export function sub(a: Vec, b: Vec): Vec {
  return [a[0] - b[0], a[1] - b[1]]
}

/** Point in world from local (along ux, along px) relative to frame.origin */
export function at(f: Frame, s: number, lat: number): Vec {
  return add(add(f.origin, mul(f.ux, s)), mul(f.px, lat))
}

export type ThemeLike = {
  marking: string
  yellow: string
  curb: string
  asphalt: string
  asphaltEdge: string
  island: string
  islandEdge: string
  crosswalk: string
  laneFill: string
  laneAlt: string
  sidewalk?: string
  bike?: string
}

/** Fixed-size movement arrow glyph at lane mid (base is near stop, tip toward intersection). */
export function placeMovementArrow(
  mesh: Mesh,
  f: Frame,
  baseS: number,
  midLat: number,
  movements: Movement[],
  theme: ThemeLike,
  variable = false,
) {
  const color = variable ? theme.yellow : theme.marking
  const base = at(f, baseS, midLat)
  // tip toward intersection = -ux
  const tip = at(f, baseS - GLYPH.arrowLen, midLat)
  pushLine(mesh, {
    layer: 'MARKING',
    points: [base, tip],
    stroke: color,
    strokeWidth: variable ? 0.42 : 0.35,
  })
  // head
  const headBase = at(f, baseS - GLYPH.arrowLen + GLYPH.arrowHead, midLat)
  pushPoly(mesh, {
    layer: 'MARKING',
    points: [
      tip,
      add(headBase, mul(f.px, GLYPH.arrowHalfW)),
      add(headBase, mul(f.px, -GLYPH.arrowHalfW)),
    ],
    fill: color,
  })
  // L/R hooks (standard pavement marking schematic)
  const hookS = baseS - GLYPH.arrowLen * 0.42
  const hook = at(f, hookS, midLat)
  if (movements.includes('L')) {
    const mid = add(hook, mul(f.px, -2.2))
    pushLine(mesh, {
      layer: 'MARKING',
      points: [hook, mid, add(mid, mul(f.ux, -1))],
      stroke: color,
      strokeWidth: 0.28,
    })
  }
  if (movements.includes('R')) {
    const mid = add(hook, mul(f.px, 2.2))
    pushLine(mesh, {
      layer: 'MARKING',
      points: [hook, mid, add(mid, mul(f.ux, -1))],
      stroke: color,
      strokeWidth: 0.28,
    })
  }
  if (movements.includes('U')) {
    const u0 = at(f, hookS, midLat)
    pushLine(mesh, {
      layer: 'MARKING',
      points: [u0, add(u0, mul(f.px, -1.6)), add(add(u0, mul(f.px, -1.6)), mul(f.ux, 1.2))],
      stroke: color,
      strokeWidth: 0.28,
    })
  }
  pushLabel(mesh, {
    text: variable ? `${movements.join('') || 'T'}·变` : movements.join('') || 'T',
    at: at(f, baseS + 2.2, midLat),
    color: variable ? theme.yellow : '#e2e8f0',
    size: 2.0,
    align: 'center',
  })
}

/**
 * Zebra crosswalk: bars elongated along ux, pitched along px (geometry-linework rule).
 * centerS = station of strip center along ux from frame.origin.
 */
export function placeZebra(
  mesh: Mesh,
  f: Frame,
  centerS: number,
  halfSpan: number,
  theme: ThemeLike,
  opts?: { depth?: number; pitch?: number },
) {
  const depth = opts?.depth ?? GLYPH.zebraDepth
  const pitch = opts?.pitch ?? GLYPH.zebraPitch
  if (halfSpan < 1.2) return
  const near = centerS - depth / 2
  const far = centerS + depth / 2
  // outline across road
  pushLine(mesh, {
    layer: 'MARKING',
    points: [at(f, near, -halfSpan), at(f, near, halfSpan)],
    stroke: theme.crosswalk,
    strokeWidth: 0.18,
    alpha: 0.7,
  })
  pushLine(mesh, {
    layer: 'MARKING',
    points: [at(f, far, -halfSpan), at(f, far, halfSpan)],
    stroke: theme.crosswalk,
    strokeWidth: 0.18,
    alpha: 0.7,
  })
  const n = Math.max(3, Math.floor((halfSpan * 2) / pitch))
  for (let i = 0; i < n; i++) {
    if (i % 2 === 1) continue
    const lat = -halfSpan + (i + 0.5) * ((halfSpan * 2) / n)
    pushLine(mesh, {
      layer: 'MARKING',
      points: [at(f, near, lat), at(f, far, lat)],
      stroke: theme.crosswalk,
      strokeWidth: pitch * 0.7,
      alpha: 0.95,
    })
  }
}


/** Double-bar stop line across carriageway (lat from -halfSpan..halfSpan). */
export function placeStopLine(
  mesh: Mesh,
  f: Frame,
  s: number,
  halfSpan: number,
  theme: ThemeLike,
  opts?: { double?: boolean },
) {
  const span = Math.max(1.2, halfSpan - 0.25)
  pushLine(mesh, {
    layer: 'MARKING',
    points: [at(f, s, -span), at(f, s, span)],
    stroke: theme.marking,
    strokeWidth: 0.65,
    alpha: 0.98,
  })
  if (opts?.double !== false) {
    pushLine(mesh, {
      layer: 'MARKING',
      points: [at(f, s + 0.7, -span), at(f, s + 0.7, span)],
      stroke: theme.marking,
      strokeWidth: 0.35,
      alpha: 0.95,
    })
  }
}

/** Yield / give-way triangle + dashed stop line on entry half. */
export function placeYield(
  mesh: Mesh,
  f: Frame,
  lineS: number,
  lat0: number,
  lat1: number,
  theme: ThemeLike,
) {
  const n = 8
  const pts: Vec[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push(at(f, lineS, lat0 + (lat1 - lat0) * t))
  }
  pushLine(mesh, {
    layer: 'MARKING',
    points: pts,
    stroke: theme.marking,
    strokeWidth: 0.42,
    dashed: true,
    alpha: 0.95,
  })
  const mid = (lat0 + lat1) / 2
  const tip = at(f, lineS + GLYPH.yieldH, mid)
  pushPoly(mesh, {
    layer: 'MARKING',
    points: [
      tip,
      at(f, lineS - 0.15, mid - GLYPH.yieldHalf),
      at(f, lineS - 0.15, mid + GLYPH.yieldHalf),
    ],
    fill: theme.marking,
    alpha: 0.9,
  })
}

/** Teardrop / elongated splitter island (not circular). nose toward -ux (intersection). */
export function placeTeardropSplitter(
  mesh: Mesh,
  f: Frame,
  noseS: number,
  tailS: number,
  halfW: number,
  theme: ThemeLike,
) {
  const hw = Math.max(0.9, halfW)
  const pts: Vec[] = [
    at(f, noseS, 0),
    at(f, noseS + (tailS - noseS) * 0.22, -hw * 0.55),
    at(f, (noseS + tailS) / 2, -hw),
    at(f, tailS, -hw * 0.85),
    at(f, tailS, hw * 0.85),
    at(f, (noseS + tailS) / 2, hw),
    at(f, noseS + (tailS - noseS) * 0.22, hw * 0.55),
  ]
  pushPoly(mesh, {
    layer: 'ISLAND',
    points: pts,
    fill: theme.island,
    stroke: theme.islandEdge,
    strokeWidth: 0.32,
    alpha: 0.95,
  })
}

/** Circular disk poly (island / ring asphalt). */
export function placeCirclePoly(
  mesh: Mesh,
  center: Vec,
  r: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
  steps = 72,
  layer: 'ROAD' | 'ISLAND' | 'MARKING' = 'ISLAND',
) {
  const pts: Vec[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    pts.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r])
  }
  pushPoly(mesh, { layer, points: pts, fill, stroke, strokeWidth })
}

export function placeCircleLine(
  mesh: Mesh,
  center: Vec,
  r: number,
  stroke: string,
  strokeWidth: number,
  dashed = false,
  steps = 80,
  alpha = 0.9,
) {
  const pts: Vec[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    pts.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r])
  }
  pushLine(mesh, {
    layer: 'MARKING',
    points: pts,
    stroke,
    strokeWidth,
    dashed,
    alpha,
  })
}


/** Free-right channel ribbon between outerR and midR along ang0→ang1 (CCW/CW via order). */
export function placeChannelRibbon(
  mesh: Mesh,
  center: Vec,
  outerR: number,
  midR: number,
  ang0: number,
  ang1: number,
  theme: ThemeLike,
  steps = 26,
) {
  const outer = circleArc(center, outerR, ang0, ang1, steps)
  const inner = circleArc(center, midR, ang1, ang0, Math.max(12, steps - 4))
  pushPoly(mesh, {
    layer: 'ROAD',
    points: [...outer, ...inner],
    fill: theme.laneFill,
    stroke: theme.asphaltEdge,
    strokeWidth: 0.25,
    alpha: 0.92,
  })
  pushLine(mesh, {
    layer: 'MARKING',
    points: circleArc(center, outerR, ang0, ang1, steps - 4),
    stroke: theme.marking,
    strokeWidth: 0.2,
  })
  pushLine(mesh, {
    layer: 'MARKING',
    points: circleArc(center, midR, ang0 + 0.02, ang1 - 0.02, steps - 6),
    stroke: theme.marking,
    strokeWidth: 0.18,
    dashed: true,
    alpha: 0.9,
  })
}

/** Channelization island (solid or painted hatch) between midR and innerR. */
export function placeChannelIslandArc(
  mesh: Mesh,
  center: Vec,
  midR: number,
  innerR: number,
  ang0: number,
  ang1: number,
  theme: ThemeLike,
  painted = false,
  steps = 24,
) {
  const outer = circleArc(center, midR, ang0, ang1, steps)
  const inner = circleArc(center, innerR, ang1, ang0, Math.max(12, steps - 4))
  pushPoly(mesh, {
    layer: 'ISLAND',
    points: [...outer, ...inner],
    fill: painted ? theme.yellow : theme.island,
    stroke: theme.islandEdge,
    strokeWidth: 0.4,
    alpha: painted ? 0.4 : 0.95,
  })
  if (painted) {
    for (const frac of [0.35, 0.55, 0.75]) {
      const rr = innerR + (midR - innerR) * frac
      pushLine(mesh, {
        layer: 'MARKING',
        points: circleArc(center, rr, ang0 + 0.08, ang1 - 0.08, 12),
        stroke: theme.yellow,
        strokeWidth: 0.15,
        alpha: 0.7,
      })
    }
  }
}

/** Circular safety / refuge island disc. */
export function placeSafetyDisc(
  mesh: Mesh,
  center: Vec,
  r: number,
  fill: string,
  theme: ThemeLike,
  alpha = 0.98,
  steps = 20,
) {
  placeCirclePoly(mesh, center, r, fill, theme.islandEdge, 0.35, steps, 'ISLAND')
  // curb ring
  placeCircleLine(mesh, center, r, theme.curb, 0.3, false, steps, 0.95)
}

function circleArc(center: Vec, r: number, a0: number, a1: number, steps: number): Vec[] {
  const pts: Vec[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = a0 + (a1 - a0) * t
    pts.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r])
  }
  return pts
}


/** Rectangular median / barrier strip between lat medL..medR, s0..s1. */
export function placeMedianStrip(
  mesh: Mesh,
  f: Frame,
  s0: number,
  s1: number,
  medL: number,
  medR: number,
  fill: string,
  theme: ThemeLike,
  opts?: { layer?: 'ISLAND' | 'MARKING'; doubleYellow?: boolean },
) {
  if (medR - medL < 0.15) return
  const layer = opts?.layer ?? 'ISLAND'
  pushPoly(mesh, {
    layer,
    points: [at(f, s0, medL), at(f, s1, medL), at(f, s1, medR), at(f, s0, medR)],
    fill,
    stroke: theme.islandEdge,
    strokeWidth: 0.15,
    alpha: 0.95,
  })
  if (opts?.doubleYellow) {
    const mid = (medL + medR) / 2
    pushLine(mesh, {
      layer: 'MARKING',
      points: [at(f, s0, mid - 0.15), at(f, s1, mid - 0.15)],
      stroke: theme.yellow,
      strokeWidth: 0.12,
    })
    pushLine(mesh, {
      layer: 'MARKING',
      points: [at(f, s0, mid + 0.15), at(f, s1, mid + 0.15)],
      stroke: theme.yellow,
      strokeWidth: 0.12,
    })
  }
}

/** Fish-belly median: wider near stop (s0), taper toward far (s2). */
export function placeFishBellyMedian(
  mesh: Mesh,
  f: Frame,
  s0: number,
  s1: number,
  s2: number,
  midLat: number,
  halfNear: number,
  halfFar: number,
  theme: ThemeLike,
) {
  pushPoly(mesh, {
    layer: 'ISLAND',
    points: [
      at(f, s0, midLat - halfNear),
      at(f, s1, midLat - halfNear * 0.85),
      at(f, s2, midLat - halfFar),
      at(f, s2, midLat + halfFar),
      at(f, s1, midLat + halfNear * 0.85),
      at(f, s0, midLat + halfNear),
    ],
    fill: theme.island,
    stroke: theme.islandEdge,
    strokeWidth: 0.2,
    alpha: 0.95,
  })
}


/** Ribbon polygon between two polylines (inner then outer along station). */
export function placeRibbonBetween(
  mesh: Mesh,
  inner: Vec[],
  outer: Vec[],
  fill: string,
  stroke: string,
  opts?: { alpha?: number; strokeWidth?: number; meta?: Record<string, string>; layer?: 'ROAD' | 'MARKING' | 'ISLAND' },
) {
  if (inner.length < 2 || outer.length < 2) return
  pushPoly(mesh, {
    layer: opts?.layer ?? 'ROAD',
    points: [...inner, ...outer.slice().reverse()],
    fill,
    stroke,
    strokeWidth: opts?.strokeWidth ?? 0.12,
    alpha: opts?.alpha ?? 0.96,
    meta: opts?.meta,
  })
}

/** Continuous curb edge stroke along a polyline. */
export function placeCurbStroke(
  mesh: Mesh,
  pts: Vec[],
  theme: ThemeLike,
  strokeWidth = 0.22,
  alpha = 0.95,
) {
  if (pts.length < 2) return
  pushLine(mesh, {
    layer: 'MARKING',
    points: pts,
    stroke: theme.curb,
    strokeWidth,
    alpha,
  })
}

/**
 * Auxiliary / frontage road ribbon outside main curb (gap near stop line).
 * Homology: auxRoad.widthM / offsetM / openNearM.
 */
export function placeAuxRoadRibbon(
  mesh: Mesh,
  f: Frame,
  s0: number,
  s1: number,
  latInner: number,
  latOuter: number,
  theme: ThemeLike,
  opts?: { fill?: string; alpha?: number; dashedCenter?: boolean },
) {
  if (s1 - s0 < 4) return
  const fill = opts?.fill ?? '#57534e'
  const alpha = opts?.alpha ?? 0.88
  const a0 = at(f, s0, latInner)
  const a1 = at(f, s1, latInner)
  const b1 = at(f, s1, latOuter)
  const b0 = at(f, s0, latOuter)
  placeRibbonBetween(mesh, [a0, a1], [b0, b1], fill, theme.asphaltEdge ?? theme.curb, {
    alpha,
    strokeWidth: 0.25,
    meta: { kind: 'aux-road' },
  })
  placeCurbStroke(mesh, [a0, a1], theme, 0.18, 0.85)
  placeCurbStroke(mesh, [b0, b1], theme, 0.16, 0.75)
  if (opts?.dashedCenter !== false) {
    const mid = (latInner + latOuter) / 2
    pushLine(mesh, {
      layer: 'MARKING',
      points: [at(f, s0, mid), at(f, s1, mid)],
      stroke: theme.marking,
      strokeWidth: 0.15,
      dashed: true,
      alpha: 0.7,
    })
  }
}


/** Rectangle lane strip between lat a..b and s0..s1 along frame. */
export function placeLaneStrip(
  mesh: Mesh,
  f: Frame,
  s0: number,
  s1: number,
  lat0: number,
  lat1: number,
  fill: string,
  alpha = 0.55,
  meta?: Record<string, string>,
) {
  pushPoly(mesh, {
    layer: 'ROAD',
    points: [at(f, s0, lat0), at(f, s1, lat0), at(f, s1, lat1), at(f, s0, lat1)],
    fill,
    alpha,
    meta,
  })
}
