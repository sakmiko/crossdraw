/**
 * Dual-ring barrier (NEMA-style engineering model).
 *
 * Not a full NEMA controller / dual-entry concurrency engine.
 * Models two concurrent rings of sequential phases with optional barriers
 * that force both rings to end a stage at the same time (sum of stage intervals = C).
 *
 * Closure rule when dual-ring enabled:
 *   Σ(stage duration) ≈ cycleSec
 * where stage duration = max(ring1 interval sum in stage, ring2 interval sum in stage).
 * Phases without ring assignment fall back to single-ring sequential sum.
 */
import type { Phase, SignalScheme } from '../types'

export type RingId = 1 | 2

export type DualRingStage = {
  barrierIndex: number
  ring1: Phase[]
  ring2: Phase[]
  ring1SumSec: number
  ring2SumSec: number
  /** max of ring sums — time the barrier holds both rings */
  stageSec: number
}

export type DualRingAlignment = {
  enabled: boolean
  cycleSec: number
  stages: DualRingStage[]
  stageSumSec: number
  balanceSec: number
  closed: boolean
  unassigned: Phase[]
  ring1Count: number
  ring2Count: number
  notes: string[]
}

function num(v: number): number {
  return Number.isFinite(v) ? v : 0
}

export function phaseDuration(p: Phase): number {
  return num(p.greenSec) + num(p.yellowSec) + num(p.allRedSec)
}

export function isDualRingEnabled(signal: SignalScheme): boolean {
  return !!signal.dualRing?.enabled
}

/** Phases that count on dual rings (not pure overlap-only unless ring assigned). */
export function ringPhases(signal: SignalScheme): Phase[] {
  return signal.phases.filter((p) => {
    if (p.ring === 1 || p.ring === 2) return true
    // unassigned overlaps stay off rings
    return !p.isOverlap
  })
}

/**
 * Build stages grouped by barrierIndex (default 0).
 * Within a stage, ring1 and ring2 run "concurrently" — stage time = max(sums).
 */
export function buildDualRingStages(signal: SignalScheme): DualRingStage[] {
  const map = new Map<number, { r1: Phase[]; r2: Phase[] }>()
  for (const p of signal.phases) {
    if (p.isOverlap && p.ring == null) continue
    if (p.ring !== 1 && p.ring !== 2) continue
    const b = p.barrierIndex ?? 0
    if (!map.has(b)) map.set(b, { r1: [], r2: [] })
    const bucket = map.get(b)!
    if (p.ring === 1) bucket.r1.push(p)
    else bucket.r2.push(p)
  }
  const barriers = Array.from(map.keys()).sort((a, b) => a - b)
  return barriers.map((barrierIndex) => {
    const { r1, r2 } = map.get(barrierIndex)!
    const ring1SumSec = r1.reduce((s, p) => s + phaseDuration(p), 0)
    const ring2SumSec = r2.reduce((s, p) => s + phaseDuration(p), 0)
    return {
      barrierIndex,
      ring1: r1,
      ring2: r2,
      ring1SumSec,
      ring2SumSec,
      stageSec: Math.max(ring1SumSec, ring2SumSec),
    }
  })
}

export function buildDualRingAlignment(signal: SignalScheme): DualRingAlignment {
  const enabled = isDualRingEnabled(signal)
  const cycleSec = Math.max(1, num(signal.cycleSec))
  const notes: string[] = []
  if (!enabled) {
    return {
      enabled: false,
      cycleSec,
      stages: [],
      stageSumSec: 0,
      balanceSec: 0,
      closed: true,
      unassigned: [],
      ring1Count: 0,
      ring2Count: 0,
      notes: ['双环未启用 · 使用单环主相位顺序闭合'],
    }
  }

  const stages = buildDualRingStages(signal)
  const stageSumSec = stages.reduce((s, st) => s + st.stageSec, 0)
  const balanceSec = Math.round((stageSumSec - cycleSec) * 10) / 10
  const closed = Math.abs(balanceSec) < 0.15
  const unassigned = signal.phases.filter(
    (p) => !p.isOverlap && p.ring !== 1 && p.ring !== 2,
  )
  const ring1Count = signal.phases.filter((p) => p.ring === 1).length
  const ring2Count = signal.phases.filter((p) => p.ring === 2).length

  if (unassigned.length) {
    notes.push(`${unassigned.length} 个主相位未分配环（不参与双环闭合）`)
  }
  if (!stages.length) notes.push('尚无带 ring 的相位')
  if (!closed) {
    notes.push(
      balanceSec > 0
        ? `双环阶段和比 C 长 ${balanceSec}s`
        : `双环阶段和比 C 短 ${Math.abs(balanceSec)}s`,
    )
  } else {
    notes.push('双环阶段和 ≈ C · 闭合')
  }
  for (const st of stages) {
    if (Math.abs(st.ring1SumSec - st.ring2SumSec) > 0.15) {
      notes.push(
        `Barrier ${st.barrierIndex}: R1=${st.ring1SumSec.toFixed(1)}s R2=${st.ring2SumSec.toFixed(1)}s → 阶段 ${st.stageSec.toFixed(1)}s（取 max）`,
      )
    }
  }

  return {
    enabled: true,
    cycleSec,
    stages,
    stageSumSec,
    balanceSec,
    closed,
    unassigned,
    ring1Count,
    ring2Count,
    notes,
  }
}

/**
 * Apply a standard 4-phase dual-ring split on existing phases (best-effort).
 * Assigns first half of main phases to ring1, rest to ring2, single barrier 0.
 * If fewer than 2 main phases, only tags ring1.
 */
export function autoAssignDualRings(signal: SignalScheme): Phase[] {
  const main = signal.phases.filter((p) => !p.isOverlap)
  const mid = Math.ceil(main.length / 2) || 1
  const mainIds = new Set(main.map((p) => p.id))
  return signal.phases.map((p) => {
    if (!mainIds.has(p.id)) {
      // overlaps: leave ring unset (draw as overlay)
      return { ...p, ring: undefined, barrierIndex: undefined }
    }
    const idx = main.findIndex((m) => m.id === p.id)
    const ring: RingId = idx < mid ? 1 : 2
    return { ...p, ring, barrierIndex: 0 }
  })
}

/** Ensure dualRing flag + optional auto-assign when enabling. */
export function enableDualRing(signal: SignalScheme, autoAssign = true): SignalScheme {
  const phases = autoAssign ? autoAssignDualRings(signal) : signal.phases
  return {
    ...signal,
    dualRing: { enabled: true, label: signal.dualRing?.label ?? '双环' },
    phases,
  }
}

export function disableDualRing(signal: SignalScheme): SignalScheme {
  return {
    ...signal,
    dualRing: { enabled: false, label: signal.dualRing?.label },
    phases: signal.phases.map((p) => ({
      ...p,
      ring: undefined,
      barrierIndex: undefined,
    })),
  }
}

export function dualRingSummaryText(a: DualRingAlignment): string {
  if (!a.enabled) return '单环顺序'
  const tag = a.closed ? '闭合✓' : `差${a.balanceSec > 0 ? '+' : ''}${a.balanceSec}s`
  return `双环 R1×${a.ring1Count}/R2×${a.ring2Count} · 阶段Σ=${a.stageSumSec.toFixed(1)}s · ${tag}`
}
