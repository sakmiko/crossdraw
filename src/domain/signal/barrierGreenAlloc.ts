/**
 * Allocate dual-ring greens proportional to barrier critical flow Y.
 * Engineering proxy — not full NEMA barrier-transfer optimizer.
 */
import type { Approach, FlowScheme, Phase, SignalScheme } from '../types'
import {
  balanceBarrierRings,
  buildDualRingStages,
  isDualRingEnabled,
  phaseDuration,
} from './dualRing'
import { computeDualRingCriticalFlow } from './barrierCritical'

export type BarrierGreenPlan = {
  barrierIndex: number
  stageSec: number
  ring1GreenShare: number
  ring2GreenShare: number
  notes: string[]
}

/**
 * Scale each main phase green so that within each barrier stage, greens track
 * relative y, while stage duration targets C * (stageY / Y) when Y>0.
 */
export function allocateGreensByBarrierCriticalY(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): { signal: SignalScheme; plan: BarrierGreenPlan[]; notes: string[] } {
  const notes: string[] = []
  if (!isDualRingEnabled(signal)) {
    return { signal, plan: [], notes: ['双环未启用'] }
  }
  const crit = computeDualRingCriticalFlow(approaches, flow, signal)
  const C = Math.max(40, signal.cycleSec)
  const Y = Math.max(1e-6, crit.Y)
  const lostPerBarrier = 4 // Y+AR proxy per barrier stage
  const stages = buildDualRingStages(signal)
  if (!stages.length) return { signal, plan: [], notes: ['无 barrier 阶段'] }

  const plan: BarrierGreenPlan[] = []
  const greenMap = new Map<string, number>()

  for (const st of stages) {
    const bCrit = crit.barriers.find((b) => b.barrierIndex === st.barrierIndex)
    const stageY = bCrit?.stageY ?? 0.01
    const stageBudget = Math.max(8, (C * stageY) / Y)
    const effectiveGreen = Math.max(4, stageBudget - lostPerBarrier)
    plan.push({
      barrierIndex: st.barrierIndex,
      stageSec: stageBudget,
      ring1GreenShare: bCrit?.ring1Y ?? 0,
      ring2GreenShare: bCrit?.ring2Y ?? 0,
      notes: [`B${st.barrierIndex} Y=${stageY.toFixed(3)} → 阶段≈${stageBudget.toFixed(1)}s`],
    })

    const assignRing = (phases: Phase[], ringY: number) => {
      if (!phases.length) return
      const weights = phases.map((ph) => {
        const row = (bCrit?.ring1Phases ?? []).concat(bCrit?.ring2Phases ?? []).find((p) => p.id === ph.id)
        return Math.max(0.05, row?.y ?? 0.05)
      })
      const sumW = weights.reduce((a, b) => a + b, 0) || 1
      // each phase on a ring runs sequentially within the barrier; share effectiveGreen by y
      phases.forEach((ph, i) => {
        const g = (effectiveGreen * weights[i]) / sumW
        greenMap.set(ph.id, Math.max(4, Math.round(g * 10) / 10))
      })
      void ringY
    }
    assignRing(st.ring1, bCrit?.ring1Y ?? 0)
    assignRing(st.ring2, bCrit?.ring2Y ?? 0)
  }

  let next: SignalScheme = {
    ...signal,
    phases: signal.phases.map((ph) => {
      if (ph.isOverlap) return ph
      const g = greenMap.get(ph.id)
      if (g == null) return ph
      return { ...ph, greenSec: g }
    }),
  }
  next = { ...next, phases: balanceBarrierRings(next) }
  // set C to stage sum if free
  const stageSum = buildDualRingStages(next).reduce((s, st) => s + st.stageSec, 0)
  next = { ...next, cycleSec: Math.round(stageSum) }
  notes.push(...plan.flatMap((p) => p.notes))
  notes.push(`屏障关键Y分配后 C=${next.cycleSec}s（工程示意）`)
  notes.push(...crit.notes.slice(0, 2))
  return { signal: next, plan, notes }
}

export function dualRingGreenPlanMarkdown(name: string, plan: BarrierGreenPlan[], notes: string[]): string {
  return [
    `# ${name} · 双环屏障绿信分配`,
    '',
    ...notes.map((n) => `- ${n}`),
    '',
    '| B | 阶段s | R1 Y | R2 Y |',
    '|---|------:|-----:|-----:|',
    ...plan.map(
      (p) =>
        `| ${p.barrierIndex} | ${p.stageSec.toFixed(1)} | ${p.ring1GreenShare.toFixed(3)} | ${p.ring2GreenShare.toFixed(3)} |`,
    ),
  ].join('\n')
}

/** Sum of phase durations for diagnostics. */
export function mainPhasesGreenSum(signal: SignalScheme): number {
  return signal.phases.filter((p) => !p.isOverlap).reduce((s, p) => s + phaseDuration(p), 0)
}
