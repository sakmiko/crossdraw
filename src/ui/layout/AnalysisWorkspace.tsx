/**
 * Analysis evaluation workspace — metrics, charts, lane table, exports.
 * Extracted from App (v0.5.42).
 */
import { computeMovementCapacities } from '@/domain/analysis/movementSat'
import { websterLostTime } from '@/domain/analysis/lostTime'
import { lostTimeBoardSvg, lostTimeMarkdown, lostTimeCsv } from '@/ui/charts/lostTimeBoard' 
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
import { EChart } from '@/ui/charts/EChart'
import { vcDelayOption, criticalApproachOption, storageCheckOption, queueStorageOption, lostTimeOption } from '@/ui/charts/interactiveBoards'
import { AnalysisLaneTable } from '@/ui/layout/AnalysisLaneTable'
import { collectCompareRows, compareSchemesCsv } from '@/io/report'
import { exportVissimCsvBundle } from '@/io/vissimCsv'
import { buildVissimImportPack } from '@/io/vissimInpxSkeleton'
import { buildVissimInpxPack } from '@/io/vissimInpx'
import { downloadVissimPack, vissimPackSummaryMarkdown } from '@/io/vissimPackDownload' 
import { buildMultiPageReportHtml } from '@/io/multiPageReport'
import { analysisMarkdown } from '@/io/exportCharts'
import { buildAnalysisReportSvg } from '@/io/analysisReportSvg'
import { downloadText } from '@/io/download'
import { downloadEchartsPng } from '@/io/exportEchartsPng'
import {
  collectQueueStorageRows,
  queueStorageBoardSvg,
  queueStorageCsv,
} from '@/ui/charts/queueStorageBoard'
import {
  storageCheckBoardSvg,
  collectStorageCheckRows,
  storageCheckMarkdown,
  storageCheckCsv,
} from '@/ui/charts/storageCheckBoard'
import {
  criticalApproachBoardSvg,
  criticalApproachMarkdown,
  criticalApproachCsv,
} from '@/ui/charts/criticalApproachBoard'  
import { queueTableMarkdown } from '@/domain/analysis/queueStorage'
import {
  cleanAnalysisPlanSvg,
  cleanFlowDiagramSvg,
  cleanChannelPlanSvg,
} from '@/io/cleanDrawingPack'
import {
  professionalCapacityMatrixSvg,
  capacityMatrixMarkdown,
  capacityMatrixCsv,
} from '@/ui/charts/professionalCapacityMatrix' 
import { buildA4PrintSheet, printSheetHtml } from '@/io/printSheet'
import {
  collectEngineeringPrintPanels,
  engineeringPrintManifest,
} from '@/io/engineeringPrintPack' 
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
  onApplyFullSchemeOptimize?: () => void
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
  onApplyFullSchemeOptimize,
}: AnalysisWorkspaceProps) {
  const compareRows = collectCompareRows(project, analyzeIntersection)
  const unsig = useMemo(() => {
    if (!channel || !flow || !signal) return null
    if (!signal.unsignalized) return null
    return analyzeUnsignalized(channel.approaches, flow, signal, channel.intersectionType)
  }, [channel, flow, signal])

  return (
    <div className="flat-params" style={{ marginTop: 12 }}>
      <nav className="param-jump" aria-label="参数分区">
        <a href="#an-a4">A4/VISSIM</a>
        <a href="#an-eval">评价</a>
        <a href="#an-a4">A4</a>
        <a href="#an-queue">排队</a>
      </nav>
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
        </div>
      </div>

      <div className="toolbar dense" style={{ marginTop: 10, marginBottom: 8 }}>
        <button
          type="button"
          className="primary"
          disabled={!channel || !signal || !!signal.unsignalized}
          onClick={() => onApplyFullSchemeOptimize?.()}
          title="Webster + 连续相位差 + 多走廊"
        >
          一键全方案优化
        </button>
        <button
          type="button"
          className="primary"
          disabled={!channel || !flow || !signal}
          onClick={() => {
            if (!channel || !flow || !signal) return
            const panels = collectEngineeringPrintPanels({
              project,
              channel,
              flow,
              signal,
              analysis,
              mesh: null,
              preferChannelDraft: true,
              preset: 'engineering',
            })
            const sheet = buildA4PrintSheet(panels, {
              projectName: project.name,
              schemeName: channel.name,
              paper: 'A4-landscape',
              footerNote: '渠化图框+配时+管控+流向 · 示意非测绘',
            })
            downloadText(`${project.name}-工程拼版.svg`, sheet, 'image/svg+xml')
            downloadText(
              `${project.name}-工程拼版.html`,
              printSheetHtml(sheet, `${project.name}-工程拼版`),
              'text/html',
            )
            downloadText(
              `${project.name}-工程拼版.md`,
              engineeringPrintManifest(project.name, panels),
              'text/markdown',
            )
          }}
        >
          A4 工程拼版
        </button>
        <button
          type="button"
          className="primary"
          disabled={!channel || !flow || !signal}
          title="开放交换 XML+CSV，非 PTV 专有二进制"
          onClick={() => {
            if (!channel || !flow || !signal) return
            downloadVissimPack(project.name, channel.approaches, flow, signal)
          }}
        >
          一键 VISSIM 包
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
        {!signal?.unsignalized && null}
        {unsig && channel && (
          <>
            <div className="metric-grid">
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
              style={{ marginTop: 4 }}
              dangerouslySetInnerHTML={{ __html: unsignalizedChartSvg(unsig, { width: 520 }) }}
            />

          </>
        )}
      </div>
      <AnalysisLaneTable analysis={analysis} projectName={project.name} />
      <div className="flat-section" id="analysis-echarts">
        <div className="rg-section-title" id="an-eval">
          交互分析 · v/c · 延误

        </div>
        <div className="rg-section-title" style={{ display: 'flex', alignItems: 'center' }}>
          v/c · 延误
          <button
            type="button"
            className="ghost"
            style={{ marginLeft: 'auto' }}
            onClick={() => void downloadEchartsPng('评价vc延误.png', vcDelayOption(analysis), { width: 900, height: 400 })}
          >
            导出 PNG
          </button>
        </div>
        <EChart option={vcDelayOption(analysis)} style={{ height: 300 }} />
      </div>
      <CompareCharts
        rows={compareRows.map((r) => ({
          label: `${r.channel}/${r.signal}`,
          avgVc: r.avgVc,
          avgDelay: r.avgDelay,
          los: r.los,
        }))}
      />
      
      {channel && flow && signal && !signal.unsignalized && (
        <div className="flat-section">
          <div className="rg-section-title">关键进口</div>
          <EChart option={criticalApproachOption(channel.approaches, flow, signal, analysis)} style={{ height: 280 }} />
          
          <div className="rg-section-title" style={{ marginTop: 4 }}>进口道储存校核</div>
          <EChart option={storageCheckOption(channel.approaches, signal, analysis)} style={{ height: 200 }} />
          
        </div>
      )}
      {channel && signal && !signal.unsignalized && (
        <div className="flat-section">
          <div className="rg-section-title" id="an-queue">排队储存审查</div>
          <EChart option={queueStorageOption(collectQueueStorageRows(channel.approaches, signal, analysis))} style={{ height: 200 }} />
          
        </div>
      )}
      <div className="flat-section ">
        <div className="rg-section-title">转向能力 · 排队 · 损失时间</div>
        {signal && (
          <EChart option={lostTimeOption(signal)} style={{ height: 200 }} />
        )}
        
        <div className="flat-body">
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
            <div className="metric-grid" style={{ marginTop: 4 }}>
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
      </div>
<div className="flat-section ">
        <div className="rg-section-title">导出与报告</div>
        
      </div>
      <div className="toolbar dense" style={{ marginTop: 4 }}>
        <button type="button" className="primary" onClick={onOpenCompare}>
          方案比选
        </button>
      </div>
      <div className="flat-section ">
        <div className="rg-section-title">方案对比摘要 <span className="subpanel-tag">{compareRows.length}</span></div>
        <div className="flat-body">
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
      </div>
    </div>
  )
}
