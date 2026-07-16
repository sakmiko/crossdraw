/**
 * Queue storage length sketch: L ≈ (n_veh * spacing) / lanes
 * n_veh ≈ q * r / 3600 (arrivals in red) — engineering schematic.
 */
export type QueueEstimate = {
  approachName: string
  movement: string
  volumeVph: number
  redSec: number
  cycleSec: number
  lanes: number
  vehicles: number
  storageM: number
  note: string
}

export function estimateQueueStorage(opts: {
  approachName: string
  movement: string
  volumeVph: number
  redSec: number
  cycleSec: number
  lanes: number
  spacingM?: number
}): QueueEstimate {
  const C = Math.max(1, opts.cycleSec)
  const lanes = Math.max(1, opts.lanes)
  const spacing = opts.spacingM ?? 7
  // arrivals during red
  const veh = (opts.volumeVph * Math.max(0, opts.redSec)) / 3600
  const storageM = (veh * spacing) / lanes
  return {
    approachName: opts.approachName,
    movement: opts.movement,
    volumeVph: opts.volumeVph,
    redSec: opts.redSec,
    cycleSec: C,
    lanes,
    vehicles: veh,
    storageM,
    note: '示意排队长度 · 非仿真轨迹',
  }
}

export function queueTableMarkdown(name: string, rows: QueueEstimate[]): string {
  return [
    `# ${name} · 排队长度`,
    '',
    '| 进口 | 转向 | v | 红灯s | 车道 | 车数 | 长度m |',
    '|------|------|--:|-----:|-----:|-----:|------:|',
    ...rows.map(
      (r) =>
        `| ${r.approachName} | ${r.movement} | ${Math.round(r.volumeVph)} | ${r.redSec.toFixed(0)} | ${r.lanes} | ${r.vehicles.toFixed(1)} | ${r.storageM.toFixed(1)} |`,
    ),
  ].join('\n')
}
