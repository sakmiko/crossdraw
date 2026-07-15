/**
 * Multimodal (ped/bike) volume helpers — separate from motor TurnVolumes.
 */
import type { Approach, FlowScheme, MultimodalVolumes } from '../types'

export function getMultimodal(flow: FlowScheme, approachId: string): MultimodalVolumes {
  const m = flow.multimodal?.[approachId]
  return { ped: m?.ped ?? 0, bike: m?.bike ?? 0, other: m?.other }
}

export function sumMultimodal(flow: FlowScheme, approaches: Approach[]): { ped: number; bike: number } {
  let ped = 0
  let bike = 0
  for (const a of approaches) {
    const m = getMultimodal(flow, a.id)
    ped += m.ped
    bike += m.bike
  }
  return { ped, bike }
}

export function multimodalRows(flow: FlowScheme, approaches: Approach[]) {
  return approaches.map((a) => {
    const m = getMultimodal(flow, a.id)
    return { approachId: a.id, name: a.name, ped: m.ped, bike: m.bike, other: m.other ?? 0 }
  })
}
