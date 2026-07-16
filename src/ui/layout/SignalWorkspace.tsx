import { useMemo } from 'react'
import { Icon } from '@/ui/icons/Icons'
/**
 * Signal workspace panel — extracted from App for maintainability.
 * Props only; no direct store access (App owns store wiring).
 */
import type { Approach, ChannelizationScheme, FlowScheme, Movement, SignalScheme } from '@/domain/types'
import type { TimingMethod } from '@/domain/analysis/timing'
import { TIMING_METHOD_LABELS } from '@/domain/analysis/timing'
import { criticalFlowRatios } from '@/domain/analysis/timing'
import { recommendTimingRow, type TimingCompareRow } from '@/domain/analysis/timingCompare'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'
import { releaseMatrixAlignsWithPhases } from '@/domain/signal/releaseAlign'
import { allPhasesConflictHits } from '@/domain/signal/phaseConflictView'
import { detectPedVehicleConflicts, pedVehicleSummary } from '@/domain/signal/pedVehicleConflict'
import { SignalCharts, TimingCompareCharts } from '@/ui/charts/ChartPanels'
import { buildDualRingAlignment, dualRingSummaryText } from '@/domain/signal/dualRing'
import { applyPedTimingToSignal } from '@/domain/signal/pedTiming'
import { allocateGreensByBarrierCriticalY } from '@/domain/signal/barrierGreenAlloc'
import { dualRingPhaseNumberSvg } from '@/ui/charts/phaseNumberDiagram'
import { computeDualRingCriticalFlow, dualRingCriticalSummary } from '@/domain/signal/barrierCritical'
import { SignalTimingPanel, ControlMatrixPanel, PhaseFacePanel } from '@/ui/charts/ProfessionalPanels'
import { vcHeatColor } from '@/ui/charts/svgCharts'
import { conflictHitsMarkdown, conflictMatrixExportSvg, conflictDiagramExportSvg } from '@/ui/charts/conflictExport'
import { exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'
import { PhaseReleaseEditor } from '@/ui/layout/PhaseReleaseEditor'
import {
  computeSaturationKpi,
  previewOptimize,
  saturationKpiMarkdown,
  optimizeDeltaMarkdown,
} from '@/domain/signal/saturationKpi'
import { signalControlBoardSvg } from '@/ui/charts/signalControlBoard'


export type SignalWorkspaceProps = {
  projectName: string
  signal: SignalScheme
  channel: ChannelizationScheme | null
  flow: FlowScheme | null
  focusPhaseId: string | null
  onFocusPhase: (id: string) => void
  timingMethod: TimingMethod
  onTimingMethod: (m: TimingMethod) => void
  fixedCycleOn: boolean
  onFixedCycleOn: (v: boolean) => void
  fixedCycleSec: number
  onFixedCycleSec: (v: number) => void
  timingCompare: TimingCompareRow[]
  timingNotes: string[]
  onCycle: (c: number) => void
  onUpdatePhaseTiming: (
    phaseId: string,
    patch: Partial<{ name: string; greenSec: number; yellowSec: number; allRedSec: number; isOverlap: boolean }>,
  ) => void
  onToggleRelease: (phaseId: string, approachId: string, m: Movement) => void
  onTogglePedestrian: (phaseId: string, approachId: string) => void
  onSetPedExclusive?: (phaseId: string, approachId: string, exclusive: boolean) => void
  onAddPhase: () => void
  onAddOverlap: () => void
  onAddPedPhase?: () => void
  onSetDualRing?: (enabled: boolean) => void
  onAutoAssignDualRings?: (barrierCount?: number) => void
  onSetPhaseRing?: (phaseId: string, ring: 1 | 2 | undefined) => void
  onSetPhaseBarrier?: (phaseId: string, barrierIndex: number) => void
  onBalanceDualRing?: () => void
  onCloseDualRingCycle?: () => void
  onApplyPedTiming?: () => void
  onAllocateBarrierGreens?: () => void
  onRunOptimize: () => void
  onRunCompare: () => void
  onApplyCompareRow: (row: TimingCompareRow) => void
  /** RoadGee auto-timing pack */
  designTargetVc?: number
  onDesignTargetVc?: (v: number) => void
  designStartLoss?: number
  onDesignStartLoss?: (v: number) => void
  designPhf?: number
  onDesignPhf?: (v: number) => void
  designCycleSec?: number
  onDesignCycleSec?: (v: number) => void
  designLockCycle?: boolean
  onDesignLockCycle?: (v: boolean) => void
  onComputeY?: () => void
  onGenerateScheme?: () => void
  onClearScheme?: () => void
  onExportAutoTimingReport?: () => void
  yReportText?: string
  onToggleUnsignalized?: (v: boolean) => void
}

export function SignalWorkspace(props: SignalWorkspaceProps) {
  const {
    projectName,
    signal,
    channel,
    flow,
    focusPhaseId,
    onFocusPhase,
    timingMethod,
    onTimingMethod,
    fixedCycleOn,
    onFixedCycleOn,
    fixedCycleSec,
    onFixedCycleSec,
    timingCompare,
    timingNotes,
    onCycle,
    onUpdatePhaseTiming,
    onToggleRelease,
    onTogglePedestrian,
    onSetPedExclusive,
    onAddPhase,
    onAddOverlap,
    onAddPedPhase,
    onSetDualRing,
    onAutoAssignDualRings,
    onSetPhaseRing,
    onSetPhaseBarrier,
    onBalanceDualRing,
    onCloseDualRingCycle,
  onApplyPedTiming,
  onAllocateBarrierGreens,
    onRunOptimize,
    onRunCompare,
    onApplyCompareRow,
    designTargetVc = 0.9,
    onDesignTargetVc,
    designStartLoss = 3,
    onDesignStartLoss,
    designPhf = 0.95,
    onDesignPhf,
    designCycleSec,
    onDesignCycleSec,
    designLockCycle = false,
    onDesignLockCycle,
    onComputeY,
    onGenerateScheme,
    onClearScheme,
    onExportAutoTimingReport,
    yReportText,
    onToggleUnsignalized,
  } = props

  const kpi = useMemo(() => {
    if (!channel || !flow) return null
    return computeSaturationKpi(channel.approaches, flow, signal)
  }, [channel, flow, signal])
  const optPreview = useMemo(() => {
    if (!channel || !flow || signal.unsignalized) return null
    return previewOptimize(channel.approaches, flow, signal, {
      method: timingMethod,
      targetVc: designTargetVc ?? 0.9,
      startLoss: designStartLoss ?? signal.startLossSec,
      fixedCycle: designLockCycle ? designCycleSec : fixedCycleOn ? fixedCycleSec : undefined,
    })
  }, [channel, flow, signal, timingMethod, designTargetVc, designStartLoss, designLockCycle, designCycleSec, fixedCycleOn, fixedCycleSec])
  const controlBoardSvg = useMemo(() => {
    if (!channel || !kpi) return ''
    return signalControlBoardSvg(channel.approaches, signal, kpi, { width: 860 })
  }, [channel, signal, kpi])

  const al = buildSignalTimingAlignment(signal)
  const hits = channel ? allPhasesConflictHits(channel.approaches, signal) : []
  const blocks = hits.filter((h) => h.level === 'block').length
  const pedVeh = channel
    ? detectPedVehicleConflicts(signal.phases, channel.approaches)
    : { issues: [], hits: [] as ReturnType<typeof detectPedVehicleConflicts>['hits'] }
  const pedBlocks = pedVeh.hits.filter((h) => h.level === 'block').length
  const critY = channel && flow ? criticalFlowRatios(channel.approaches, flow, signal) : []
  const ySum = critY.reduce((s, r) => s + r.y, 0)
  const releaseHint = channel
    ? releaseMatrixAlignsWithPhases(signal, channel.approaches)
    : { ok: true, mismatches: [] as string[] }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="panel-header">
        <h2 style={{ margin: 0 }}>信号 · {signal.name}</h2>
        <label className="check-inline" style={{ marginLeft: 'auto', fontSize: 12 }}>
          <input
            type="checkbox"
            checked={!!signal.unsignalized}
            onChange={(e) => onToggleUnsignalized?.(e.target.checked)}
          />{' '}
          无信号控制
        </label>
        <div className="panel-header-meta">
          <span className={`integrity-badge ${al.closed ? 'ok' : 'bad'}`} title="配时闭合">
            {al.closed ? '闭合' : '未闭合'}
          </span>
          {(blocks > 0 || pedBlocks > 0) && (
            <span className="integrity-badge bad" title="冲突">
              冲突 {blocks + pedBlocks}
            </span>
          )}
        </div>
      </div>

      

      <details className="subpanel" open>
        <summary className="subpanel-summary">相位表 <span className="subpanel-tag">{signal.phases.length} 相 · C={signal.cycleSec}s</span></summary>
        <div className="subpanel-body">
      <label className="field-inline">
        周期 C (s)
        <input type="number" value={signal.cycleSec} onChange={(e) => onCycle(Number(e.target.value))} />
      </label>
      <div className="ring">
        {signal.phases.map((ph) => (
          <div key={ph.id} className="phase" style={{ minWidth: 168 }}>
            <input
              value={ph.name}
              onChange={(e) => onUpdatePhaseTiming(ph.id, { name: e.target.value })}
              aria-label="相位名称"
              style={{ marginBottom: 6, fontWeight: 650 }}
            />
            <div className="field-row-3">
              <label>
                G
                <input
                  type="number"
                  value={ph.greenSec}
                  onChange={(e) => onUpdatePhaseTiming(ph.id, { greenSec: Number(e.target.value) })}
                />
              </label>
              <label>
                Y
                <input
                  type="number"
                  value={ph.yellowSec}
                  onChange={(e) => onUpdatePhaseTiming(ph.id, { yellowSec: Number(e.target.value) })}
                />
              </label>
              <label>
                AR
                <input
                  type="number"
                  value={ph.allRedSec}
                  onChange={(e) => onUpdatePhaseTiming(ph.id, { allRedSec: Number(e.target.value) })}
                />
              </label>
            </div>
            <label style={{ marginTop: 4 }}>
              <input
                type="checkbox"
                checked={!!ph.isOverlap}
                onChange={(e) => onUpdatePhaseTiming(ph.id, { isOverlap: e.target.checked })}
              />{' '}
              搭接
            </label>
            {signal.dualRing?.enabled && !ph.isOverlap && (
              <div className="field-row-3" style={{ marginTop: 6 }}>
                <label title="双环归属 R1/R2">
                  环
                  <select
                    value={ph.ring ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      onSetPhaseRing?.(ph.id, v === '1' ? 1 : v === '2' ? 2 : undefined)
                    }}
                  >
                    <option value="">—</option>
                    <option value="1">R1</option>
                    <option value="2">R2</option>
                  </select>
                </label>
                <label title="Barrier 阶段组">
                  B
                  <select
                    value={ph.barrierIndex ?? 0}
                    onChange={(e) => onSetPhaseBarrier?.(ph.id, Number(e.target.value))}
                  >
                    {[0, 1, 2, 3].map((b) => (
                      <option key={b} value={b}>
                        B{b}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {channel && (
              <PhaseReleaseEditor
                phase={ph}
                approaches={channel.approaches}
                onToggleRelease={onToggleRelease}
                onTogglePedestrian={onTogglePedestrian}
                onSetPedExclusive={onSetPedExclusive}
                includeU
              />
            )}
          </div>
        ))}
      </div>
        </div>
      </details>

      {channel && (
        <p className="hint quiet" style={{ marginTop: 8 }}>
          {releaseHint.ok
            ? '放行矩阵与各相位 L/T/R 按钮已逐格对齐'
            : `放行对齐异常：${releaseHint.mismatches.slice(0, 2).join('；')}`}
        </p>
      )}

      <details className="subpanel" open={!!signal.dualRing?.enabled}>
        <summary className="subpanel-summary">
          <label className="check-inline" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={!!signal.dualRing?.enabled}
              onChange={(e) => onSetDualRing?.(e.target.checked)}
            />{' '}
            双环栏
          </label>
          {signal.dualRing?.enabled && channel && flow && (
            <span className="subpanel-tag">
              {dualRingCriticalSummary(computeDualRingCriticalFlow(channel.approaches, flow, signal))}
            </span>
          )}
        </summary>
        {signal.dualRing?.enabled && (
          <div className="subpanel-body toolbar dense">
            <button type="button" className="ghost" onClick={() => onAutoAssignDualRings?.(1)}>
              单屏障
            </button>
            <button type="button" className="ghost" onClick={() => onAutoAssignDualRings?.(2)}>
              双屏障
            </button>
            <button type="button" className="ghost" onClick={() => onBalanceDualRing?.()}>
              平衡
            </button>
            <button type="button" className="primary" onClick={() => onCloseDualRingCycle?.()}>
              闭合 C
            </button>
          </div>
        )}
      </details>

      <details className="subpanel" open>
        <summary className="subpanel-summary">
          相位操作 / 配时优化
        </summary>
        <div className="subpanel-body toolbar dense" style={{ marginTop: 0 }}>
        <button type="button" onClick={onAddPhase}>
          添加相位
        </button>
        {onApplyPedTiming && (
          <button type="button" onClick={() => onApplyPedTiming()}>
            行人Walk/FDW
          </button>
        )}
        {onAllocateBarrierGreens && (
          <button type="button" onClick={() => onAllocateBarrierGreens()}>
            屏障Y配绿
          </button>
        )}
        <button type="button" onClick={onAddOverlap}>
          添加搭接
        </button>
        {onAddPedPhase && (
          <button type="button" className="primary" onClick={onAddPedPhase}>
            专用行人相位
          </button>
        )}
        <label className="timing-method">
          配时方法
          <select value={timingMethod} onChange={(e) => onTimingMethod(e.target.value as TimingMethod)}>
            <option value="webster">Webster 最优周期</option>
            <option value="hcm-delay">延误最小 (HCM)</option>
            <option value="equal">等绿灯</option>
            <option value="fixed-cycle">固定周期分绿</option>
          </select>
        </label>
        <label className="timing-fixed">
          <input
            type="checkbox"
            checked={fixedCycleOn || timingMethod === 'fixed-cycle'}
            onChange={(e) => {
              onFixedCycleOn(e.target.checked)
              if (e.target.checked) onFixedCycleSec(signal.cycleSec)
            }}
          />{' '}
          固定周期
        </label>
        {(fixedCycleOn || timingMethod === 'fixed-cycle') && (
          <label>
            C(s)
            <input
              type="number"
              min={40}
              max={180}
              value={fixedCycleSec}
              onChange={(e) => onFixedCycleSec(Number(e.target.value))}
              style={{ width: 72 }}
            />
          </label>
        )}
        <button type="button" className="primary" onClick={onRunOptimize}>
          <Icon name="optimize" size={14} /><span>自动配时</span>
        </button>
        <button type="button" className="ghost" onClick={() => onComputeY?.()} title="计算关键流量比 Y">
          计算Y值
        </button>
        <button type="button" className="ghost" onClick={() => onGenerateScheme?.()} title="按进口生成保护相位方案">
          生成方案
        </button>
        <button type="button" className="ghost" onClick={() => onClearScheme?.()} title="清空绿灯（保留结构）">
          清空方案
        </button>
        <button type="button" className="ghost" onClick={() => onExportAutoTimingReport?.()}>
          导出配时报告
        </button>
        <button type="button" onClick={onRunCompare}>
          多方法比选
        </button>
        </div>
        {channel && flow && (
          <div className="metric-grid" style={{ marginTop: 8 }}>
            <div className="metric">
              <div className="label">Y值</div>
              <div className="value">{ySum.toFixed(3)}</div>
            </div>
            <div className="metric">
              <div className="label">周期 C</div>
              <div className="value">{signal.cycleSec}<small>s</small></div>
            </div>
            <div className="metric">
              <div className="label">相位数</div>
              <div className="value">{signal.phases.filter((p) => !p.isOverlap).length}</div>
            </div>
          </div>
        )}
      {kpi && !signal.unsignalized && (
        <div className="rg-section" style={{ marginBottom: 10 }}>
          <div className="rg-section-title">饱和度 / 延误 KPI（实时）</div>
          <div className="metric-grid">
            <div className="metric"><div className="label">Y</div><div className="value">{kpi.Y.toFixed(3)}</div></div>
            <div className="metric"><div className="label">均 v/c</div><div className="value" style={{ color: kpi.avgVc > 0.9 ? 'var(--block)' : undefined }}>{kpi.avgVc.toFixed(3)}</div></div>
            <div className="metric"><div className="label">最大 v/c</div><div className="value">{kpi.maxVc.toFixed(3)}</div><div className="sub">{kpi.criticalApproach} {kpi.criticalMovement}</div></div>
            <div className="metric"><div className="label">均延误</div><div className="value">{kpi.avgDelay.toFixed(1)}<small>s</small></div></div>
            <div className={`metric los-${kpi.los}`}><div className="label">LOS</div><div className="value">{kpi.los}</div></div>
            <div className="metric"><div className="label">C / 相位</div><div className="value" style={{ fontSize: 16 }}>{kpi.cycleSec}s · {kpi.phaseCount}</div></div>
          </div>
          {optPreview && (
            <p className="hint quiet" style={{ marginTop: 6 }}>
              一键优化预览（{optPreview.method}）：C→{optPreview.cycleSec}s · 均v/c {optPreview.after.avgVc.toFixed(3)}（Δ{(optPreview.after.avgVc - optPreview.before.avgVc) >= 0 ? '+' : ''}{(optPreview.after.avgVc - optPreview.before.avgVc).toFixed(3)}）· 延误 {optPreview.after.avgDelay.toFixed(1)}s（Δ{(optPreview.after.avgDelay - optPreview.before.avgDelay) >= 0 ? '+' : ''}{(optPreview.after.avgDelay - optPreview.before.avgDelay).toFixed(1)}）
            </p>
          )}
          <div className="toolbar dense" style={{ marginTop: 6 }}>
            <button type="button" className="primary" onClick={onRunOptimize}>
              <Icon name="optimize" size={14} /><span>一键优化配时</span>
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                if (!kpi) return
                downloadText(`${projectName}-饱和度KPI.md`, saturationKpiMarkdown(projectName, kpi), 'text/markdown')
              }}
            >
              KPI MD
            </button>
            {optPreview && (
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  downloadText(
                    `${projectName}-优化预览.md`,
                    optimizeDeltaMarkdown(projectName, optPreview),
                    'text/markdown',
                  )
                }
              >
                预览 MD
              </button>
            )}
            {controlBoardSvg && (
              <button
                type="button"
                className="ghost"
                onClick={() => exportSvgFile(`${projectName}-管控看板.svg`, controlBoardSvg)}
              >
                管控看板 SVG
              </button>
            )}
          </div>
          {controlBoardSvg && (
            <div
              className="chart-svg-host chart-svg-host--pro"
              style={{ marginTop: 8 }}
              dangerouslySetInnerHTML={{ __html: controlBoardSvg }}
            />
          )}
        </div>
      )}

      <div className="rg-section">
          <div className="rg-section-title">自动配时设计参数</div>
          <div className="field-row">
            <label>
              设计目标VC
              <input
                type="number"
                step={0.01}
                min={0.5}
                max={1}
                value={designTargetVc}
                onChange={(e) => onDesignTargetVc?.(Number(e.target.value))}
              />
            </label>
            <label>
              启动损失(s)
              <input
                type="number"
                step={0.5}
                min={1}
                max={8}
                value={designStartLoss}
                onChange={(e) => onDesignStartLoss?.(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="field-row">
            <label>
              设计PHF
              <input
                type="number"
                step={0.01}
                min={0.25}
                max={1}
                value={designPhf}
                onChange={(e) => onDesignPhf?.(Number(e.target.value))}
              />
            </label>
            <label>
              设计周期
              <input
                type="number"
                min={40}
                max={180}
                value={designCycleSec ?? signal.cycleSec}
                onChange={(e) => onDesignCycleSec?.(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="check-inline" style={{ marginTop: 6 }}>
            <input
              type="checkbox"
              checked={designLockCycle}
              onChange={(e) => onDesignLockCycle?.(e.target.checked)}
            />{' '}
            锁定设计周期（固定C分绿）
          </label>
          {yReportText && (
            <pre className="y-report-pre" style={{ marginTop: 8, fontSize: 11, whiteSpace: 'pre-wrap' }}>
              {yReportText}
            </pre>
          )}
        </div>
      </details>

      {timingCompare.length > 0 && (
        <div className="card panel-stack" style={{ marginTop: 10 }}>
          <div className="panel-header">
            <h2 style={{ margin: 0, fontSize: 15 }}>配时方法比选</h2>
            <span className="hint">同渠化·同流量 · 点击应用</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>方法</th>
                  <th>C(s)</th>
                  <th>Y</th>
                  <th>v/c</th>
                  <th>延误s</th>
                  <th>LOS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {timingCompare.map((r) => {
                  const rec = recommendTimingRow(timingCompare)
                  const isRec = rec?.method === r.method
                  return (
                    <tr key={r.method} className={isRec ? 'row-recommend' : ''}>
                      <td>
                        {r.label}
                        {isRec ? ' ★' : ''}
                      </td>
                      <td>{r.cycleSec}</td>
                      <td>{r.Y.toFixed(3)}</td>
                      <td>
                        <span className="vc-chip" style={{ background: vcHeatColor(r.avgVc) }}>
                          {r.avgVc.toFixed(3)}
                        </span>
                      </td>
                      <td>{r.avgDelay.toFixed(1)}</td>
                      <td>
                        <span className={`los-badge los-${r.los}`}>{r.los}</span>
                      </td>
                      <td>
                        <button type="button" className="ghost" onClick={() => onApplyCompareRow(r)}>
                          应用
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <TimingCompareCharts
            rows={timingCompare.map((r) => ({
              label: r.label,
              avgDelay: r.avgDelay,
              avgVc: r.avgVc,
              los: r.los,
              cycleSec: r.cycleSec,
              method: r.method,
            }))}
          />
        </div>
      )}

      {signal.dualRing?.enabled && (
          <div className="chart-svg-host chart-svg-host--pro" style={{ marginTop: 8 }}
            dangerouslySetInnerHTML={{ __html: dualRingPhaseNumberSvg(signal, 360) }}
          />
        )}
        <SignalCharts
        signal={signal}
        approaches={channel?.approaches}
        focusPhaseId={focusPhaseId ?? signal.phases[0]?.id ?? null}
        onFocusPhase={onFocusPhase}
      />

      {channel && pedVeh.hits.length > 0 && (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="section-title">人车冲突明细</div>
          <div className="table-wrap" style={{ maxHeight: 160 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>相位</th>
                  <th>行人面</th>
                  <th>机动车</th>
                  <th>原因</th>
                  <th>等级</th>
                </tr>
              </thead>
              <tbody>
                {pedVeh.hits.slice(0, 16).map((h, i) => (
                  <tr key={`${h.phaseId}-${h.pedApproachId}-${h.vehicleApproachId}-${h.movement}-${i}`} className={h.level === 'block' ? 'row-block' : 'row-warn'}>
                    <td>{h.phaseName}</td>
                    <td>{h.pedApproachName.replace('进口', '')}</td>
                    <td>
                      {h.vehicleApproachName.replace('进口', '')}
                      {h.movement}
                    </td>
                    <td>{h.reason}</td>
                    <td>{h.level === 'block' ? '禁止' : '警告'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">独占行人将冲突升为禁止；规则见 pedVehicleConflict。</p>
        </div>
      )}

      {channel && (
        <div className="toolbar" style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => {
              exportSvgFile(
                `${projectName}-conflict.svg`,
                conflictMatrixExportSvg(channel.approaches, signal, focusPhaseId ?? signal.phases[0]?.id),
              )
              downloadText(
                `${projectName}-conflict.md`,
                conflictHitsMarkdown(projectName, channel.approaches, signal),
                'text/markdown',
              )
            }}
          >
            导出冲突矩阵
          </button>
          <button
            type="button"
            onClick={() => {
              exportSvgFile(
                `${projectName}-conflict-points.svg`,
                conflictDiagramExportSvg(
                  channel.approaches,
                  signal,
                  focusPhaseId ?? signal.phases[0]?.id,
                ),
              )
            }}
          >
            导出冲突点图
          </button>
        </div>
      )}

      <SignalTimingPanel signal={signal} />
      {channel && <ControlMatrixPanel signal={signal} approaches={channel.approaches} />}
      {channel && <PhaseFacePanel signal={signal} approaches={channel.approaches} />}

      {timingNotes.length > 0 && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="section-title">配时优化说明 · {TIMING_METHOD_LABELS[timingMethod]}</div>
          <ul className="hint" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {timingNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {channel && flow && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="section-title">关键流量比 y（Webster）</div>
          <table className="table">
            <thead>
              <tr>
                <th>相位</th>
                <th>y</th>
                <th>关键量</th>
              </tr>
            </thead>
            <tbody>
              {criticalFlowRatios(channel.approaches, flow, signal).map((r) => (
                <tr key={r.phase}>
                  <td>{r.phase}</td>
                  <td>{r.y.toFixed(3)}</td>
                  <td>{r.volume.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">C₀=(1.5L+5)/(1−Y) · Webster 1958 · 见专业依据文档</p>
        </div>
      )}
    </div>
  )
}
