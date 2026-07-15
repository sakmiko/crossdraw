import type { AnalysisResult, Project } from '@/domain/types'

export function analysisToCsv(result: AnalysisResult): string {
  const rows = [
    'approach,movement,volume_peak,sat_flow,green_ratio,capacity,vc,delay_s,queue_m,los_delay,los_vc,los_final',
    ...result.lanes.map(
      (l) =>
        [
          csv(l.approachName),
          l.movement,
          l.volumePeak.toFixed(2),
          l.satFlow.toFixed(1),
          l.greenRatio.toFixed(3),
          l.capacity.toFixed(1),
          l.vc.toFixed(3),
          l.delaySec.toFixed(2),
          l.queueM.toFixed(2),
          result.losByDelay,
          result.losByVc,
          result.losFinal,
        ].join(','),
    ),
    '',
    `summary_avg_vc,${result.avgVc.toFixed(3)}`,
    `summary_avg_delay_s,${result.avgDelay.toFixed(2)}`,
    `summary_avg_queue_m,${result.avgQueueM.toFixed(2)}`,
    `summary_los,${result.losFinal}`,
  ]
  return rows.join('\n') + '\n'
}

export function analysisToExcelHtml(projectName: string, result: AnalysisResult): string {
  // Excel opens HTML tables; keeps zero heavy deps while producing .xls-compatible file
  const head = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>`
  const title = `<h2>${escapeHtml(projectName)} — 交叉口评价</h2>`
  const summary = `<p>平均 v/c=${result.avgVc.toFixed(3)}；车均延误=${result.avgDelay.toFixed(1)} s；平均排队=${result.avgQueueM.toFixed(1)} m；LOS=${result.losFinal}</p>`
  const table = [
    '<table border="1"><tr><th>进口</th><th>转向</th><th>高峰量</th><th>饱和流率</th><th>绿信比</th><th>通行能力</th><th>v/c</th><th>延误(s)</th><th>排队(m)</th></tr>',
    ...result.lanes.map(
      (l) =>
        `<tr><td>${escapeHtml(l.approachName)}</td><td>${l.movement}</td><td>${l.volumePeak.toFixed(1)}</td><td>${l.satFlow.toFixed(0)}</td><td>${l.greenRatio.toFixed(3)}</td><td>${l.capacity.toFixed(0)}</td><td>${l.vc.toFixed(3)}</td><td>${l.delaySec.toFixed(1)}</td><td>${l.queueM.toFixed(1)}</td></tr>`,
    ),
    '</table>',
  ].join('')
  return head + title + summary + table + '</body></html>'
}

export function compareSchemesCsv(
  rows: { channel: string; flow: string; signal: string; avgVc: number; avgDelay: number; los: string }[],
): string {
  return [
    'channel,flow,signal,avg_vc,avg_delay_s,los',
    ...rows.map((r) => [csv(r.channel), csv(r.flow), csv(r.signal), r.avgVc.toFixed(3), r.avgDelay.toFixed(2), r.los].join(',')),
  ].join('\n') + '\n'
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function collectCompareRows(project: Project, analyze: Function): {
  channel: string
  flow: string
  signal: string
  avgVc: number
  avgDelay: number
  los: string
}[] {
  const out: { channel: string; flow: string; signal: string; avgVc: number; avgDelay: number; los: string }[] = []
  for (const ch of project.channelizationSchemes) {
    for (const fl of ch.flowSchemes) {
      for (const sg of fl.signalSchemes) {
        const r = analyze(ch.approaches, fl, sg) as AnalysisResult
        out.push({
          channel: ch.name,
          flow: fl.name,
          signal: sg.name,
          avgVc: r.avgVc,
          avgDelay: r.avgDelay,
          los: r.losFinal,
        })
      }
    }
  }
  return out
}
