/**
 * MAXBAND discrete result table for UI / export (correct BandResult fields).
 */
import type { BandCorridor, BandResult } from '../types'
import { optimizeBandMaxbandDiscrete } from './maxband'
import { measureCorridor } from './corridor'

export type MaxbandNodeRow = {
  name: string
  distanceM: number
  offsetSec: number
  locked: boolean
  greenRatio: number
  cycleSec: number
}

export type MaxbandReport = {
  method: string
  speedKmh: number
  forwardSec: number
  backwardSec: number
  bandwidthRatio: number
  bandwidthSec: number
  nodes: MaxbandNodeRow[]
  notes: string[]
  honesty: string
}

export function buildMaxbandReport(corridor: BandCorridor): MaxbandReport {
  const useMax = corridor.method === 'maxband-discrete'
  const r: BandResult = useMax ? optimizeBandMaxbandDiscrete(corridor) : measureCorridor(corridor)
  const offMap = new Map(r.offsets.map((o) => [o.id, o.offsetSec]))
  const notes = useMax
    ? ['MAXBAND 离散网格搜索', `方法 ${r.method}`]
    : ['当前非 maxband-discrete，表为 measureCorridor 结果']
  return {
    method: r.method,
    speedKmh: r.standardSpeedKmh,
    forwardSec: r.forwardBandwidthSec ?? r.bandwidthSec,
    backwardSec: r.backwardBandwidthSec ?? 0,
    bandwidthRatio: r.bandwidthRatio,
    bandwidthSec: r.bandwidthSec,
    nodes: corridor.nodes.map((n) => ({
      name: n.name,
      distanceM: n.distanceM,
      offsetSec: offMap.get(n.id) ?? n.offsetSec,
      locked: !!n.lockedOffset,
      greenRatio: n.greenRatio,
      cycleSec: n.cycleSec,
    })),
    notes,
    honesty: '离散搜索代理 · 非商业 MIP',
  }
}

export function maxbandReportMarkdown(name: string, rep: MaxbandReport): string {
  return [
    `# ${name} · 绿波/MAXBAND`,
    '',
    `- 方法 ${rep.method} · V=${rep.speedKmh} km/h`,
    `- b↑ ${rep.forwardSec.toFixed(1)}s · b↓ ${rep.backwardSec.toFixed(1)}s · 比 ${(rep.bandwidthRatio * 100).toFixed(1)}%`,
    `- ${rep.honesty}`,
    ...rep.notes.map((n) => `- ${n}`),
    '',
    '| 路口 | 桩号 | o(s) | λ | C | 锁 |',
    '|------|-----:|-----:|--:|--:|----|',
    ...rep.nodes.map(
      (n) =>
        `| ${n.name} | ${n.distanceM.toFixed(0)} | ${n.offsetSec.toFixed(1)} | ${n.greenRatio.toFixed(2)} | ${n.cycleSec} | ${n.locked ? 'Y' : ''} |`,
    ),
  ].join('\n')
}

export function maxbandReportCsv(rep: MaxbandReport): string {
  const head = 'name,distanceM,offsetSec,greenRatio,cycleSec,locked'
  const rows = rep.nodes.map(
    (n) =>
      `${JSON.stringify(n.name)},${n.distanceM},${n.offsetSec},${n.greenRatio},${n.cycleSec},${n.locked ? 1 : 0}`,
  )
  return [head, ...rows].join('\n')
}
