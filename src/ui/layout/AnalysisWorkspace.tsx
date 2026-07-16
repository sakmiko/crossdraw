/**
 * Analysis evaluation workspace — metrics, charts, lane table, exports.
 * Extracted from App (v0.5.42).
 */
import type {
  AnalysisResult,
  Approach,
  ChannelizationScheme,
  FlowScheme,
  Project,
  SignalScheme,
} from '@/domain/types'
import type { AnalysisIntegrity } from '@/domain/analysis/integrity'
import { analyzeIntersection } from '@/domain/analysis'
import { analyzeUnsignalized, unsignalizedMarkdown } from '@/domain/analysis/unsignalized'
import { AnalysisCharts, CompareCharts } from '@/ui/charts/ChartPanels'
import { unsignalizedChartSvg } from '@/ui/charts/unsignalizedChart'
import { useMemo } from 'react'
import { AnalysisLaneTable } from '@/ui/layout/AnalysisLaneTable'
import { collectCompareRows, compareSchemesCsv } from '@/io/report'
import { exportVissimCsvBundle } from '@/io/vissimCsv'
import { buildVissimImportPack } from '@/io/vissimInpxSkeleton'
import { buildVissimInpxPack } from '@/io/vissimInpx'
import { buildMultiPageReportHtml } from '@/io/multiPageReport'
import { analysisMarkdown, exportSvgFile } from '@/io/exportCharts'
import { buildAnalysisReportSvg } from '@/io/analysisReportSvg'
import { downloadText } from '@/io/download'

export type AnalysisWorkspaceProps = {
  project: Project
  analysis: AnalysisResult
  analysisIntegrity: AnalysisIntegrity
  channel: ChannelizationScheme | null
  flow: FlowScheme | null
  signal: SignalScheme | null
  theme: 'dark' | 'light'
  onOpenCompare: () => void
  onExportProPack: () => void
}

export function AnalysisWorkspace({
  project,
  analysis,
  analysisIntegrity,
  channel,
  flow,
  signal,
  theme,
  onOpenCompare,
  onExportProPack,
}: AnalysisWorkspaceProps) {
  const compareRows = collectCompareRows(project, analyzeIntersection)
  const unsig = useMemo(() => {
    if (!channel || !flow || !signal) return null
    if (!signal.unsignalized) return null
    return analyzeUnsignalized(channel.approaches, flow, signal, channel.intersectionType)
  }, [channel, flow, signal])

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="panel-header">
        <h2 style={{ margin: 0 }}>评价分析</h2>
        <span className={`integrity-badge ${analysisIntegrity.ok ? 'ok' : 'bad'}`}>
          {analysisIntegrity.ok ? '图/表同源 ✓' : '同源校验失败'}
        </span>
      </div>
      {!analysisIntegrity.ok && (
        <p className="hint" style={{ color: '#dc2626' }}>
          汇总与车道表重算不一致：Δv/c={analysisIntegrity.deltaVc.toExponential(2)} · Δ延误=
          {analysisIntegrity.deltaDelay.toExponential(2)}
        </p>
      )}
      <div className="metric-grid">
        <div className="metric">
          <div className="label">平均 v/c</div>
          <div className="value">{analysis.avgVc.toFixed(3)}</div>
        </div>
        <div className="metric">
          <div className="label">车均延误</div>
          <div className="value">
            {analysis.avgDelay.toFixed(1)}
            <small style={{ fontSize: 12 }}> s</small>
          </div>
        </div>
        <div className="metric">
          <div className="label">平均排队</div>
          <div className="value">
            {analysis.avgQueueM.toFixed(1)}
            <small style={{ fontSize: 12 }}> m</small>
          </div>
        </div>
        <div
          className={`metric los-${analysis.losFinal}${
            analysis.losFinal === 'F' || analysis.losFinal === 'E' ? ' danger' : ''
          }`}
        >
          <div className="label">服务水平</div>
          <div className="value">{analysis.losFinal}</div>
          <div className="sub">与图表/表格同源</div>
        </div>
      </div>
      <AnalysisCharts analysis={analysis} />
      {unsig && (
        <div style={{ marginTop: 12 }}>
          <div className="chart-title">
            <span>无信号 / 环形能力</span>
            <small>{unsig.mode} · LOS {unsig.los}</small>
          </div>
          <div
            className="chart-svg-host chart-svg-host--pro"
            dangerouslySetInnerHTML={{ __html: unsignalizedChartSvg(unsig, { width: 520 }) }}
          />
          <p className="hint quiet" style={{ marginTop: 4 }}>
        {unsig.notes[0]}
      </p>
      <button
        type="button"
        className="ghost"
        style={{ marginTop: 4 }}
        onClick={() =>
          downloadText(
            `${project.name}-unsignalized.md`,
            unsignalizedMarkdown(project.name, unsig),
            'text/markdown',
          )
        }
      >
        导出简报
      </button>
        </div>
      )}
      <AnalysisLaneTable analysis={analysis} projectName={project.name} />
      <CompareCharts
        rows={compareRows.map((r) => ({
          label: `${r.channel}/${r.signal}`,
          avgVc: r.avgVc,
          avgDelay: r.avgDelay,
          los: r.los,
        }))}
      />
      <details className="subpanel">
        <summary className="subpanel-summary">导出与报告</summary>
        <div className="subpanel-body toolbar dense">
        <button
          type="button"
          onClick={() => {
            downloadText(`${project.name}-compare.csv`, compareSchemesCsv(compareRows), 'text/csv')
          }}
        >
          对比 CSV
        </button>
        <button
          type="button"
          onClick={() => {
            if (!channel || !flow || !signal) return
            const pack = buildVissimInpxPack(project.name, channel.approaches, flow, signal)
            downloadText(`${project.name}-vissim-README.md`, pack.readme, 'text/markdown')
            downloadText(`${project.name}.inpx.xml`, pack.xml, 'application/xml')
            downloadText(`${project.name}-vissim-summary.json`, pack.json, 'application/json')
            downloadText(`${project.name}-vissim-links.csv`, pack.bundle.links, 'text/csv')
            downloadText(`${project.name}-vissim-routes.csv`, pack.bundle.routes, 'text/csv')
            downloadText(`${project.name}-vissim-volumes.csv`, pack.bundle.volumes, 'text/csv')
            downloadText(`${project.name}-vissim-signal.csv`, pack.bundle.signal, 'text/csv')
          }}
        >
          Vissim 交换包
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => {
            if (!channel || !flow || !signal) return
            const html = buildMultiPageReportHtml({
              project,
              channel,
              flow,
              signal,
              analysis,
              bandCorridor: project.bandCorridor,
            })
            downloadText(`${project.name}-report.html`, html, 'text/html')
          }}
        >
          多页工程报告 PDF
        </button>
        <button type="button" className="primary" onClick={onExportProPack}>
          导出专业图件包
        </button>
        <button
          type="button"
          onClick={() => {
            if (!channel || !flow || !signal) return
            const svg = buildAnalysisReportSvg({
              projectName: project.name,
              channelName: channel.name,
              signalName: signal.name,
              approaches: channel.approaches as Approach[],
              flow,
              signal,
              analysis,
              theme,
            })
            exportSvgFile(`${project.name}-analysis-board.svg`, svg)
            downloadText(
              `${project.name}-report.md`,
              analysisMarkdown(project.name, {
                avgVc: analysis.avgVc,
                avgDelay: analysis.avgDelay,
                avgQueueM: analysis.avgQueueM,
                losFinal: analysis.losFinal,
                cycleSec: signal.cycleSec,
                notes: ['分析拼图 SVG 已同步导出'],
              }),
              'text/markdown',
            )
          }}
        >
          导出分析拼图
        </button>
        </div>
      </details>
      <div className="toolbar dense" style={{ marginTop: 8 }}>
        <button type="button" className="primary" onClick={onOpenCompare}>
          方案比选
        </button>
      </div>
      <details className="subpanel">
        <summary className="subpanel-summary">方案对比摘要 <span className="subpanel-tag">{compareRows.length}</span></summary>
        <div className="subpanel-body">
      <div className="section-title" style={{ display: 'none' }}>方案对比摘要</div>
      <table className="table">
        <thead>
          <tr>
            <th>渠化</th>
            <th>流量</th>
            <th>信号</th>
            <th>v/c</th>
            <th>延误</th>
            <th>LOS</th>
          </tr>
        </thead>
        <tbody>
          {compareRows.map((r, i) => (
            <tr key={i}>
              <td>{r.channel}</td>
              <td>{r.flow}</td>
              <td>{r.signal}</td>
              <td>{r.avgVc.toFixed(2)}</td>
              <td>{r.avgDelay.toFixed(1)}</td>
              <td>{r.los}</td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
      </details>
    </div>
  )
}
