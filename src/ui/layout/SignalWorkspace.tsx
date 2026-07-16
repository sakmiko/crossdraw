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
import { SignalTimingPanel, ControlMatrixPanel, PhaseFacePanel } from '@/ui/charts/ProfessionalPanels'
import { vcHeatColor } from '@/ui/charts/svgCharts'
import { conflictHitsMarkdown, conflictMatrixExportSvg, conflictDiagramExportSvg } from '@/ui/charts/conflictExport'
import { exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'

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
  onAutoAssignDualRings?: () => void
  onSetPhaseRing?: (phaseId: string, ring: 1 | 2 | undefined) => void
  onRunOptimize: () => void
  onRunCompare: () => void
  onApplyCompareRow: (row: TimingCompareRow) => void
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
    onRunOptimize,
    onRunCompare,
    onApplyCompareRow,
  } = props

  const al = buildSignalTimingAlignment(signal)
  const hits = channel ? allPhasesConflictHits(channel.approaches, signal) : []
  const blocks = hits.filter((h) => h.level === 'block').length
  const pedVeh = channel
    ? detectPedVehicleConflicts(signal.phases, channel.approaches)
    : { issues: [], hits: [] as ReturnType<typeof detectPedVehicleConflicts>['hits'] }
  const pedBlocks = pedVeh.hits.filter((h) => h.level === 'block').length
  const releaseHint = channel
    ? releaseMatrixAlignsWithPhases(signal, channel.approaches)
    : { ok: true, mismatches: [] as string[] }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="panel-header">
        <h2 style={{ margin: 0 }}>信号 · {signal.name}</h2>
        <span className={`integrity-badge ${al.closed ? 'ok' : 'bad'}`}>
          {al.dualRingEnabled
            ? al.closed
              ? `双环闭合 阶段Σ=${(al.dualRingStageSumSec ?? 0).toFixed(1)}=C`
              : `双环未闭合 阶段Σ=${(al.dualRingStageSumSec ?? 0).toFixed(1)} C=${al.cycleSec}`
            : al.closed
              ? `配时闭合 Σ=${al.mainSumSec.toFixed(1)}=C`
              : `未闭合 Σ=${al.mainSumSec.toFixed(1)} C=${al.cycleSec} 差${al.balanceSec > 0 ? '+' : ''}${al.balanceSec}`}
        </span>
        <span className={`integrity-badge ${blocks ? 'bad' : hits.length ? 'warn' : 'ok'}`}>
          {blocks ? `相位相悖 ${blocks}` : hits.length ? `冲突警告 ${hits.length}` : '无相悖 ✓'}
        </span>
        <span className={`integrity-badge ${pedBlocks ? 'bad' : pedVeh.hits.length ? 'warn' : 'ok'}`}>
          {pedVehicleSummary(pedVeh.hits)}
        </span>
      </div>

      <label>
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
              搭接相位 Overlap
            </label>
            <div className="hint" style={{ marginTop: 6 }}>
              放行矩阵
            </div>
            {channel?.approaches.map((ap: Approach) => {
              const pedOn = (ph.pedestrian ?? []).some((p) => p.approachId === ap.id)
              return (
              <div key={ap.id} style={{ marginTop: 4 }}>
                <span className="hint">{ap.name}</span>
                <div className="toolbar" style={{ gap: 4, marginTop: 2 }}>
                  {(['L', 'T', 'R'] as Movement[]).map((m) => {
                    const on = (ph.releases[ap.id] ?? []).includes(m)
                    return (
                      <button
                        key={m}
                        type="button"
                        className={on ? 'primary' : 'ghost'}
                        style={{ padding: '2px 6px', fontSize: 11 }}
                        onClick={() => onToggleRelease(ph.id, ap.id, m)}
                      >
                        {m}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className={pedOn ? 'primary' : 'ghost'}
                    style={{ padding: '2px 6px', fontSize: 11 }}
                    title="该进口斑马线行人过街"
                    onClick={() => onTogglePedestrian(ph.id, ap.id)}
                  >
                    行人
                  </button>
                  {pedOn && onSetPedExclusive && (
                    <label className="check-inline" style={{ fontSize: 11 }} title="独占行人：人车冲突升为禁止">
                      <input
                        type="checkbox"
                        checked={!!(ph.pedestrian ?? []).find((p) => p.approachId === ap.id)?.exclusive}
                        onChange={(e) => onSetPedExclusive(ph.id, ap.id, e.target.checked)}
                      />{' '}
                      独占
                    </label>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        ))}
      </div>

      {channel && (
        <p className="hint" style={{ marginTop: 8 }}>
          {releaseHint.ok
            ? '放行矩阵与各相位 L/T/R 按钮已逐格对齐'
            : `放行对齐异常：${releaseHint.mismatches.slice(0, 2).join('；')}`}
        </p>
      )}

      <div className="toolbar dual-ring-bar" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
        <label className="check-inline" title="NEMA 风格双环并发阶段 · 闭合用 max(R1,R2) 阶段和">
          <input
            type="checkbox"
            checked={!!signal.dualRing?.enabled}
            onChange={(e) => onSetDualRing?.(e.target.checked)}
          />{' '}
          双环栏
        </label>
        {signal.dualRing?.enabled && (
          <>
            <button type="button" className="ghost" onClick={() => onAutoAssignDualRings?.()}>
              自动分配环
            </button>
            <span className={`integrity-badge ${buildDualRingAlignment(signal).closed ? 'ok' : 'bad'}`}>
              {dualRingSummaryText(buildDualRingAlignment(signal))}
            </span>
          </>
        )}
      </div>

      <div className="toolbar" style={{ marginTop: 8 }}>
        <button type="button" onClick={onAddPhase}>
          添加相位
        </button>
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
          一键优化配时
        </button>
        <button type="button" onClick={onRunCompare}>
          多方法比选
        </button>
      </div>

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
