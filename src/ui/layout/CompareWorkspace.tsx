/**
 * Scheme compare workspace — multi-scheme evaluation table and exports.
 * Extracted from App (v0.5.44).
 */
import { useMemo } from 'react'
import type { Project } from '@/domain/types'
import { analyzeIntersection } from '@/domain/analysis'
import { CompareCharts, SchemeCompareBoard } from '@/ui/charts/ChartPanels'
import { collectCompareRows, compareSchemesCsv } from '@/io/report'
import { collectSchemeSnapshots, schemeTimingStripSvg, schemeMetricsCompareSvg } from '@/ui/charts/schemeCompareDiagrams'
import { exportJsonFile, exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'
import { vcHeatColor } from '@/ui/charts/svgCharts'

export type CompareWorkspaceProps = {
  project: Project
  theme: 'dark' | 'light'
  onActivateScheme: (channelName: string, flowName: string, signalName: string) => void
}

export function CompareWorkspace({ project, theme, onActivateScheme }: CompareWorkspaceProps) {
  const rows = useMemo(() => collectCompareRows(project, analyzeIntersection), [project])

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="panel-header">
        <h2 style={{ margin: 0 }}>方案比选</h2>
        <span className="hint">渠化 × 流量 × 信号 组合评价</span>
      </div>
      <p className="hint">对方案树中全部渠化/流量/信号组合运行同一评价模型；点击行可激活对应方案。</p>
      <CompareCharts
        rows={rows.map((r) => ({
          label: `${r.channel}/${r.signal}`,
          avgVc: r.avgVc,
          avgDelay: r.avgDelay,
          los: r.los,
        }))}
      />
      <SchemeCompareBoard project={project} />
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table className="table">
          <thead>
            <tr>
              <th>渠化</th>
              <th>流量</th>
              <th>信号</th>
              <th>v/c</th>
              <th>延误</th>
              <th>LOS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.channel}</td>
                <td>{r.flow}</td>
                <td>{r.signal}</td>
                <td>
                  <span className="vc-chip" style={{ background: vcHeatColor(r.avgVc) }}>
                    {r.avgVc.toFixed(2)}
                  </span>
                </td>
                <td>{r.avgDelay.toFixed(1)}</td>
                <td>
                  <span className={`los-badge los-${r.los}`}>{r.los}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => onActivateScheme(r.channel, r.flow, r.signal)}
                  >
                    打开
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="toolbar" style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() => {
            downloadText(`${project.name}-compare.csv`, compareSchemesCsv(rows), 'text/csv')
          }}
        >
          导出比选 CSV
        </button>
        <button
          type="button"
          onClick={() => {
            exportJsonFile(`${project.name}-compare.json`, rows)
          }}
        >
          导出比选 JSON
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => {
            const snaps = collectSchemeSnapshots(project, analyzeIntersection)
            exportSvgFile(`${project.name}-compare-timing.svg`, schemeTimingStripSvg(snaps, { max: 4, theme }))
            exportSvgFile(
              `${project.name}-compare-delay.svg`,
              schemeMetricsCompareSvg(snaps, { metric: 'delay' }),
            )
            exportSvgFile(`${project.name}-compare-vc.svg`, schemeMetricsCompareSvg(snaps, { metric: 'vc' }))
          }}
        >
          导出并排配时图
        </button>
      </div>
      <p className="hint">快捷键 6 · 从分析页迁出的独立比选工作区</p>
    </div>
  )
}
