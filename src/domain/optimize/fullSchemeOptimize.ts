/**
 * One-click full-scheme optimize: signal Webster + progressive band offsets + multi-corridor.
 * Engineering composite pack — not commercial multi-objective black-box.
 */
import type { Approach, BandCorridor, FlowScheme, Project, SignalScheme } from '../types'
import { runAutoTimingPack, type AutoTimingDesign } from '../signal/autoTimingPack'
import { applyProgressiveOffsets } from '../analysis/progressiveOffset'
import { optimizeAllCorridors, measureCorridor } from '../analysis/corridor'
import { computeCoordinationIndex } from '../analysis/coordinationIndex'
import { analyzeIntersection } from '../analysis/index'

export type FullOptimizeOptions = {
  design?: Partial<AutoTimingDesign>
  progressiveFirst?: boolean
  reverseProgressive?: boolean
  allCorridors?: boolean
}

export type FullOptimizeResult = {
  signal: SignalScheme
  cycleSec: number
  Y: number
  delaySec: number
  avgVc: number
  bandCorridors: BandCorridor[]
  activeBand: BandCorridor
  bandImproved: number
  bandCount: number
  bandwidthRatio: number
  coordScore: number
  notes: string[]
}

const DEFAULT_DESIGN: AutoTimingDesign = {
  targetVc: 0.9,
  startLossSec: 2,
  designPhf: 0.92,
  lockCycle: false,
  method: 'webster',
}

export function runFullSchemeOptimize(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  corridors: BandCorridor[],
  activeBandId: string | undefined,
  opts: FullOptimizeOptions = {},
): FullOptimizeResult {
  const notes: string[] = []
  const design: AutoTimingDesign = { ...DEFAULT_DESIGN, ...opts.design }
  const pack = runAutoTimingPack(approaches, flow, signal, design)
  const nextSignal: SignalScheme = {
    ...signal,
    phases: pack.appliedPhases,
    cycleSec: pack.cycleSec,
  }
  notes.push(...(pack.notes ?? []).slice(0, 4))
  notes.push(`自动配时 C=${pack.cycleSec}s · Y=${pack.yReport.Y.toFixed(3)}`)

  let list = (corridors ?? []).map((c) => ({
    ...c,
    nodes: c.nodes.map((n) => ({ ...n })),
  }))

  if (opts.progressiveFirst !== false && list.length) {
    list = list.map((c) => applyProgressiveOffsets(c, !!opts.reverseProgressive))
    notes.push('已写连续相位差（行程时间模 C）')
  }

  let bandImproved = 0
  const bandCount = list.length
  if (list.length) {
    const { corridors: opt, summaries } = optimizeAllCorridors(list)
    list = opt
    bandImproved = summaries.filter((s) => s.improved).length
    notes.push(`多走廊优化 ${list.length} 条 · 改善 ${bandImproved}`)
  }

  const active =
    list.find((c) => c.id === activeBandId) ??
    list[0] ??
    ({ id: 'none', name: '—', nodes: [], speedKmh: 40, method: 'classic' } as BandCorridor)

  const bandRes = active.nodes?.length ? measureCorridor(active) : null
  const coord = active.nodes?.length ? computeCoordinationIndex(active, bandRes ?? undefined) : null

  let delaySec = 0
  let avgVc = 0
  try {
    const an = analyzeIntersection(approaches, flow, nextSignal)
    delaySec = an.avgDelay
    avgVc = an.avgVc
  } catch {
    notes.push('评价未算出，已跳过')
  }

  return {
    signal: nextSignal,
    cycleSec: pack.cycleSec,
    Y: pack.yReport.Y,
    delaySec,
    avgVc,
    bandCorridors: list,
    activeBand: active,
    bandImproved,
    bandCount,
    bandwidthRatio: bandRes?.bandwidthRatio ?? 0,
    coordScore: coord?.score ?? 0,
    notes,
  }
}

export function fullOptimizeMarkdown(projectName: string, r: FullOptimizeResult): string {
  return [
    `# ${projectName} · 一键全方案优化`,
    '',
    `- 周期 C = **${r.cycleSec} s** · Y = **${r.Y.toFixed(3)}**`,
    `- 均延误 **${r.delaySec.toFixed(1)} s** · 均 v/c **${r.avgVc.toFixed(2)}**`,
    `- 绿波走廊 ${r.bandCount} · 带宽比 **${(r.bandwidthRatio * 100).toFixed(1)}%** · 协调分 **${r.coordScore.toFixed(0)}**`,
    '',
    '## 说明',
    ...r.notes.map((n) => `- ${n}`),
    '',
    '- Webster/HCM 工程近似；绿波离散搜索；非商业黑箱优化器',
  ].join('\n')
}

export function projectAfterFullOptimize(project: Project, r: FullOptimizeResult): Project {
  const p = structuredClone(project) as Project
  const ch =
    p.channelizationSchemes.find((c) => c.id === p.active?.channelId) ?? p.channelizationSchemes[0]
  if (!ch) return p
  const fl = ch.flowSchemes.find((f) => f.id === p.active?.flowId) ?? ch.flowSchemes[0]
  if (!fl) return p
  const sgIdx = fl.signalSchemes.findIndex((s) => s.id === p.active?.signalId)
  if (sgIdx >= 0) fl.signalSchemes[sgIdx] = r.signal
  else if (fl.signalSchemes[0]) fl.signalSchemes[0] = r.signal

  if (r.bandCorridors.length) {
    p.bandCorridors = r.bandCorridors
    p.bandCorridor = r.activeBand
    p.activeBandId = r.activeBand.id
  }
  return p
}
