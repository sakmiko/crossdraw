/**
 * Intergreen (yellow + all-red) review — engineering recommendations.
 * Yellow ≈ t_p + v/(2a+2gG); all-red ≈ (W+L)/v. Textbook ITE-style schematic.
 * Not a full design-code library / not trajectory sim.
 */
import type { Approach, Phase, SignalScheme } from '../types'

export type IntergreenRow = {
  phaseId: string
  phaseName: string
  isOverlap: boolean
  yellowSec: number
  allRedSec: number
  recYellow: number
  recAllRed: number
  yellowOk: boolean
  allRedOk: boolean
  status: 'ok' | 'short' | 'long'
  note: string
  speedKmh: number
  widthM: number
}

/** Perception-reaction default 1.0s; deceleration 3.0 m/s²; grade 0. */
export function recommendYellowSec(speedKmh: number, opts?: { pr?: number; decel?: number }): number {
  const v = Math.max(5, speedKmh) / 3.6
  const pr = opts?.pr ?? 1.0
  const a = opts?.decel ?? 3.0
  const y = pr + v / (2 * a)
  return Math.round(Math.min(6, Math.max(3, y)) * 10) / 10
}

/** All-red: cross width + vehicle length / speed. */
export function recommendAllRedSec(
  widthM: number,
  speedKmh: number,
  opts?: { vehicleLenM?: number },
): number {
  const v = Math.max(5, speedKmh) / 3.6
  const L = opts?.vehicleLenM ?? 6
  const ar = (Math.max(8, widthM) + L) / v
  return Math.round(Math.min(4, Math.max(1, ar)) * 10) / 10
}

function approachWidthM(ap: Approach): number {
  const entry = ap.entryLanes?.reduce((s, l) => s + (l.widthM || 3.5), 0) ?? 7
  return Math.max(8, entry + (ap.median?.widthM || 0))
}

function refSpeed(approaches: Approach[]): number {
  if (!approaches.length) return 40
  const sum = approaches.reduce((s, a) => s + (a.designSpeedKmh || 40), 0)
  return sum / approaches.length
}

export function collectIntergreenRows(
  signal: SignalScheme,
  approaches: Approach[],
): IntergreenRow[] {
  const v = refSpeed(approaches)
  const W = approaches.length
    ? approaches.reduce((s, a) => s + approachWidthM(a), 0) / approaches.length
    : 14
  const recY = recommendYellowSec(v)
  const recAr = recommendAllRedSec(W, v)

  return signal.phases.map((ph) => {
    const yOk = ph.yellowSec + 1e-6 >= recY - 0.3
    const arOk = ph.allRedSec + 1e-6 >= recAr - 0.3
    let status: IntergreenRow['status'] = 'ok'
    if (!yOk || !arOk) status = 'short'
    else if (ph.yellowSec > recY + 1.5 || ph.allRedSec > recAr + 1.5) status = 'long'
    const note =
      status === 'short'
        ? '偏短·建议加黄/全红'
        : status === 'long'
          ? '偏长·可压缩损失'
          : '接近推荐'
    return {
      phaseId: ph.id,
      phaseName: ph.name,
      isOverlap: !!ph.isOverlap,
      yellowSec: ph.yellowSec,
      allRedSec: ph.allRedSec,
      recYellow: recY,
      recAllRed: recAr,
      yellowOk: yOk,
      allRedOk: arOk,
      status,
      note,
      speedKmh: Math.round(v),
      widthM: Math.round(W * 10) / 10,
    }
  })
}

export function applyIntergreenRecommendations(
  signal: SignalScheme,
  approaches: Approach[],
  opts?: { onlyShort?: boolean },
): SignalScheme {
  const rows = collectIntergreenRows(signal, approaches)
  const map = new Map(rows.map((r) => [r.phaseId, r]))
  return {
    ...signal,
    phases: signal.phases.map((ph) => {
      const r = map.get(ph.id)
      if (!r) return ph
      if (opts?.onlyShort && r.status !== 'short') return ph
      return {
        ...ph,
        yellowSec: r.recYellow,
        allRedSec: r.recAllRed,
      }
    }),
  }
}

export function intergreenMarkdown(projectName: string, rows: IntergreenRow[]): string {
  const short = rows.filter((r) => r.status === 'short').length
  return [
    `# ${projectName} · 清空间隔审查`,
    '',
    `- 相位 ${rows.length} · 偏短 ${short}`,
    `- 参考速度 ${rows[0]?.speedKmh ?? '—'} km/h · 参考宽度 ${rows[0]?.widthM ?? '—'} m`,
    '',
    '| 相位 | 黄s | 推黄 | 全红s | 推全红 | 状态 |',
    '|------|----:|-----:|------:|-------:|------|',
    ...rows.map(
      (r) =>
        `| ${r.phaseName}${r.isOverlap ? '·搭' : ''} | ${r.yellowSec} | ${r.recYellow} | ${r.allRedSec} | ${r.recAllRed} | ${r.status} |`,
    ),
    '',
    '- 黄灯 ≈ t_pr + v/(2a)；全红 ≈ (W+L)/v · 工程示意',
  ].join('\n')
}

export function intergreenCsv(rows: IntergreenRow[]): string {
  return [
    'phase,yellow,recYellow,allRed,recAllRed,status,speedKmh,widthM',
    ...rows.map((r) =>
      [
        JSON.stringify(r.phaseName),
        r.yellowSec,
        r.recYellow,
        r.allRedSec,
        r.recAllRed,
        r.status,
        r.speedKmh,
        r.widthM,
      ].join(','),
    ),
  ].join('\n')
}
