import type {
  AnalysisLaneResult,
  AnalysisResult,
  Approach,
  FlowScheme,
  SignalScheme,
  WebsterInput,
  WebsterResult,
} from '../types'
import { convertVolumes } from '../flow/convert'

function losByDelay(d: number): string {
  if (d <= 10) return 'A'
  if (d <= 20) return 'B'
  if (d <= 35) return 'C'
  if (d <= 55) return 'D'
  if (d <= 80) return 'E'
  return 'F'
}

function losByVc(x: number): string {
  if (x <= 0.25) return 'A'
  if (x <= 0.5) return 'B'
  if (x <= 0.7) return 'C'
  if (x <= 0.85) return 'D'
  if (x <= 0.95) return 'E'
  return 'F'
}

function effectiveGreen(g: number, y: number, startLoss: number): number {
  return Math.max(0.1, g + y - startLoss)
}

function greenRatioForApproach(
  signal: SignalScheme,
  approachId: string,
  movement: 'L' | 'T' | 'R' | 'U',
  approach?: Approach,
): number {
  if (signal.unsignalized) return 1
  // Red-light right turns: permitted during all reds of other phases (ratio of cycle)
  if (movement === 'R' && approach?.redRightTurn) {
    const exclusive = greenExclusive(signal, approachId, 'R')
    const permitted = Math.min(0.95, Math.max(0, approach.redRightTurnRatio))
    return Math.min(1, Math.max(exclusive, exclusive + (1 - exclusive) * permitted * 0.85))
  }
  return greenExclusive(signal, approachId, movement)
}

function greenExclusive(
  signal: SignalScheme,
  approachId: string,
  movement: 'L' | 'T' | 'R' | 'U',
): number {
  let g = 0
  for (const ph of signal.phases) {
    const rel = ph.releases[approachId] ?? []
    if (rel.includes(movement)) {
      g += effectiveGreen(ph.greenSec, ph.yellowSec, signal.startLossSec)
    }
  }
  return Math.min(1, g / Math.max(1, signal.cycleSec))
}

function satFlowFor(ap: Approach, flow: FlowScheme, mov: 'L' | 'T' | 'R'): number {
  const lanes = ap.entryLanes.filter((l) => l.movements.includes(mov))
  if (!lanes.length) {
    if (mov === 'L' && ap.borrowLeft) return 1650
    return flow.defaultSatFlow
  }
  // sum explicit sat if set; else base * lane count (shared groups already multi-lane)
  let sum = 0
  for (const lane of lanes) {
    const base = lane.satFlowPcu ?? (mov === 'L' && ap.borrowLeft ? 1650 : flow.defaultSatFlow)
    // variable lane: share capacity ~0.85 of exclusive when multi-movement
    const factor = lane.variable && lane.movements.length > 1 ? 0.85 : 1
    sum += base * factor
  }
  return sum
}

export function analyzeIntersection(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): AnalysisResult {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const lanes: AnalysisLaneResult[] = []

  for (const ap of approaches) {
    const peak = peaks.find((p) => p.approachId === ap.id)
    if (!peak) continue
    for (const mov of ['L', 'T', 'R'] as const) {
      const volumePeak = peak.peak[mov]
      if (volumePeak <= 0) continue
      const sat = satFlowFor(ap, flow, mov)
      const lambda = greenRatioForApproach(signal, ap.id, mov, ap)
      const capacity = sat * lambda
      const vc = capacity > 0 ? volumePeak / capacity : 9
      // HCM-like delay simplified
      const x = Math.min(vc, 1.2)
      const C = Math.max(1, signal.cycleSec)
      const xmin = Math.min(1, x)
      const denom = Math.max(0.01, 1 - lambda * xmin)
      const uniform = (0.5 * C * (1 - lambda) ** 2) / denom
      const random =
        capacity > 0
          ? 900 *
            0.25 *
            ((x - 1) + Math.sqrt((x - 1) ** 2 + (8 * 0.5 * x) / (capacity * 0.25)))
          : 0
      const delaySec = Math.max(0, uniform + random)
      const queueVeh =
        capacity > 0
          ? ((volumePeak / 4) * (1 - lambda) * C) / 3600 / Math.max(0.05, 1 - x * 0.9) +
            Math.max(0, (x - 1) * capacity * 0.25)
          : volumePeak / 4
      const queueM = Math.max(0, queueVeh) * 5.5
      lanes.push({
        approachId: ap.id,
        approachName: ap.name,
        movement: mov,
        volumePeak,
        satFlow: sat,
        greenRatio: lambda,
        capacity,
        vc,
        delaySec,
        queueM,
      })
    }
  }

  const wsum = lanes.reduce((s, l) => s + l.volumePeak, 0) || 1
  const avgVc = lanes.reduce((s, l) => s + l.vc * l.volumePeak, 0) / wsum
  const avgDelay = lanes.reduce((s, l) => s + l.delaySec * l.volumePeak, 0) / wsum
  const avgQueueM = lanes.reduce((s, l) => s + l.queueM * l.volumePeak, 0) / wsum
  const dLos = losByDelay(avgDelay)
  const vLos = losByVc(avgVc)
  // CJJ idea: when saturated, prefer delay LOS
  const losFinal = avgVc > 0.85 ? dLos : dLos >= vLos ? dLos : vLos

  return {
    lanes,
    avgVc,
    avgDelay,
    avgQueueM,
    losByDelay: dLos,
    losByVc: vLos,
    losFinal,
  }
}

export function websterTiming(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  input: WebsterInput,
): WebsterResult {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const yis: { phaseId: string; y: number }[] = []
  for (const ph of signal.phases) {
    let yMax = 0
    for (const ap of approaches) {
      const rel = ph.releases[ap.id] ?? []
      const peak = peaks.find((p) => p.approachId === ap.id)
      if (!peak) continue
      let v = 0
      for (const m of rel) v += peak.peak[m]
      const lanes = Math.max(1, ap.entryLanes.length)
      const y = v / (flow.defaultSatFlow * lanes)
      yMax = Math.max(yMax, y)
    }
    yis.push({ phaseId: ph.id, y: yMax })
  }
  const Y = yis.reduce((s, i) => s + i.y, 0) || 0.2
  const L = signal.phases.length * input.startLoss + signal.phases.length * 3
  const X = Math.min(0.95, Math.max(0.5, input.targetVc))
  let C =
    input.fixedCycle && input.fixedCycle > 0
      ? input.fixedCycle
      : Math.round((1.5 * L + 5) / Math.max(0.05, 1 - Y / X))
  C = Math.min(180, Math.max(40, C))
  const effective = Math.max(1, C - L)
  const phaseGreens = yis.map((yi) => ({
    phaseId: yi.phaseId,
    greenSec: Math.max(5, Math.round((effective * yi.y) / Y)),
  }))
  // fix rounding
  const sumG = phaseGreens.reduce((s, g) => s + g.greenSec, 0)
  if (phaseGreens.length && sumG !== effective) {
    phaseGreens[0].greenSec += effective - sumG
  }
  return { cycleSec: C, Y, phaseGreens }
}
