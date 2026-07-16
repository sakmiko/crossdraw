/**
 * Unsignalized / roundabout capacity sketch (HCM-inspired engineering).
 * Not SIDRA / full HCM chapter implementation — transparent formulas only.
 */
import type { Approach, FlowScheme, SignalScheme } from '../types'
import { convertVolumes } from '../flow/convert'
import { computeRoundaboutLayout } from '../geometry/roundabout'

export type UnsignalizedLegResult = {
  approachId: string
  approachName: string
  volume: number
  capacity: number
  vc: number
  delaySec: number
  los: string
  movement: string
  note: string
}

export type UnsignalizedAnalysis = {
  mode: 'twsc' | 'roundabout' | 'none'
  legs: UnsignalizedLegResult[]
  avgDelay: number
  avgVc: number
  los: string
  notes: string[]
}

function losByDelay(d: number): string {
  if (d <= 10) return 'A'
  if (d <= 15) return 'B'
  if (d <= 25) return 'C'
  if (d <= 35) return 'D'
  if (d <= 50) return 'E'
  return 'F'
}

function hcmDelay(v: number, c: number): number {
  if (c <= 0) return 999
  const x = Math.min(1.5, v / c)
  // HCM TWSC-like control delay sketch (s/veh)
  const d =
    3600 / c +
    900 * 0.25 * ((x - 1) + Math.sqrt((x - 1) ** 2 + (3600 / c) * x / 450)) +
    5 * x
  return Math.max(0, d)
}

/**
 * Two-way stop-control sketch: major street free (λ≈1), minor stops.
 * Major = two approaches with highest through volume; others minor.
 */
export function analyzeTwsc(
  approaches: Approach[],
  flow: FlowScheme,
): UnsignalizedAnalysis {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const throughVol = approaches.map((ap) => {
    const peak = peaks.find((p) => p.approachId === ap.id)
    const t = peak?.peak.T ?? 0
    return { ap, t, peak }
  })
  throughVol.sort((a, b) => b.t - a.t)
  const majorIds = new Set(throughVol.slice(0, Math.min(2, throughVol.length)).map((x) => x.ap.id))
  // conflicting major volume for minor
  const majorV = throughVol.filter((x) => majorIds.has(x.ap.id)).reduce((s, x) => s + (x.peak?.peak.T ?? 0) + (x.peak?.peak.L ?? 0) * 0.5, 0)

  const legs: UnsignalizedLegResult[] = []
  const notes = ['无信号两路停车示意 · 主路自由通行、次路停车让行（非完整 HCM TWSC）']

  for (const { ap, peak } of throughVol) {
    if (!peak) continue
    const isMajor = majorIds.has(ap.id)
    for (const mov of ['L', 'T', 'R'] as const) {
      const v = peak.peak[mov]
      if (v <= 0) continue
      let cap: number
      let note: string
      if (isMajor) {
        cap = flow.defaultSatFlow * Math.max(1, ap.entryLanes.filter((l) => l.movements.includes(mov)).length || 1)
        note = '主路 · 近似畅行能力'
      } else {
        // gap acceptance sketch: c = Vm * e^(-Vm*tc/3600)/(1-e^(-Vm*tf/3600))
        const Vm = Math.max(50, majorV)
        const tc = mov === 'L' ? 7.1 : mov === 'T' ? 6.5 : 6.2
        const tf = 3.3
        const a = Math.exp((-Vm * tc) / 3600)
        const b = 1 - Math.exp((-Vm * tf) / 3600)
        cap = Math.max(50, (Vm * a) / Math.max(0.05, b))
        note = `次路 · 可接受间隙 tc=${tc}s（示意）`
      }
      const vc = v / Math.max(1, cap)
      const delaySec = isMajor ? Math.min(12, hcmDelay(v, cap) * 0.15) : hcmDelay(v, cap)
      legs.push({
        approachId: ap.id,
        approachName: ap.name,
        volume: v,
        capacity: Math.round(cap),
        vc,
        delaySec,
        los: losByDelay(delaySec),
        movement: mov,
        note,
      })
    }
  }

  const sumV = legs.reduce((s, l) => s + l.volume, 0) || 1
  const avgDelay = legs.reduce((s, l) => s + l.delaySec * l.volume, 0) / sumV
  const avgVc = legs.reduce((s, l) => s + l.vc * l.volume, 0) / sumV
  return {
    mode: 'twsc',
    legs,
    avgDelay,
    avgVc,
    los: losByDelay(avgDelay),
    notes,
  }
}

/**
 * Roundabout circulating capacity sketch from layout + approach demand.
 */
export function analyzeRoundabout(
  approaches: Approach[],
  flow: FlowScheme,
): UnsignalizedAnalysis {
  const layout = computeRoundaboutLayout(approaches, 12)
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const entryDemand = approaches.map((ap) => {
    const peak = peaks.find((p) => p.approachId === ap.id)
    const v = peak ? peak.peak.L + peak.peak.T + peak.peak.R : 0
    return { ap, v }
  })
  const circ = entryDemand.reduce((s, x) => s + x.v, 0) * 0.55 // fraction still circulating past a leg
  // per-lane circulatory capacity ~ 1600; entry capacity decreases with circulating
  const laneCap = 1600 * layout.laneCount
  const notes = [
    `环形示意 · 环道 ${layout.laneCount} 车道 · 内岛 r=${layout.innerR.toFixed(1)}m（非 SIDRA）`,
    `环行流量代理 Vc≈${Math.round(circ)} pcu/h`,
  ]
  const legs: UnsignalizedLegResult[] = []
  for (const { ap, v } of entryDemand) {
    if (v <= 0) continue
    // Kimber-like linear decay sketch
    const cap = Math.max(200, laneCap * 0.7 - 0.7 * circ * (1 / Math.max(1, approaches.length)))
    const vc = v / cap
    const delaySec = hcmDelay(v, cap)
    legs.push({
      approachId: ap.id,
      approachName: ap.name,
      volume: v,
      capacity: Math.round(cap),
      vc,
      delaySec,
      los: losByDelay(delaySec),
      movement: 'Entry',
      note: '进口能力随环行流量衰减（示意）',
    })
  }
  const sumV = legs.reduce((s, l) => s + l.volume, 0) || 1
  const avgDelay = legs.reduce((s, l) => s + l.delaySec * l.volume, 0) / sumV
  const avgVc = legs.reduce((s, l) => s + l.vc * l.volume, 0) / sumV
  return {
    mode: 'roundabout',
    legs,
    avgDelay,
    avgVc,
    los: losByDelay(avgDelay),
    notes,
  }
}

export function analyzeUnsignalized(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  intersectionType?: string,
): UnsignalizedAnalysis {
  if (!signal.unsignalized) {
    return {
      mode: 'none',
      legs: [],
      avgDelay: 0,
      avgVc: 0,
      los: '—',
      notes: ['信号控制交叉口 · 使用信号评价'],
    }
  }
  if (intersectionType === 'roundabout') {
    return analyzeRoundabout(approaches, flow)
  }
  return analyzeTwsc(approaches, flow)
}

export function unsignalizedMarkdown(name: string, u: UnsignalizedAnalysis): string {
  const lines = [
    `# ${name} · 无信号评价`,
    '',
    `模式：${u.mode} · LOS ${u.los} · 均延误 ${u.avgDelay.toFixed(1)}s · 均 v/c ${u.avgVc.toFixed(2)}`,
    '',
    ...u.notes.map((n) => `- ${n}`),
    '',
    '| 进口 | 转向 | 流量 | 能力 | v/c | 延误 | LOS |',
    '|------|------|------|------|-----|------|-----|',
    ...u.legs.map(
      (l) =>
        `| ${l.approachName} | ${l.movement} | ${l.volume} | ${l.capacity} | ${l.vc.toFixed(2)} | ${l.delaySec.toFixed(1)} | ${l.los} |`,
    ),
  ]
  return lines.join('\n')
}
