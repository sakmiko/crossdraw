/**
 * Queue storage review board — L ≈ n_veh * spacing / lanes during red.
 * Homology: analysis lanes + signal cycle/green. Engineering schematic.
 */
import type { AnalysisResult, Approach, SignalScheme } from '@/domain/types'
import { estimateQueueStorage, type QueueEstimate } from '@/domain/analysis/queueStorage'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function redForLane(signal: SignalScheme, approachId: string, movement: string): number {
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

export function collectQueueStorageRows(
  approaches: Approach[],
  signal: SignalScheme,
  analysis: AnalysisResult,
): QueueEstimate[] {
  const rows: QueueEstimate[] = []
  for (const lane of analysis.lanes) {
    const ap = approaches.find((a) => a.id === lane.approachId)
    if (!ap) continue
    const mov = lane.movement
    const red = redForLane(signal, lane.approachId, mov)
    const entryLanes = Math.max(
      1,
      ap.entryLanes.filter((l) => (l.movements as string[]).includes(mov)).length || 1,
    )
    rows.push(
      estimateQueueStorage({
        approachName: ap.name,
        movement: mov,
        volumeVph: lane.volumePeak,
        redSec: red,
        cycleSec: signal.cycleSec,
        lanes: entryLanes,
      }),
    )
  }
  return rows
}

export function queueStorageBoardSvg(rows: QueueEstimate[], opts: { width?: number } = {}): string {
  const W = opts.width ?? 800
  const rowH = 26
  const top = 44
  const H = top + 28 + Math.max(1, rows.length) * rowH + 24
  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="8" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="24" y="32" fill="#0f172a" font-size="14" font-weight="700" font-family="system-ui,sans-serif">排队储存</text>`
  const heads = ['进口', '转向', 'v', '红s', '车道', '车数', 'L(m)']
  const xs = [24, 140, 220, 300, 380, 460, 560]
  heads.forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${top}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })
  rows.forEach((r, i) => {
    const y = top + 20 + i * rowH
    const vals = [
      r.approachName.slice(0, 10),
      r.movement,
      String(Math.round(r.volumeVph)),
      r.redSec.toFixed(0),
      String(r.lanes),
      r.vehicles.toFixed(1),
      r.storageM.toFixed(1),
    ]
    vals.forEach((v, j) => {
      g += `<text x="${xs[j]}" y="${y}" fill="#0f172a" font-size="11">${esc(v)}</text>`
    })
  })
  if (!rows.length) {
    g += `<text x="24" y="${top + 28}" fill="#94a3b8" font-size="12">无车道组</text>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`
}

export function queueStorageCsv(rows: QueueEstimate[]): string {
  return [
    'approach,movement,volumeVph,redSec,lanes,vehicles,storageM',
    ...rows.map((r) =>
      [
        JSON.stringify(r.approachName),
        r.movement,
        r.volumeVph.toFixed(1),
        r.redSec.toFixed(1),
        r.lanes,
        r.vehicles.toFixed(2),
        r.storageM.toFixed(2),
      ].join(','),
    ),
  ].join('\n')
}
