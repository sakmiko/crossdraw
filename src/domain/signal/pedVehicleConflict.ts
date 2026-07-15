/**
 * Pedestrian–vehicle concurrent conflict checks.
 * Crosswalk is modeled on the approach stop-line face; vehicles that turn
 * across or run through that face while ped is WALK are flagged.
 */
import { newId } from '@/shared/id'
import type { Approach, Issue, Movement, Phase, SignalScheme } from '../types'
import { pedCrossingsOf } from './pedestrian'

function isOpposing(b1: number, b2: number): boolean {
  const d = Math.abs(((b1 - b2) % 360 + 360) % 360)
  return d > 150 && d < 210
}

function isAdjacent(b1: number, b2: number): boolean {
  const d = Math.min(Math.abs(b1 - b2) % 360, 360 - (Math.abs(b1 - b2) % 360))
  return d > 60 && d < 120
}

export type PedVehHit = {
  phaseId: string
  phaseName: string
  pedApproachId: string
  pedApproachName: string
  vehicleApproachId: string
  vehicleApproachName: string
  movement: Movement
  level: 'warn' | 'block'
  reason: string
  exclusivePed: boolean
}

/**
 * For a pedestrian face on approach P:
 * - Right turn from P crosses its own near-side crosswalk (common RTOR conflict)
 * - Through from adjacent approach that ends at P's exit may skim crosswalk (warn)
 * - Left from opposing approach crosses far-side pedestrian of P (protected-left issue)
 * exclusive ped elevates matching vehicle conflicts to block.
 */
export function detectPedVehicleConflicts(
  phases: Phase[],
  approaches: Approach[],
): { issues: Issue[]; hits: PedVehHit[] } {
  const byId = new Map(approaches.map((a) => [a.id, a]))
  const issues: Issue[] = []
  const hits: PedVehHit[] = []

  for (const ph of phases) {
    const peds = pedCrossingsOf(ph)
    if (!peds.length) continue

    const veh: { ap: Approach; mov: Movement }[] = []
    for (const [apId, movs] of Object.entries(ph.releases)) {
      const ap = byId.get(apId)
      if (!ap) continue
      for (const m of movs) veh.push({ ap, mov: m })
    }

    for (const ped of peds) {
      const pedAp = byId.get(ped.approachId)
      if (!pedAp) continue
      const exclusive = !!ped.exclusive

      for (const v of veh) {
        let level: 'warn' | 'block' | null = null
        let reason = ''

        // 1) same approach right turn vs near-side crosswalk
        if (v.ap.id === pedAp.id && v.mov === 'R') {
          level = exclusive ? 'block' : 'warn'
          reason = '本进口右转穿越人行横道'
        }

        // 2) opposing left vs far-side / receiving leg ped
        if (isOpposing(v.ap.bearingDeg, pedAp.bearingDeg) && v.mov === 'L') {
          level = exclusive ? 'block' : 'warn'
          reason = '对向左转与行人过街冲突'
        }

        // 3) adjacent through into the ped face (vehicles leaving toward ped approach)
        // vehicle on adjacent leg going T typically crosses near corner of ped face
        if (isAdjacent(v.ap.bearingDeg, pedAp.bearingDeg) && v.mov === 'T') {
          // weaker — only warn unless exclusive
          level = exclusive ? 'block' : 'warn'
          reason = '相邻进口直行逼近人行横道'
        }

        // 4) adjacent right turn into ped face
        if (isAdjacent(v.ap.bearingDeg, pedAp.bearingDeg) && v.mov === 'R') {
          level = exclusive ? 'block' : 'warn'
          reason = '相邻进口右转切入人行横道'
        }

        if (!level) continue

        hits.push({
          phaseId: ph.id,
          phaseName: ph.name,
          pedApproachId: pedAp.id,
          pedApproachName: pedAp.name,
          vehicleApproachId: v.ap.id,
          vehicleApproachName: v.ap.name,
          movement: v.mov,
          level,
          reason,
          exclusivePed: exclusive,
        })

        issues.push({
          id: newId(),
          level,
          code: exclusive ? 'PED_VEH_EXCLUSIVE_CONFLICT' : 'PED_VEH_CONFLICT',
          message: `相位「${ph.name}」行人(${pedAp.name.replace('进口', '')}) × ${v.ap.name.replace('进口', '')}${v.mov}：${reason}`,
          path: `/phases/${ph.id}/pedestrian`,
        })
      }
    }
  }

  return { issues, hits }
}

export function detectSignalPedVehicleIssues(signal: SignalScheme, approaches: Approach[]): Issue[] {
  return detectPedVehicleConflicts(signal.phases, approaches).issues
}

export function pedVehicleSummary(hits: PedVehHit[]): string {
  if (!hits.length) return '人车无冲突 ✓'
  const blocks = hits.filter((h) => h.level === 'block').length
  const warns = hits.filter((h) => h.level === 'warn').length
  if (blocks) return `人车冲突 禁止${blocks}·警告${warns}`
  return `人车冲突警告 ${warns}`
}
