import type { AnalysisResult, Project } from '@/domain/types'
import {
  ANALYSIS_CSV_HEADER,
  analysisLanesToCsvRows,
  enrichLaneRows,
  filterAnalysisLanes,
  sortAnalysisLanes,
  type AnalysisFilter,
  type AnalysisSortKey,
} from '@/domain/analysis/laneTable'

export function analysisToCsv(
  result: AnalysisResult,
  opts?: { filter?: AnalysisFilter; sortKey?: AnalysisSortKey; sortDir?: 'asc' | 'desc' },
): string {
  let rows = enrichLaneRows(result)
  if (opts?.filter) rows = filterAnalysisLanes(rows, opts.filter)
  if (opts?.sortKey) rows = sortAnalysisLanes(rows, opts.sortKey, opts.sortDir ?? 'desc')
  const body = [
    ANALYSIS_CSV_HEADER,
    ...analysisLanesToCsvRows(rows),
    '',
    `summary_avg_vc,${result.avgVc.toFixed(3)}`,
    `summary_avg_delay_s,${result.avgDelay.toFixed(2)}`,
    `summary_avg_queue_m,${result.avgQueueM.toFixed(2)}`,
    `summary_los,${result.losFinal}`,
    `summary_rows_exported,${rows.length}`,
  ]
  return body.join('\n') + '\n'
}

export function analysisToExcelHtml(projectName: string, result: AnalysisResult): string {
  // Excel opens HTML tables; keeps zero heavy deps while producing .xls-compatible file
  const head = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>`
  const title = `<h2>${escapeHtml(projectName)} — 交叉口评价</h2>`
  const summary = `<p>平均 v/c=${result.avgVc.toFixed(3)}；车均延误=${result.avgDelay.toFixed(1)} s；平均排队=${result.avgQueueM.toFixed(1)} m；LOS=${result.losFinal}</p>`
  const lanes = enrichLaneRows(result)
  const table = [
    '<table border="1"><tr><th>进口</th><th>转向</th><th>高峰量</th><th>饱和流率</th><th>绿信比</th><th>通行能力</th><th>v/c</th><th>延误(s)</th><th>排队(m)</th><th>LOS延误</th><th>LOS_v/c</th><th>LOS行</th></tr>',
    ...lanes.map(
      (l) =>
        `<tr><td>${escapeHtml(l.approachName)}</td><td>${l.movement}</td><td>${l.volumePeak.toFixed(1)}</td><td>${l.satFlow.toFixed(0)}</td><td>${l.greenRatio.toFixed(3)}</td><td>${l.capacity.toFixed(0)}</td><td>${l.vc.toFixed(3)}</td><td>${l.delaySec.toFixed(1)}</td><td>${l.queueM.toFixed(1)}</td><td>${l.losDelay}</td><td>${l.losVc}</td><td>${l.losFinal}</td></tr>`,
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
