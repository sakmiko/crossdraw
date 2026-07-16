/**
 * Dual-ring barrier critical-flow ratio Y (engineering NEMA-style).
 *
 * For each barrier stage, concurrent rings run together: critical y of a stage
 * is max(y of phases on ring1 in stage, y of phases on ring2 in stage) summed
 * per ring then max — i.e. sum of critical y_i on each ring within the barrier,
 * then stage Y = max(ring1 Y, ring2 Y). Total Y = sum over barriers.
 *
 * Not a full NEMA dual-entry concurrency / barrier-transfer optimizer.
 */
import type { Approach, FlowScheme, Phase, SignalScheme } from '../types'
import { convertVolumes } from '../flow/convert'
import { buildDualRingStages, isDualRingEnabled, phaseDuration } from '../signal/dualRing'

export type BarrierCriticalY = {
  barrierIndex: number
  ring1Y: number
  ring2Y: number
  stageY: number
  ring1Phases: { id: string; name: string; y: number }[]
  ring2Phases: { id: string; name: string; y: number }[]
}

export type DualRingCriticalFlow = {
  enabled: boolean
  barriers: BarrierCriticalY[]
  /** sum of stageY across barriers — dual-ring critical Y */
  Y: number
  /** sequential sum of all main-phase y (legacy single-ring) */
  sequentialY: number
  notes: string[]
}

function phaseCriticalY(
  approaches: Approach[],
  flow: FlowScheme,
  ph: Phase,
): { y: number; volume: number } {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  let yMax = 0
  let vAt = 0
  for (const ap of approaches) {
    const rel = ph.releases[ap.id] ?? []
    const peak = peaks.find((p) => p.approachId === ap.id)
    if (!peak || !rel.length) continue
    let v = 0
    for (const m of rel) v += peak.peak[m as 'L' | 'T' | 'R' | 'U'] ?? 0
    const lanes = Math.max(
      1,
      ap.entryLanes.filter((l) => rel.some((m) => l.movements.includes(m))).length ||
        ap.entryLanes.length,
    )
    const y = v / (flow.defaultSatFlow * lanes)
    if (y > yMax) {
      yMax = y
      vAt = v
    }
  }
  return { y: yMax, volume: vAt }
}

export function computeDualRingCriticalFlow(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): DualRingCriticalFlow {
  const notes: string[] = []
  const main = signal.phases.filter((p) => !p.isOverlap)
  let sequentialY = 0
  for (const ph of main) {
    sequentialY += phaseCriticalY(approaches, flow, ph).y
  }

  if (!isDualRingEnabled(signal)) {
    return {
      enabled: false,
      barriers: [],
      Y: sequentialY || 0.2,
      sequentialY,
      notes: ['双环未启用 · Y 按单环主相位顺序累加'],
    }
  }

  const stages = buildDualRingStages(signal)
  const barriers: BarrierCriticalY[] = stages.map((st) => {
    const ring1Phases = st.ring1.map((p) => {
      const { y } = phaseCriticalY(approaches, flow, p)
      return { id: p.id, name: p.name, y }
    })
    const ring2Phases = st.ring2.map((p) => {
      const { y } = phaseCriticalY(approaches, flow, p)
      return { id: p.id, name: p.name, y }
    })
    const ring1Y = ring1Phases.reduce((s, p) => s + p.y, 0)
    const ring2Y = ring2Phases.reduce((s, p) => s + p.y, 0)
    const stageY = Math.max(ring1Y, ring2Y)
    return {
      barrierIndex: st.barrierIndex,
      ring1Y,
      ring2Y,
      stageY,
      ring1Phases,
      ring2Phases,
    }
  })

  const Y = barriers.reduce((s, b) => s + b.stageY, 0) || 0.2
  notes.push(
    `双环关键 Y=${Y.toFixed(3)}（各屏障 max(Σy_R1, Σy_R2) 之和）· 单环累加 Y_seq=${sequentialY.toFixed(3)}`,
  )
  for (const b of barriers) {
    notes.push(
      `  B${b.barrierIndex}: Y1=${b.ring1Y.toFixed(3)} Y2=${b.ring2Y.toFixed(3)} → Ys=${b.stageY.toFixed(3)}`,
    )
  }
  if (Y + 1e-6 < sequentialY) {
    notes.push(`双环并发使关键 Y 低于单环累加约 ${(((sequentialY - Y) / Math.max(1e-6, sequentialY)) * 100).toFixed(0)}%`)
  }

  return { enabled: true, barriers, Y, sequentialY, notes }
}

/**
 * Allocate effective green within dual-ring constraints for a fixed cycle.
 * Per barrier: stage time share ∝ stageY; within ring, split by phase y.
 * Returns greens for all ring-assigned main phases.
 */
export function allocateDualRingGreens(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  cycle: number,
  L: number,
  minGreen: number,
): { phaseId: string; greenSec: number }[] {
  const crit = computeDualRingCriticalFlow(approaches, flow, signal)
  const stages = buildDualRingStages(signal)
  const Y = Math.max(0.05, Math.min(0.95, crit.Y))
  const yellowAll = stages.reduce((s, st) => {
    // use max ring clearance as stage clearance proxy
    const y1 = st.ring1.reduce((a, p) => a + (p.yellowSec || 3) + (p.allRedSec || 2), 0)
    const y2 = st.ring2.reduce((a, p) => a + (p.yellowSec || 3) + (p.allRedSec || 2), 0)
    return s + Math.max(y1, y2, 0)
  }, 0)
  const effective = Math.max(stages.length * minGreen * 2, cycle - Math.max(L, yellowAll * 0.5))
  const out: { phaseId: string; greenSec: number }[] = []

  for (const st of stages) {
    const b = crit.barriers.find((x) => x.barrierIndex === st.barrierIndex)
    const stageY = b?.stageY || 0.01
    const stageEff = Math.max(minGreen, (effective * stageY) / Y)
    for (const which of ['ring1', 'ring2'] as const) {
      const phases = which === 'ring1' ? st.ring1 : st.ring2
      const yList = (which === 'ring1' ? b?.ring1Phases : b?.ring2Phases) ?? []
      const sumY = yList.reduce((s, p) => s + p.y, 0) || phases.length
      // ring duration target = stageEff (concurrent); split among phases on ring
      let allocated = 0
      phases.forEach((p, i) => {
        const yi = yList.find((x) => x.id === p.id)?.y ?? 1 / phases.length
        let g =
          i === phases.length - 1
            ? Math.max(minGreen, stageEff - allocated - ((p.yellowSec || 3) + (p.allRedSec || 2)) * 0)
            : Math.max(minGreen, Math.round((stageEff * yi) / sumY))
        // subtract y+ar from green budget roughly
        const clear = (p.yellowSec || 3) + (p.allRedSec || 2)
        // g is green only; stageEff is green+clear proxy — keep simple: g = share of stageEff
        g = Math.max(minGreen, Math.round((stageEff * yi) / sumY))
        allocated += g
        out.push({ phaseId: p.id, greenSec: g })
        void clear
      })
    }
  }

  // unassigned main phases keep min
  for (const p of signal.phases) {
    if (p.isOverlap) continue
    if (!out.some((g) => g.phaseId === p.id)) {
      out.push({ phaseId: p.id, greenSec: Math.max(minGreen, p.greenSec) })
    }
  }
  return out
}

export function dualRingCriticalSummary(c: DualRingCriticalFlow): string {
  if (!c.enabled) return `单环 Y=${c.sequentialY.toFixed(3)}`
  return `双环 Y=${c.Y.toFixed(3)} (seq ${c.sequentialY.toFixed(3)}) · B×${c.barriers.length}`
}

/** Duration-weighted note helper for charts */
export function barrierDurationTable(signal: SignalScheme): { barrier: number; r1: number; r2: number; stage: number }[] {
  return buildDualRingStages(signal).map((st) => ({
    barrier: st.barrierIndex,
    r1: st.ring1SumSec,
    r2: st.ring2SumSec,
    stage: st.stageSec,
  }))
}

export function totalPhaseDuration(phases: Phase[]): number {
  return phases.reduce((s, p) => s + phaseDuration(p), 0)
}
