/**
 * Movement-specific saturation flow adjustments (engineering factors).
 * Base sat flow × f_L / f_T / f_R — not full HCM methodology.
 */
import type { Approach, FlowScheme, Movement } from '../types'
import { convertVolumes } from '../flow/convert'

export const DEFAULT_SAT_FACTORS: Record<Movement, number> = {
  L: 0.95,
  T: 1.0,
  R: 0.85,
  U: 0.8,
}

export type MovementCapacity = {
  approachId: string
  approachName: string
  movement: Movement
  volume: number
  lanes: number
  satFlow: number
  capacity: number
  vc: number
}

export function movementSatFlow(base: number, m: Movement, factors = DEFAULT_SAT_FACTORS): number {
  return base * (factors[m] ?? 1)
}

export function computeMovementCapacities(
  approaches: Approach[],
  flow: FlowScheme,
  greenRatioByApproachMovement?: Map<string, number>,
): MovementCapacity[] {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const out: MovementCapacity[] = []
  for (const ap of approaches) {
    const peak = peaks.find((p) => p.approachId === ap.id)
    if (!peak) continue
    for (const m of ['L', 'T', 'R'] as Movement[]) {
      const v = peak.peak[m] ?? 0
      if (v <= 0) continue
      const lanes = Math.max(
        0.5,
        ap.entryLanes.filter((l) => l.movements.includes(m)).length ||
          (m === 'T' ? ap.entryLanes.length * 0.5 : 0.5),
      )
      const sat = movementSatFlow(flow.defaultSatFlow, m) * lanes
      const gr = greenRatioByApproachMovement?.get(`${ap.id}:${m}`) ?? 0.45
      const cap = sat * gr
      out.push({
        approachId: ap.id,
        approachName: ap.name,
        movement: m,
        volume: v,
        lanes,
        satFlow: sat,
        capacity: cap,
        vc: cap > 0 ? v / cap : 9,
      })
    }
  }
  return out
}

export function movementCapacityMarkdown(name: string, rows: MovementCapacity[]): string {
  return [
    `# ${name} · 转向饱和流/能力`,
    '',
    '| 进口 | 转向 | v | 车道 | s | c | v/c |',
    '|------|------|--:|-----:|--:|--:|----:|',
    ...rows.map(
      (r) =>
        `| ${r.approachName} | ${r.movement} | ${Math.round(r.volume)} | ${r.lanes.toFixed(1)} | ${Math.round(r.satFlow)} | ${Math.round(r.capacity)} | ${r.vc.toFixed(2)} |`,
    ),
  ].join('\n')
}
