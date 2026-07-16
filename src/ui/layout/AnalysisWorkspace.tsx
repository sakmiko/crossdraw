/**
 * Analysis evaluation workspace — metrics, charts, lane table, exports.
 * Extracted from App (v0.5.42).
 */
import { computeMovementCapacities } from '@/domain/analysis/movementSat'
import { websterLostTime } from '@/domain/analysis/lostTime'
import { applyPhfToHourly } from '@/domain/analysis/phf'
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
import { unsignalizedPlanSvg, unsignalizedLegsCsv } from '@/ui/charts/unsignalizedPlan'
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
import {
  professionalAnalysisPlanPackSvg,
  analysisPlanPackMarkdown,
  analysisPlanPackCsv,
} from '@/ui/charts/professionalAnalysisPlanPack' 

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
  onToggleUnsignalized?: (v: boolean) => void
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
  onToggleUnsignalized,
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

      <div className="toolbar dense" style={{ marginTop: 10, marginBottom: 8 }}>
        <button
          type="button"
          className="primary"
          disabled={!channel}
          onClick={() => {
            if (!channel) return
            exportSvgFile(
              `${project.name}-评价平面图合集.svg`,
              professionalAnalysisPlanPackSvg(channel.approaches, analysis, {
                cellSize: 440,
                projectName: project.name,
                channelName: channel.name,
                signalName: signal?.name,
              }),
            )
          }}
        >
          四指标平面合图
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() =>
            downloadText(
              `${project.name}-评价合集.md`,
              analysisPlanPackMarkdown(project.name, analysis, {
                channel: channel?.name,
                signal: signal?.name,
              }),
              'text/markdown',
            )
          }
        >
          合集 MD
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() =>
            downloadText(`${project.name}-评价车道.csv`, analysisPlanPackCsv(analysis), 'text/csv')
          }
        >
          车道 CSV
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            if (!channel || !flow || !signal) return
            downloadText(
              `${project.name}-report.html`,
              buildMultiPageReportHtml({
                project,
                channel,
                flow,
                signal,
                analysis,
                bandCorridor: project.bandCorridor,
              }),
              'text/html',
            )
          }}
        >
          多页工程报告
        </button>
      </div>

      <AnalysisCharts analysis={analysis} />
      <div className="rg-section" style={{ marginTop: 12 }}>
        <div className="rg-section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          无信号 / 环形评价
          <label className="check-inline" style={{ fontWeight: 400, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={!!signal?.unsignalized}
              onChange={(e) => onToggleUnsignalized?.(e.target.checked)}
            />{' '}
            启用无信号模式
          </label>
        </div>
        {!signal?.unsignalized && (
          <p className="hint quiet">勾选后按 TWSC 间隙接受 / 环形进口能力示意评价（非完整 HCM / SIDRA）。</p>
        )}
        {unsig && channel && (
          <>
            <div className="metric-grid" style={{ marginBottom: 8 }}>
              <div className="metric">
                <div className="label">模式</div>
                <div className="value" style={{ fontSize: 16 }}>{unsig.mode}</div>
              </div>
              <div className="metric">
                <div className="label">均延误</div>
                <div className="value">{unsig.avgDelay.toFixed(1)}<small>s</small></div>
              </div>
              <div className="metric">
                <div className="label">均 v/c</div>
                <div className="value">{unsig.avgVc.toFixed(2)}</div>
              </div>
              <div className={`metric los-${unsig.los}`}>
                <div className="label">LOS</div>
                <div className="value">{unsig.los}</div>
              </div>
            </div>
            <div
              className="chart-svg-host chart-svg-host--pro"
              dangerouslySetInnerHTML={{
                __html: unsignalizedPlanSvg(channel.approaches, unsig, { size: 420 }),
              }}
            />
            <div
              className="chart-svg-host chart-svg-host--pro"
              style={{ marginTop: 8 }}
              dangerouslySetInnerHTML={{ __html: unsignalizedChartSvg(unsig, { width: 520 }) }}
            />
            <div className="toolbar dense" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  exportSvgFile(
                    `${project.name}-无信号平面.svg`,
                    unsignalizedPlanSvg(channel.approaches, unsig, { size: 560 }),
                  )
                }
              >
                平面图
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  downloadText(
                    `${project.name}-unsignalized.md`,
                    unsignalizedMarkdown(project.name, unsig),
                    'text/markdown',
                  )
                }
              >
                MD
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  downloadText(
                    `${project.name}-unsignalized.csv`,
                    unsignalizedLegsCsv(unsig),
                    'text/csv',
                  )
                }
              >
                CSV
              </button>
            </div>
            <p className="hint quiet">{unsig.notes.join(' · ')}</p>
          </>
        )}
      </div>
      <AnalysisLaneTable analysis={analysis} projectName={project.name} />
      <CompareCharts
        rows={compareRows.map((r) => ({
          label: `${r.channel}/${r.signal}`,
          avgVc: r.avgVc,
          avgDelay: r.avgDelay,
          los: r.los,
        }))}
      />
      
      <details className="subpanel" open>
        <summary className="subpanel-summary">转向能力 · 排队 · 损失时间</summary>
        <div className="subpanel-body">
          {flow && channel && (
            <table className="table table-dense">
              <thead><tr><th>进口</th><th>向</th><th>v/c</th></tr></thead>
              <tbody>
                {computeMovementCapacities(channel.approaches, flow).slice(0, 12).map((r) => (
                  <tr key={r.approachId + r.movement}>
                    <td>{r.approachName.replace('进口','')}</td>
                    <td>{r.movement}</td>
                    <td className="num" style={{ fontWeight: 700, color: r.vc > 0.9 ? 'var(--block)' : 'var(--accent)' }}>{r.vc.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {signal && (
            <div className="metric-grid" style={{ marginTop: 8 }}>
              <div className="metric">
                <div className="label">损失 L</div>
                <div className="value">{websterLostTime({ mainPhaseCount: signal.phases.filter((p) => !p.isOverlap).length }).L}<small>s</small></div>
              </div>
              {flow && (
                <div className="metric">
                  <div className="label">PHF设计小时</div>
                  <div className="value">{applyPhfToHourly(1000, flow.phf ?? 0.92).designHourly.toFixed(0)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </details>
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
