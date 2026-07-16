/**
 * RoadGee-style automatic signal timing pack:
 * - compute Y (critical flow ratio)
 * - generate 4-phase protected scheme from approaches
 * - clear greens (keep structure)
 * - design target VC / start loss / design PHF snapshot
 *
 * Engineering schematic — not full NEMA controller / not commercial black-box.
 */
import { newId } from '../../shared/id'
import type { Approach, FlowScheme, Phase, SignalScheme } from '../types'
import { criticalFlowRatios, optimizeSignalTiming, type TimingMethod, type TimingOptimizeResult } from '../analysis/timing'
import { computeDualRingCriticalFlow as dualCritFn } from './barrierCritical'
import { isDualRingEnabled } from './dualRing'

export type AutoTimingDesign = {
  targetVc: number
  startLossSec: number
  designPhf: number
  designCycleSec?: number
  lockCycle: boolean
  method: TimingMethod
}

export type YBreakdown = {
  Y: number
  phaseRows: { phase: string; y: number; volume: number; share: number }[]
  dualRing: boolean
  notes: string[]
}

/** Sum of critical y per main phase (sequential); dual-ring uses barrier Y when enabled. */
export function computeSchemeY(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): YBreakdown {
  const rows = criticalFlowRatios(approaches, flow, signal)
  const ySum = rows.reduce((s, r) => s + r.y, 0)
  const dual = isDualRingEnabled(signal)
  let Y = ySum || 0.2
  const notes: string[] = []
  if (dual) {
    try {
      const d = dualCritFn(approaches, flow, signal)
      if (d.enabled) {
        Y = d.Y
        notes.push(`双环关键 Y=${Y.toFixed(3)}（序贯Σy=${ySum.toFixed(3)}）`)
        notes.push(...d.notes.slice(0, 4))
      }
    } catch {
      notes.push('双环 Y 回退为序贯相位 y 之和')
    }
  } else {
    notes.push(`序贯相位关键 Y=Σy_i=${Y.toFixed(3)}`)
  }
  const phaseRows = rows.map((r) => ({
    phase: r.phase,
    y: r.y,
    volume: r.volume,
    share: Y > 0 ? r.y / Y : 0,
  }))
  return { Y, phaseRows, dualRing: dual, notes }
}

/**
 * Generate a classic 4-phase protected scheme for a cross (or n-leg sequential).
 * Each approach gets its own phase with L+T+R if multi-leg; for 4-leg uses NS-L, NS-T, EW-L, EW-T style
 * simplified: one phase per approach with all motor releases on that approach.
 */
export function generateProtectedPhases(approaches: Approach[], base?: SignalScheme): SignalScheme {
  const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
  const n = Math.max(2, sorted.length)
  const yellow = 3
  const allRed = 1
  const green = Math.max(12, Math.floor(80 / n) - yellow - allRed)
  const phases: Phase[] = sorted.map((ap, i) => {
    const releases: Phase['releases'] = {}
    releases[ap.id] = ['L', 'T', 'R']
    return {
      id: newId(),
      name: `第${i + 1}相位`,
      greenSec: green,
      yellowSec: yellow,
      allRedSec: allRed,
      releases,
      pedestrian: [{ approachId: ap.id, exclusive: false }],
      isOverlap: false,
    }
  })
  const cycleSec = phases.reduce((s, p) => s + p.greenSec + p.yellowSec + p.allRedSec, 0)
  return {
    id: base?.id ?? newId(),
    name: base?.name ?? '自动生成方案',
    cycleSec,
    phases,
    yellowDefault: base?.yellowDefault ?? 3,
    allRedDefault: base?.allRedDefault ?? 2,
    startLossSec: base?.startLossSec ?? 3,
    lostTimeSec: base?.lostTimeSec,
    unsignalized: false,
    dualRing: base?.dualRing,
  }
}

/** Zero greens but keep phase structure / releases (RoadGee 清空方案-like). */
export function clearPhaseGreens(signal: SignalScheme, minGreen = 8): SignalScheme {
  return {
    ...signal,
    phases: signal.phases.map((p) =>
      p.isOverlap
        ? p
        : {
            ...p,
            greenSec: minGreen,
            yellowSec: p.yellowSec || 3,
            allRedSec: p.allRedSec ?? 1,
          },
    ),
    cycleSec: signal.phases
      .filter((p) => !p.isOverlap)
      .reduce((s, p) => s + minGreen + (p.yellowSec || 3) + (p.allRedSec ?? 1), 0),
  }
}

/**
 * Full auto-timing: optional generate → optimize with design params → return phases+C+Y report.
 */
export function runAutoTimingPack(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  design: AutoTimingDesign,
  opts?: { regeneratePhases?: boolean },
): TimingOptimizeResult & { yReport: YBreakdown; design: AutoTimingDesign } {
  let sg = signal
  if (opts?.regeneratePhases) {
    sg = generateProtectedPhases(approaches, signal)
  }
  // snapshot PHF into flow is caller's job; we only report design.designPhf
  const yReport = computeSchemeY(approaches, flow, sg)
  const r = optimizeSignalTiming(approaches, flow, sg, {
    method: design.method,
    targetVc: design.targetVc,
    startLoss: design.startLossSec,
    fixedCycle: design.lockCycle
      ? design.designCycleSec && design.designCycleSec > 0
        ? design.designCycleSec
        : sg.cycleSec
      : design.method === 'fixed-cycle'
        ? design.designCycleSec ?? sg.cycleSec
        : undefined,
  })
  r.notes.unshift(
    `设计目标VC=${design.targetVc} · 启动损失=${design.startLossSec}s · 设计PHF=${design.designPhf}`,
  )
  r.notes.unshift(`计算Y=${yReport.Y.toFixed(3)}${yReport.dualRing ? '（双环）' : ''}`)
  return { ...r, yReport, design }
}

/** Markdown brief for export. */
export function autoTimingMarkdown(
  projectName: string,
  r: TimingOptimizeResult & { yReport: YBreakdown; design: AutoTimingDesign },
): string {
  const lines = [
    `# ${projectName} · 自动配时报告`,
    '',
    `- 方法: ${r.method}`,
    `- C = ${r.cycleSec} s`,
    `- Y = ${r.yReport.Y.toFixed(3)}`,
    `- 目标 VC = ${r.design.targetVc}`,
    `- 启动损失 = ${r.design.startLossSec} s`,
    `- 设计 PHF = ${r.design.designPhf}`,
    '',
    '## 相位 y',
    '| 相位 | y | 流量 | 占比 |',
    '|------|---|------|------|',
    ...r.yReport.phaseRows.map(
      (row) => `| ${row.phase} | ${row.y.toFixed(3)} | ${Math.round(row.volume)} | ${(row.share * 100).toFixed(1)}% |`,
    ),
    '',
    '## 说明',
    ...r.notes.map((n) => `- ${n}`),
    '',
    '_工程示意，非完整 NEMA / 非商业黑箱。_',
  ]
  return lines.join('\n')
}
