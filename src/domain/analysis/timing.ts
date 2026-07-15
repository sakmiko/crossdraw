import type { Approach, FlowScheme, Phase, SignalScheme, WebsterInput, WebsterResult } from '../types'
import { convertVolumes } from '../flow/convert'
import { websterTiming as websterCore } from './index'

/**
 * Webster timing with phase lost time L = Σ(startLoss) style.
 * Reference: Webster (1958); engineering form C0=(1.5L+5)/(1-Y).
 * Overlap phases excluded from critical Y sum (treated as secondary).
 */
export function optimizeSignalTiming(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  opts?: Partial<WebsterInput>,
): WebsterResult & { notes: string[]; appliedPhases: Phase[] } {
  const notes: string[] = []
  const mainPhases = signal.phases.filter((p) => !p.isOverlap)
  const work: SignalScheme = {
    ...signal,
    phases: mainPhases.length ? mainPhases : signal.phases,
  }
  if (mainPhases.length && mainPhases.length < signal.phases.length) {
    notes.push('搭接相位不参与 Webster 关键流量比 Y 计算')
  }
  const input: WebsterInput = {
    targetVc: opts?.targetVc ?? 0.9,
    startLoss: opts?.startLoss ?? signal.startLossSec ?? 3,
    fixedCycle: opts?.fixedCycle,
  }
  const res = websterCore(approaches, flow, work, input)
  notes.push(`Webster: Y=${res.Y.toFixed(3)}, L≈相位损失, C*=${res.cycleSec}s（依据 Webster 1958）`)
  notes.push('有效绿灯按 y_i/Y 分配；黄灯/全红保持相位原值或默认')

  const applied = signal.phases.map((ph) => {
    if (ph.isOverlap) return { ...ph }
    const g = res.phaseGreens.find((x) => x.phaseId === ph.id)
    return {
      ...ph,
      greenSec: g ? Math.max(5, g.greenSec) : ph.greenSec,
      yellowSec: ph.yellowSec > 0 ? ph.yellowSec : signal.yellowDefault || 3,
      allRedSec: ph.allRedSec >= 0 ? ph.allRedSec : signal.allRedDefault || 2,
    }
  })
  return { ...res, notes, appliedPhases: applied }
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
      const lanes = Math.max(1, ap.entryLanes.filter((l) => rel.some((m) => l.movements.includes(m))).length || ap.entryLanes.length)
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
