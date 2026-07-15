/**
 * Geometric conflict-point diagram for signalized intersections.
 * Places approach entry ports by bearing; draws movement paths and
 * conflict markers where concurrent greens intersect (same rules as matrix).
 */
import type { Approach, Movement, Phase, SignalScheme } from '../types'
import {
  classifyPair,
  listMovementKeys,
  phaseActiveKeys,
  type MovementKey,
} from './conflictMatrix'

export type Vec2 = { x: number; y: number }

export type ConflictPoint = {
  id: string
  x: number
  y: number
  level: 'block' | 'warn'
  reason: string
  aKey: string
  bKey: string
  aLabel: string
  bLabel: string
  active: boolean
}

export type MovementPath = {
  key: string
  label: string
  movement: Movement
  bearingDeg: number
  points: Vec2[]
  active: boolean
}

export type ConflictDiagramModel = {
  approaches: { id: string; name: string; bearingDeg: number; port: Vec2 }[]
  paths: MovementPath[]
  points: ConflictPoint[]
  activeCount: number
  blockCount: number
  warnCount: number
  coreRadius: number
}

const DEG = Math.PI / 180

/** Screen y down: 0° north = -Y, 90° east = +X (same as channel mesh). */
export function bearingToUnit(bearingDeg: number): Vec2 {
  const r = bearingDeg * DEG
  return { x: Math.sin(r), y: -Math.cos(r) }
}

export function approachPort(bearingDeg: number, radius: number): Vec2 {
  const u = bearingToUnit(bearingDeg)
  return { x: u.x * radius, y: u.y * radius }
}

/**
 * Simplified vehicle path through intersection:
 * entry port → near-core control → exit port of destination leg.
 */
export function movementPathPoints(
  bearingDeg: number,
  movement: Movement,
  entryR: number,
  coreR: number,
): Vec2[] {
  const entry = approachPort(bearingDeg, entryR)
  const u = bearingToUnit(bearingDeg)
  // lateral for left/right curve
  const left = { x: -u.y, y: u.x }
  const midIn = { x: u.x * coreR * 0.55, y: u.y * coreR * 0.55 }

  if (movement === 'T') {
    const exitBear = (bearingDeg + 180) % 360
    const exit = approachPort(exitBear, entryR)
    return [entry, midIn, { x: -midIn.x * 0.2, y: -midIn.y * 0.2 }, exit]
  }
  if (movement === 'L') {
    const exitBear = (bearingDeg + 270) % 360 // left turn relative to approach
    const exit = approachPort(exitBear, entryR)
    const bend = {
      x: midIn.x + left.x * coreR * 0.45,
      y: midIn.y + left.y * coreR * 0.45,
    }
    return [entry, midIn, bend, exit]
  }
  // R
  const exitBear = (bearingDeg + 90) % 360
  const exit = approachPort(exitBear, entryR)
  const right = { x: u.y, y: -u.x }
  const bend = {
    x: midIn.x + right.x * coreR * 0.35,
    y: midIn.y + right.y * coreR * 0.35,
  }
  return [entry, { x: midIn.x * 0.7, y: midIn.y * 0.7 }, bend, exit]
}

function segIntersect(
  a1: Vec2,
  a2: Vec2,
  b1: Vec2,
  b2: Vec2,
): Vec2 | null {
  const dax = a2.x - a1.x
  const day = a2.y - a1.y
  const dbx = b2.x - b1.x
  const dby = b2.y - b1.y
  const den = dax * dby - day * dbx
  if (Math.abs(den) < 1e-9) return null
  const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / den
  const u = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / den
  if (t < 0.05 || t > 0.95 || u < 0.05 || u > 0.95) return null
  return { x: a1.x + t * dax, y: a1.y + t * day }
}

function pathIntersections(pa: Vec2[], pb: Vec2[]): Vec2[] {
  const hits: Vec2[] = []
  for (let i = 0; i < pa.length - 1; i++) {
    for (let j = 0; j < pb.length - 1; j++) {
      const p = segIntersect(pa[i], pa[i + 1], pb[j], pb[j + 1])
      if (p) hits.push(p)
    }
  }
  return hits
}

function keyOf(k: MovementKey): string {
  return `${k.approachId}:${k.movement}`
}

export function buildConflictDiagram(
  approaches: Approach[],
  signal: SignalScheme,
  phaseId?: string | null,
): ConflictDiagramModel {
  const entryR = 42
  const coreR = 14
  const phase =
    (phaseId ? signal.phases.find((p) => p.id === phaseId) : null) ?? signal.phases[0] ?? null
  const active = phase ? phaseActiveKeys(phase) : new Set<string>()

  const aps = approaches.map((a) => ({
    id: a.id,
    name: a.name,
    bearingDeg: a.bearingDeg,
    port: approachPort(a.bearingDeg, entryR),
  }))

  const keys = listMovementKeys(approaches)
  const paths: MovementPath[] = keys.map((k) => {
    const pts = movementPathPoints(k.bearingDeg, k.movement, entryR, coreR)
    return {
      key: keyOf(k),
      label: k.label,
      movement: k.movement,
      bearingDeg: k.bearingDeg,
      points: pts,
      active: active.has(keyOf(k)),
    }
  })
  const pathMap = new Map(paths.map((p) => [p.key, p]))

  const points: ConflictPoint[] = []
  let blockCount = 0
  let warnCount = 0

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i]
      const b = keys[j]
      const cell = classifyPair(a, b)
      if (cell.level !== 'block' && cell.level !== 'warn') continue
      if (cell.level === 'block') blockCount++
      else warnCount++

      const pa = pathMap.get(keyOf(a))!
      const pb = pathMap.get(keyOf(b))!
      const hits = pathIntersections(pa.points, pb.points)
      // fallback midpoint if geometry doesn't cross (e.g. opposing T in ideal parallel)
      const loci =
        hits.length > 0
          ? hits
          : [
              {
                x: (pa.points[1].x + pb.points[1].x) / 2,
                y: (pa.points[1].y + pb.points[1].y) / 2,
              },
            ]
      const bothActive = active.has(keyOf(a)) && active.has(keyOf(b))
      for (let hi = 0; hi < loci.length; hi++) {
        const loc = loci[hi]
        points.push({
          id: `${keyOf(a)}|${keyOf(b)}|${hi}`,
          x: loc.x,
          y: loc.y,
          level: cell.level,
          reason: cell.reason,
          aKey: keyOf(a),
          bKey: keyOf(b),
          aLabel: cell.aLabel,
          bLabel: cell.bLabel,
          active: bothActive,
        })
      }
    }
  }

  return {
    approaches: aps,
    paths,
    points,
    activeCount: points.filter((p) => p.active).length,
    blockCount,
    warnCount,
    coreRadius: coreR,
  }
}

export function conflictDiagramSvg(
  model: ConflictDiagramModel,
  opts: { width?: number; height?: number; title?: string } = {},
): string {
  const width = opts.width ?? 420
  const height = opts.height ?? 360
  const cx = width / 2
  const cy = height / 2 + 6
  const scale = Math.min(width, height) / 100

  const tx = (p: Vec2) => cx + p.x * scale
  const ty = (p: Vec2) => cy + p.y * scale

  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // core ring
  let body = `<circle cx="${cx}" cy="${cy}" r="${model.coreRadius * scale}" fill="none" stroke="#334155" stroke-width="1" stroke-dasharray="3 3"/>`
  body += `<circle cx="${cx}" cy="${cy}" r="3" fill="#64748b"/>`

  // approach stubs + labels
  for (const ap of model.approaches) {
    const p0 = { x: ap.port.x * 0.72, y: ap.port.y * 0.72 }
    body += `<line x1="${tx(p0)}" y1="${ty(p0)}" x2="${tx(ap.port)}" y2="${ty(ap.port)}" stroke="#475569" stroke-width="6" stroke-linecap="round"/>`
    const lab = { x: ap.port.x * 1.12, y: ap.port.y * 1.12 }
    body += `<text x="${tx(lab)}" y="${ty(lab)}" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="10">${escape(ap.name.replace('进口', ''))}</text>`
  }

  // paths
  for (const path of model.paths) {
    const d = path.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx(p).toFixed(1)},${ty(p).toFixed(1)}`).join(' ')
    const col =
      path.movement === 'L' ? '#22d3ee' : path.movement === 'R' ? '#a78bfa' : '#60a5fa'
    const op = path.active ? 0.95 : 0.22
    const sw = path.active ? 2.2 : 1.1
    body += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`
  }

  // conflict points — draw inactive first, active on top
  const sorted = [...model.points].sort((a, b) => Number(a.active) - Number(b.active))
  for (const pt of sorted) {
    const fill = pt.level === 'block' ? '#e85d5d' : '#e5a54b'
    const r = pt.active ? 5.5 : 3.2
    const op = pt.active ? 1 : 0.35
    body += `<circle cx="${tx(pt)}" cy="${ty(pt)}" r="${r}" fill="${fill}" opacity="${op}" stroke="${pt.active ? '#f8fafc' : 'none'}" stroke-width="1.2"/>`
    if (pt.active) {
      body += `<text x="${tx(pt)}" y="${ty(pt) - 8}" text-anchor="middle" fill="#f8fafc" font-size="8" font-weight="700">!</text>`
    }
  }

  const title = opts.title ?? '冲突点示意图'
  const sub = `当前相位相悖 ${model.activeCount} · 全局禁止 ${model.blockCount} · 警告 ${model.warnCount}`

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
  <rect width="100%" height="100%" fill="#0a1020"/>
  <text x="10" y="16" fill="#8494ab" font-size="11" font-weight="700">${escape(title)}</text>
  <text x="10" y="30" fill="#64748b" font-size="9">${escape(sub)}</text>
  <text x="${width - 10}" y="16" text-anchor="end" fill="#475569" font-size="8">亮线=当前放行 · 亮点=同时放行冲突</text>
  ${body}
  <g transform="translate(10,${height - 28})">
    <circle cx="4" cy="4" r="4" fill="#e85d5d"/><text x="12" y="7" fill="#94a3b8" font-size="9">禁止</text>
    <circle cx="54" cy="4" r="4" fill="#e5a54b"/><text x="62" y="7" fill="#94a3b8" font-size="9">警告</text>
    <line x1="100" y1="4" x2="118" y2="4" stroke="#60a5fa" stroke-width="2"/><text x="122" y="7" fill="#94a3b8" font-size="9">T</text>
    <line x1="140" y1="4" x2="158" y2="4" stroke="#22d3ee" stroke-width="2"/><text x="162" y="7" fill="#94a3b8" font-size="9">L</text>
    <line x1="180" y1="4" x2="198" y2="4" stroke="#a78bfa" stroke-width="2"/><text x="202" y="7" fill="#94a3b8" font-size="9">R</text>
  </g>
</svg>`
}
