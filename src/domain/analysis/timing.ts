import type { Approach, FlowScheme, Phase, SignalScheme, WebsterInput, WebsterResult } from '../types'
import { convertVolumes } from '../flow/convert'
import { websterTiming as websterCore } from './index'
import {
  balanceBarrierRings,
  buildDualRingAlignment,
  cycleFromDualRing,
  isDualRingEnabled,
} from '../signal/dualRing'
import {
  allocateDualRingGreens,
  computeDualRingCriticalFlow,
} from '../signal/barrierCritical'

/**
 * Timing optimization methods (选择算法):
 * - webster: Webster (1958) C0=(1.5L+5)/(1-Y/X) 最优周期 + 按 y 分绿
 * - equal: 等绿灯（简单实用）
 * - hcm-delay: 在候选周期上最小化延误（HCM 风格延误代理）
 * - fixed-cycle: 固定用户周期，仅按 y 分绿
 *
 * Refs: Webster 1958; HCM signalized delay form (engineering approximation).
 */
export type TimingMethod = 'webster' | 'equal' | 'hcm-delay' | 'fixed-cycle'

export type TimingOptimizeOptions = Partial<WebsterInput> & {
  method?: TimingMethod
  /** required when method is fixed-cycle; also used as optional clamp for others */
  fixedCycle?: number
  minGreen?: number
  maxCycle?: number
  minCycle?: number
}

export type TimingOptimizeResult = WebsterResult & {
  notes: string[]
  appliedPhases: Phase[]
  method: TimingMethod
  lostTimeSec: number
}

export function optimizeSignalTiming(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  opts?: TimingOptimizeOptions,
): TimingOptimizeResult {
  const method: TimingMethod = opts?.method ?? 'webster'
  const notes: string[] = []
  const minGreen = opts?.minGreen ?? 8
  const minCycle = opts?.minCycle ?? 40
  const maxCycle = opts?.maxCycle ?? 180
  const startLoss = opts?.startLoss ?? signal.startLossSec ?? 3
  const targetVc = opts?.targetVc ?? 0.9

  const mainPhases = signal.phases.filter((p) => !p.isOverlap)
  const workPhases = mainPhases.length ? mainPhases : signal.phases
  if (mainPhases.length && mainPhases.length < signal.phases.length) {
    notes.push('搭接相位不参与关键流量比 Y 计算，优化后绿灯保持或按比例微调')
  }

  const yis = phaseY(approaches, flow, workPhases)
  const dualCrit = isDualRingEnabled(signal)
    ? computeDualRingCriticalFlow(approaches, flow, signal)
    : null
  const Y = dualCrit?.enabled ? dualCrit.Y : yis.reduce((s, i) => s + i.y, 0) || 0.2
  const n = Math.max(1, workPhases.length)
  // Dual-ring: lost time ≈ barriers * (startLoss + clearance proxy); else n * ...
  const nBarrier = dualCrit?.enabled ? Math.max(1, dualCrit.barriers.length) : n
  const L =
    signal.lostTimeSec && signal.lostTimeSec > 0
      ? signal.lostTimeSec
      : nBarrier * startLoss + nBarrier * 2
  notes.push(
    dualCrit?.enabled
      ? `双环关键 Y=${Y.toFixed(3)}（seq ${dualCrit.sequentialY.toFixed(3)}）· L≈${L.toFixed(1)}s · 屏障 ${nBarrier}`
      : `关键流量比 Y=${Y.toFixed(3)} · 损失时间 L≈${L.toFixed(1)}s · 相位 ${n} 个`,
  )
  if (dualCrit?.enabled) notes.push(...dualCrit.notes.filter((x) => x.startsWith('  ')))

  let cycle = signal.cycleSec
  let phaseGreens: { phaseId: string; greenSec: number }[] = []

  if (method === 'webster') {
    const input: WebsterInput = {
      targetVc,
      startLoss,
      fixedCycle: opts?.fixedCycle && opts.fixedCycle > 0 ? opts.fixedCycle : undefined,
    }
    const work: SignalScheme = { ...signal, phases: workPhases }
    const res = websterCore(approaches, flow, work, input)
    cycle = clamp(res.cycleSec, minCycle, maxCycle)
    phaseGreens = res.phaseGreens
    notes.push(
      opts?.fixedCycle
        ? `Webster 固定周期 C=${cycle}s，按 y_i/Y 分配有效绿灯（Webster 1958）`
        : `Webster 最优周期 C₀≈(1.5L+5)/(1−Y/X)=${cycle}s（Webster 1958）`,
    )
  } else if (method === 'fixed-cycle') {
    cycle = clamp(opts?.fixedCycle && opts.fixedCycle > 0 ? opts.fixedCycle : signal.cycleSec, minCycle, maxCycle)
    phaseGreens = allocateByY(workPhases, yis, cycle, L, minGreen)
    notes.push(`固定周期优化：C=${cycle}s 不变，有效绿灯按 y_i/Y 分配`)
  } else if (method === 'equal') {
    cycle = clamp(opts?.fixedCycle && opts.fixedCycle > 0 ? opts.fixedCycle : signal.cycleSec || 90, minCycle, maxCycle)
    const yellowAll = workPhases.reduce((s, p) => s + (p.yellowSec || 3) + (p.allRedSec || 2), 0)
    const effective = Math.max(n * minGreen, cycle - yellowAll)
    const gEach = Math.max(minGreen, Math.floor(effective / n))
    phaseGreens = workPhases.map((p) => ({ phaseId: p.id, greenSec: gEach }))
    // residual to first
    const sum = phaseGreens.reduce((s, g) => s + g.greenSec, 0)
    if (phaseGreens.length) phaseGreens[0].greenSec += Math.max(0, effective - sum)
    notes.push(`等绿灯法：C=${cycle}s，主相位均分有效绿灯（实用近似）`)
  } else {
    // hcm-delay: search cycle if not fixed
    const candidates: number[] = []
    if (opts?.fixedCycle && opts.fixedCycle > 0) {
      candidates.push(clamp(opts.fixedCycle, minCycle, maxCycle))
    } else {
      for (let c = minCycle; c <= maxCycle; c += 5) candidates.push(c)
    }
    let bestC = candidates[0]
    let bestDelay = Infinity
    let bestG: { phaseId: string; greenSec: number }[] = []
    for (const c of candidates) {
      const g = allocateByY(workPhases, yis, c, L, minGreen)
      const d = estimateNetworkDelay(approaches, flow, workPhases, g, c, startLoss)
      if (d < bestDelay) {
        bestDelay = d
        bestC = c
        bestG = g
      }
    }
    cycle = bestC
    phaseGreens = bestG
    notes.push(
      `延误最小搜索：候选周期上最小化 HCM 风格延误代理，C*=${cycle}s，估延误≈${bestDelay.toFixed(1)}s`,
    )
  }

  // Dual-ring: re-allocate greens by barrier critical Y when enabled (except pure equal split stays equal)
  if (isDualRingEnabled(signal) && method !== 'equal') {
    // Webster C0 with dual-ring Y already used; greens from barrier allocation
    if (!(opts?.fixedCycle && opts.fixedCycle > 0) && method === 'webster') {
      // C0 already from websterCore with sequential phases — recompute C0 using dual Y
      const X = targetVc
      if (Y < X) {
        const c0 = (1.5 * L + 5) / (1 - Y / X)
        cycle = clamp(Math.round(c0), minCycle, maxCycle)
        notes.push(`双环 Webster C₀(Y_dual)=${cycle}s`)
      }
    }
    phaseGreens = allocateDualRingGreens(approaches, flow, signal, cycle, L, minGreen)
    notes.push('双环分绿：按屏障 max(Σy_R1,Σy_R2) 分配阶段有效绿，环内按 y 再分')
  }

  let applied = applyGreens(signal, phaseGreens, cycle, minGreen)
  // Dual-ring post-process: balance barrier rings + set C = stage sum
  if (isDualRingEnabled(signal)) {
    const trial: SignalScheme = { ...signal, phases: applied, cycleSec: cycle }
    const balanced = balanceBarrierRings(trial)
    applied = balanced
    const closed = { ...trial, phases: balanced }
    const stageC = cycleFromDualRing(closed)
    // if free cycle (not fixed), adopt dual-ring stage sum as C
    if (!(opts?.fixedCycle && opts.fixedCycle > 0) && method !== 'fixed-cycle') {
      cycle = clamp(stageC, minCycle, maxCycle)
    }
    const al = buildDualRingAlignment({ ...closed, cycleSec: cycle })
    notes.push(
      `双环联立：Barrier×${al.stages.length} · 阶段Σ=${al.stageSumSec.toFixed(1)}s · C=${cycle}s · ${al.closed ? '闭合' : '未闭合'}（非完整 NEMA 机）`,
    )
    for (const st of al.stages) {
      notes.push(
        `  B${st.barrierIndex}: R1=${st.ring1SumSec.toFixed(1)}s R2=${st.ring2SumSec.toFixed(1)}s → ${st.stageSec.toFixed(1)}s`,
      )
    }
  }
  // recompute sum for note
  notes.push('黄灯/全红：保留相位原值或默认；搭接相位不改绿或随周期比例缩放')
  return {
    cycleSec: cycle,
    Y,
    phaseGreens: applied
      .filter((p) => !p.isOverlap)
      .map((p) => ({ phaseId: p.id, greenSec: p.greenSec })),
    notes,
    appliedPhases: applied,
    method,
    lostTimeSec: L,
  }
}

function phaseY(
  approaches: Approach[],
  flow: FlowScheme,
  phases: Phase[],
): { phaseId: string; y: number }[] {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  return phases.map((ph) => {
    let yMax = 0
    for (const ap of approaches) {
      const rel = ph.releases[ap.id] ?? []
      const peak = peaks.find((p) => p.approachId === ap.id)
      if (!peak) continue
      let v = 0
      for (const m of rel) v += peak.peak[m as 'L' | 'T' | 'R' | 'U'] ?? 0
      const lanes = Math.max(
        1,
        ap.entryLanes.filter((l) => rel.some((m) => l.movements.includes(m))).length || ap.entryLanes.length,
      )
      yMax = Math.max(yMax, v / (flow.defaultSatFlow * lanes))
    }
    return { phaseId: ph.id, y: yMax }
  })
}

function allocateByY(
  phases: Phase[],
  yis: { phaseId: string; y: number }[],
  cycle: number,
  L: number,
  minGreen: number,
): { phaseId: string; greenSec: number }[] {
  const Y = yis.reduce((s, i) => s + i.y, 0) || 0.2
  const yellowAll = phases.reduce((s, p) => s + (p.yellowSec || 3) + (p.allRedSec || 2), 0)
  const effective = Math.max(phases.length * minGreen, cycle - Math.max(L, yellowAll))
  const greens = yis.map((yi) => ({
    phaseId: yi.phaseId,
    greenSec: Math.max(minGreen, Math.round((effective * yi.y) / Y)),
  }))
  const sum = greens.reduce((s, g) => s + g.greenSec, 0)
  if (greens.length && sum !== effective) {
    greens[0].greenSec = Math.max(minGreen, greens[0].greenSec + (effective - sum))
  }
  return greens
}

function applyGreens(
  signal: SignalScheme,
  phaseGreens: { phaseId: string; greenSec: number }[],
  cycle: number,
  minGreen: number,
): Phase[] {
  const map = new Map(phaseGreens.map((g) => [g.phaseId, g.greenSec]))
  return signal.phases.map((ph) => {
    if (ph.isOverlap) {
      // keep relative share of previous cycle if possible
      const scale = signal.cycleSec > 0 ? cycle / signal.cycleSec : 1
      return {
        ...ph,
        greenSec: Math.max(3, Math.round(ph.greenSec * scale)),
        yellowSec: ph.yellowSec,
        allRedSec: ph.allRedSec,
      }
    }
    const g = map.get(ph.id)
    return {
      ...ph,
      greenSec: g != null ? Math.max(minGreen, g) : ph.greenSec,
      yellowSec: ph.yellowSec > 0 ? ph.yellowSec : signal.yellowDefault || 3,
      allRedSec: ph.allRedSec >= 0 ? ph.allRedSec : signal.allRedDefault || 2,
    }
  })
}

/** Aggregate delay proxy for timing search (HCM-like). */
function estimateNetworkDelay(
  approaches: Approach[],
  flow: FlowScheme,
  phases: Phase[],
  greens: { phaseId: string; greenSec: number }[],
  cycle: number,
  startLoss: number,
): number {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const gMap = new Map(greens.map((g) => [g.phaseId, g.greenSec]))
  let sumVD = 0
  let sumV = 0
  for (const ap of approaches) {
    const peak = peaks.find((p) => p.approachId === ap.id)
    if (!peak) continue
    for (const mov of ['L', 'T', 'R'] as const) {
      const v = peak.peak[mov]
      if (v <= 0) continue
      let gEff = 0
      for (const ph of phases) {
        if ((ph.releases[ap.id] ?? []).includes(mov)) {
          const g = gMap.get(ph.id) ?? ph.greenSec
          gEff += Math.max(0.1, g + (ph.yellowSec || 3) - startLoss)
        }
      }
      const lambda = Math.min(1, gEff / Math.max(1, cycle))
      const sat = flow.defaultSatFlow * Math.max(1, ap.entryLanes.length / 2)
      const cap = sat * lambda
      const x = Math.min(1.2, v / Math.max(1, cap))
      const uniform = (cycle * (1 - lambda) ** 2) / (2 * (1 - Math.min(0.99, lambda * x)))
      const random =
        900 * 0.25 * ((x - 1) + Math.sqrt((x - 1) ** 2 + (8 * 0.5 * x) / Math.max(1, cap * 0.25)))
      const d = Math.max(0, uniform + random)
      sumVD += v * d
      sumV += v
    }
  }
  return sumV > 0 ? sumVD / sumV : 999
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function phaseTimingRows(signal: SignalScheme): {
  name: string
  green: number
  yellow: number
  allRed: number
  start: number
  end: number
  isOverlap: boolean
}[] {
  let t = 0
  const rows = []
  for (const ph of signal.phases) {
    const dur = ph.greenSec + ph.yellowSec + ph.allRedSec
    rows.push({
      name: ph.name,
      green: ph.greenSec,
      yellow: ph.yellowSec,
      allRed: ph.allRedSec,
      start: t,
      end: t + dur,
      isOverlap: !!ph.isOverlap,
    })
    if (!ph.isOverlap) t += dur
  }
  return rows
}

/** Critical movement summary for display (y = v/s). */
export function criticalFlowRatios(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): { phase: string; y: number; volume: number }[] {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const out: { phase: string; y: number; volume: number }[] = []
  for (const ph of signal.phases) {
    if (ph.isOverlap) continue
    let yMax = 0
    let vAt = 0
    for (const ap of approaches) {
      const rel = ph.releases[ap.id] ?? []
      const peak = peaks.find((p) => p.approachId === ap.id)
      if (!peak) continue
      let v = 0
      for (const m of rel) v += peak.peak[m as 'L' | 'T' | 'R' | 'U'] ?? 0
      const lanes = Math.max(
        1,
        ap.entryLanes.filter((l) => rel.some((m) => l.movements.includes(m))).length || ap.entryLanes.length,
      )
      const y = v / (flow.defaultSatFlow * lanes)
      if (y > yMax) {
        yMax = y
        vAt = v
      }
    }
    out.push({ phase: ph.name, y: yMax, volume: vAt })
  }
  return out
}

export const TIMING_METHOD_LABELS: Record<TimingMethod, string> = {
  webster: 'Webster 最优周期',
  equal: '等绿灯分配',
  'hcm-delay': '延误最小（HCM 风格）',
  'fixed-cycle': '固定周期分绿',
}
