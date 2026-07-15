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
import { AnalysisCharts, CompareCharts } from '@/ui/charts/ChartPanels'
import { AnalysisLaneTable } from '@/ui/layout/AnalysisLaneTable'
import { collectCompareRows, compareSchemesCsv } from '@/io/report'
import { exportVissimCsvBundle } from '@/io/vissimCsv'
import { buildVissimImportPack } from '@/io/vissimInpxSkeleton'
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
      <p className="hint" style={{ marginTop: 8 }}>
        平均饱和度 {analysis.avgVc.toFixed(3)} · 车均延误 {analysis.avgDelay.toFixed(1)} s · 排队{' '}
        {analysis.avgQueueM.toFixed(1)} m · LOS {analysis.losFinal}
      </p>
      <AnalysisLaneTable analysis={analysis} projectName={project.name} />
      <CompareCharts
        rows={compareRows.map((r) => ({
          label: `${r.channel}/${r.signal}`,
          avgVc: r.avgVc,
          avgDelay: r.avgDelay,
          los: r.los,
        }))}
      />
      <div className="toolbar" style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() => {
            downloadText(`${project.name}-compare.csv`, compareSchemesCsv(compareRows), 'text/csv')
          }}
        >
          多方案对比 CSV
        </button>
        <button
          type="button"
          onClick={() => {
            if (!channel || !flow || !signal) return
            const pack = buildVissimImportPack(project.name, channel.approaches, flow, signal)
            downloadText(`${project.name}-vissim-README.md`, pack.readme, 'text/markdown')
            downloadText(`${project.name}-vissim-links.csv`, pack.bundle.links, 'text/csv')
            downloadText(`${project.name}-vissim-routes.csv`, pack.bundle.routes, 'text/csv')
            downloadText(`${project.name}-vissim-volumes.csv`, pack.bundle.volumes, 'text/csv')
            downloadText(`${project.name}-vissim-signal.csv`, pack.bundle.signal, 'text/csv')
          }}
        >
          Vissim 导入骨架
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
      <div className="toolbar" style={{ marginTop: 8 }}>
        <button type="button" className="primary" onClick={onOpenCompare}>
          打开方案比选工作区
        </button>
      </div>
      <div className="section-title">方案对比摘要</div>
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
  )
}
