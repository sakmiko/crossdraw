/**
 * Approach storage length check: queue demand vs entry-widen bay.
 * Homology: analysis lanes + widen.entryWidenLengthM + queue storage estimate.
 * Engineering schematic — not trajectory simulation.
 */
import type { AnalysisResult, Approach, SignalScheme } from '../types'
import { estimateQueueStorage } from '../analysis/queueStorage'

export type StorageCheckRow = {
  approachId: string
  approachName: string
  movement: string
  volumeVph: number
  redSec: number
  lanes: number
  queueM: number
  bayM: number
  taperM: number
  availableM: number
  ratio: number
  status: 'ok' | 'tight' | 'overflow'
  note: string
}

function redForMovement(signal: SignalScheme, approachId: string, movement: string): number {
  const C = Math.max(1, signal.cycleSec)
  let g = 0
  for (const ph of signal.phases) {
    if (ph.isOverlap) continue
    const rel = ph.releases?.[approachId]
    if (rel && (rel as string[]).includes(movement)) {
      g += ph.greenSec
    }
  }
  return Math.max(0, C - g)
}

/** Bay usable length ≈ entry widen length (taper not fully usable for storage). */
export function availableBayM(ap: Approach): { bayM: number; taperM: number; availableM: number } {
  const bayM = Math.max(0, ap.widen?.entryWidenLengthM ?? 0)
  const taperM = Math.max(0, ap.widen?.entryTaperM ?? 0)
  // Prefer full bay; if no widen bay, treat short stub as 20m default schematic
  const availableM = bayM > 0 ? bayM : 20
  return { bayM, taperM, availableM }
}

export function collectStorageCheckRows(
  approaches: Approach[],
  signal: SignalScheme,
  analysis: AnalysisResult,
): StorageCheckRow[] {
  const rows: StorageCheckRow[] = []
  for (const lane of analysis.lanes) {
    const ap = approaches.find((a) => a.id === lane.approachId)
    if (!ap) continue
    const mov = lane.movement
    const red = redForMovement(signal, lane.approachId, mov)
    const entryLanes = Math.max(
      1,
      ap.entryLanes.filter((l) => (l.movements as string[]).includes(mov)).length || 1,
    )
    const q = estimateQueueStorage({
      approachName: ap.name,
      movement: mov,
      volumeVph: lane.volumePeak,
      redSec: red,
      cycleSec: signal.cycleSec,
      lanes: entryLanes,
    })
    const bay = availableBayM(ap)
    const ratio = bay.availableM > 0 ? q.storageM / bay.availableM : 9
    let status: StorageCheckRow['status'] = 'ok'
    if (ratio > 1.0) status = 'overflow'
    else if (ratio > 0.85) status = 'tight'
    const note =
      status === 'overflow'
        ? '排队>展宽段 · 建议加长或减流量'
        : status === 'tight'
          ? '接近展宽容量'
          : bay.bayM > 0
            ? '展宽段可覆盖'
            : '无展宽·按20m示意'

    rows.push({
      approachId: ap.id,
      approachName: ap.name,
      movement: mov,
      volumeVph: lane.volumePeak,
      redSec: red,
      lanes: entryLanes,
      queueM: q.storageM,
      bayM: bay.bayM,
      taperM: bay.taperM,
      availableM: bay.availableM,
      ratio,
      status,
      note,
    })
  }
  return rows
}

export function storageCheckSummary(rows: StorageCheckRow[]): {
  total: number
  overflow: number
  tight: number
  ok: number
  maxRatio: number
} {
  return {
    total: rows.length,
    overflow: rows.filter((r) => r.status === 'overflow').length,
    tight: rows.filter((r) => r.status === 'tight').length,
    ok: rows.filter((r) => r.status === 'ok').length,
    maxRatio: rows.reduce((m, r) => Math.max(m, r.ratio), 0),
  }
}

export function storageCheckMarkdown(projectName: string, rows: StorageCheckRow[]): string {
  const s = storageCheckSummary(rows)
  return [
    `# ${projectName} · 进口道储存长度校核`,
    '',
    `- 车道组 **${s.total}** · 溢出 **${s.overflow}** · 紧张 **${s.tight}** · 正常 **${s.ok}** · 最大利用率 **${(s.maxRatio * 100).toFixed(0)}%**`,
    '',
    '| 进口 | 转向 | 排队m | 展宽m | 可用m | 利用率 | 状态 |',
    '|------|------|------:|------:|------:|-------:|------|',
    ...rows.map(
      (r) =>
        `| ${r.approachName} | ${r.movement} | ${r.queueM.toFixed(1)} | ${r.bayM.toFixed(0)} | ${r.availableM.toFixed(0)} | ${(r.ratio * 100).toFixed(0)}% | ${r.status} |`,
    ),
    '',
    '## 规则',
    '- 排队示意：红灯到达 × 车头间距 / 车道',
    '- 可用长度：入口展宽段长（无展宽时按 20m 示意）',
    '- 溢出 = 排队 > 可用；紧张 = 利用率 > 85%',
    '- 工程示意，非轨迹仿真',
  ].join('\n')
}

export function storageCheckCsv(rows: StorageCheckRow[]): string {
  return [
    'approach,movement,volumeVph,redSec,lanes,queueM,bayM,availableM,ratio,status',
    ...rows.map((r) =>
      [
        JSON.stringify(r.approachName),
        r.movement,
        r.volumeVph.toFixed(1),
        r.redSec.toFixed(1),
        r.lanes,
        r.queueM.toFixed(2),
        r.bayM.toFixed(2),
        r.availableM.toFixed(2),
        r.ratio.toFixed(3),
        r.status,
      ].join(','),
    ),
  ].join('\n')
}
