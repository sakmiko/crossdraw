/**
 * Progressive offset planner: o_i = mod( travel_time_from_ref , C )
 */
import type { BandCorridor, BandNodeEditable } from '../types'

export function progressiveOffsets(
  corridor: BandCorridor,
  opts: { reverse?: boolean } = {},
): BandNodeEditable[] {
  const nodes = [...corridor.nodes].sort((a, b) => a.distanceM - b.distanceM)
  if (nodes.length < 2) return corridor.nodes
  const C = Math.max(1, nodes[0].cycleSec || 90)
  const v = Math.max(1, (corridor.speedKmh * 1000) / 3600)
  const ref = opts.reverse ? nodes[nodes.length - 1] : nodes[0]
  const next = nodes.map((n) => {
    if (n.lockedOffset) return n
    const dist = Math.abs(n.distanceM - ref.distanceM)
    const o = ((dist / v) % C + C) % C
    return { ...n, offsetSec: Math.round(o * 10) / 10 }
  })
  const map = new Map(next.map((n) => [n.id, n]))
  return corridor.nodes.map((n) => map.get(n.id) ?? n)
}

export function applyProgressiveOffsets(corridor: BandCorridor, reverse = false): BandCorridor {
  return { ...corridor, nodes: progressiveOffsets(corridor, { reverse }) }
}
