/**
 * Flow workspace — RoadGee-style inspector under flow diagram (stack layout).
 * Sections: 绘图属性 / 车道属性 / 进口道转向流量 / 饱和流率 / 多模态
 * Table edits → center diagram via flowAlign homology.
 */
import type { Approach, ChannelizationScheme, FlowScheme, TurnVolumes } from '@/domain/types'
import { getMultimodal, sumMultimodal } from '@/domain/flow/multimodal'
import {
  buildFlowAlignment,
  flowChartsAlignWithTable,
  type FlowDisplayMode,
} from '@/domain/flow/flowAlign'
import { DEFAULT_ROADGEE_FLOW_STYLE, type RoadGeeFlowStyle } from '@/ui/charts/roadgeeFlowDiagram'

export type FlowWorkspaceProps = {
  channel: ChannelizationScheme
  flow: FlowScheme
  displayMode: FlowDisplayMode
  onDisplayMode: (m: FlowDisplayMode) => void
  onFlowParams: (
    patch: Partial<Pick<FlowScheme, 'heavyRatio' | 'phf' | 'pce' | 'defaultSatFlow'>>,
  ) => void
  onVolume: (approachId: string, volumes: Partial<TurnVolumes>) => void
  onMultimodal?: (approachId: string, patch: Partial<{ ped: number; bike: number; other: number }>) => void
  onLaneSatFlow?: (approachId: string, laneIndex: number, satFlowPcu: number) => void
  diagramStyle?: RoadGeeFlowStyle
  onDiagramStyle?: (patch: Partial<RoadGeeFlowStyle>) => void
}

export function FlowWorkspace({
  channel,
  flow,
  displayMode,
  onDisplayMode,
  onFlowParams,
  onVolume,
  onMultimodal,
  onLaneSatFlow,
  diagramStyle = DEFAULT_ROADGEE_FLOW_STYLE,
  onDiagramStyle,
}: FlowWorkspaceProps) {
  const ok = flowChartsAlignWithTable(channel.approaches, flow, displayMode).ok
  const naturalAlign = buildFlowAlignment(channel.approaches, flow, 'natural')
  const peakAlign = buildFlowAlignment(channel.approaches, flow, 'peak')
  const mmSum = sumMultimodal(flow, channel.approaches)
  const style = diagramStyle

  return (
    <div className="card rg-form flow-form" style={{ marginTop: 8 }}>
      <div className="panel-header">
        <h2 className="rg-page-title" style={{ margin: 0 }}>
          流量 · {flow.name}
        </h2>
        <span className={`integrity-badge ${ok ? 'ok' : 'bad'}`}>{ok ? '表/图同源 ✓' : '表/图不一致'}</span>
      </div>

      {/* 绘图属性 — RoadGee style controls (drive center diagram when wired) */}
      <div className="rg-section">
        <div className="rg-section-title">绘图属性</div>
        <div className="field-row">
          <label>
            颜色方案
            <select
              value={style.scheme}
              onChange={(e) => onDiagramStyle?.({ scheme: Number(e.target.value) as 1 | 2 | 3 })}
            >
              <option value={1}>方案1</option>
              <option value={2}>方案2</option>
              <option value={3}>方案3</option>
            </select>
          </label>
          <label>
            粗细
            <input
              type="number"
              step={0.1}
              min={0.5}
              max={3}
              value={style.thickness}
              onChange={(e) => onDiagramStyle?.({ thickness: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="field-row">
          <label>
            字号Σ
            <input
              type="number"
              min={10}
              max={24}
              value={style.font3}
              onChange={(e) => onDiagramStyle?.({ font3: Number(e.target.value) })}
            />
          </label>
          <label>
            分流字号
            <input
              type="number"
              min={8}
              max={20}
              value={style.font2}
              onChange={(e) => onDiagramStyle?.({ font2: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="field-row">
          <label>
            间距
            <input
              type="number"
              min={20}
              max={80}
              value={style.spacing}
              onChange={(e) => onDiagramStyle?.({ spacing: Number(e.target.value) })}
            />
          </label>
          <label>
            图示数据
            <select value={displayMode} onChange={(e) => onDisplayMode(e.target.value as FlowDisplayMode)}>
              <option value="natural">自然 veh/h</option>
              <option value="peak">高峰 pcu/h</option>
            </select>
          </label>
        </div>
      </div>

      {/* 车道属性 — heavy / PHF per approach display */}
      <div className="rg-section">
        <div className="rg-section-title">车道属性</div>
        <div className="field-row">
          <label>
            大车比例
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                step={0.01}
                min={0}
                max={1}
                value={flow.heavyRatio}
                onChange={(e) => onFlowParams({ heavyRatio: Number(e.target.value) })}
              />
              <span className="rg-unit">0–1</span>
            </span>
          </label>
          <label>
            高峰小时系数 PHF
            <input
              type="number"
              step={0.01}
              min={0.25}
              max={1}
              value={flow.phf}
              onChange={(e) => onFlowParams({ phf: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="table-wrap" style={{ maxHeight: 140 }}>
          <table className="table table-dense">
            <thead>
              <tr>
                <th>方向</th>
                <th>路名</th>
                <th>大车</th>
                <th>PHF</th>
                <th>高峰Σ</th>
              </tr>
            </thead>
            <tbody>
              {channel.approaches.map((ap) => {
                const peak = peakAlign.rows.find((r) => r.approachId === ap.id)
                return (
                  <tr key={ap.id}>
                    <td>{ap.name.replace('进口', '') || ap.name}</td>
                    <td>{ap.name}</td>
                    <td>{(flow.heavyRatio * 100).toFixed(0)}%</td>
                    <td>{flow.phf.toFixed(2)}</td>
                    <td className="metric-cell">{peak ? Math.round(peak.peakSum) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 进口道转向流量 */}
      <div className="rg-section">
        <div className="rg-section-title">进口道转向流量</div>
        <div className="table-wrap" style={{ maxHeight: 280 }}>
          <table className="table">
            <thead>
              <tr>
                <th>进口</th>
                <th title="掉头">U</th>
                <th title="左转">L</th>
                <th title="直行">T</th>
                <th title="右转">R</th>
                <th>合计</th>
                <th>高峰Σ</th>
              </tr>
            </thead>
            <tbody>
              {channel.approaches.map((ap: Approach) => {
                const v = flow.volumes[ap.id] ?? { U: 0, L: 0, T: 0, R: 0 }
                const row = naturalAlign.rows.find((r) => r.approachId === ap.id)
                const cell = (k: keyof TurnVolumes) => (
                  <input
                    type="number"
                    min={0}
                    value={v[k] ?? 0}
                    onChange={(e) => onVolume(ap.id, { [k]: Number(e.target.value) })}
                  />
                )
                const sum = (v.U || 0) + (v.L || 0) + (v.T || 0) + (v.R || 0)
                return (
                  <tr key={ap.id}>
                    <td>{ap.name}</td>
                    <td>{cell('U')}</td>
                    <td>{cell('L')}</td>
                    <td>{cell('T')}</td>
                    <td>{cell('R')}</td>
                    <td className="metric-cell">{sum}</td>
                    <td className="metric-cell">{row ? Math.round(row.peakSum) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 饱和流率 — from inside lanes */}
      <div className="rg-section">
        <div className="rg-section-title">进口车道饱和流率（自内侧）</div>
        <div className="field-row">
          <label>
            默认饱和流率
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                min={800}
                max={2200}
                step={50}
                value={flow.defaultSatFlow}
                onChange={(e) => onFlowParams({ defaultSatFlow: Number(e.target.value) })}
              />
              <span className="rg-unit">pcu/h</span>
            </span>
          </label>
        </div>
        <div className="table-wrap" style={{ maxHeight: 160 }}>
          <table className="table table-dense">
            <thead>
              <tr>
                <th>进口</th>
                {Array.from({ length: Math.max(1, ...channel.approaches.map((a) => a.entryLanes.length)) }).map(
                  (_, i) => (
                    <th key={i}>车道{i + 1}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {channel.approaches.map((ap) => (
                <tr key={ap.id}>
                  <td>{ap.name.replace('进口', '')}</td>
                  {ap.entryLanes.map((ln, i) => (
                    <td key={ln.id}>
                      <input
                        type="number"
                        min={800}
                        max={2200}
                        step={50}
                        value={ln.satFlowPcu ?? flow.defaultSatFlow}
                        disabled={!onLaneSatFlow}
                        onChange={(e) => onLaneSatFlow?.(ap.id, i, Number(e.target.value))}
                        style={{ width: 72 }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 行人/非机 */}
      <details className="rg-section subpanel">
        <summary className="rg-section-title" style={{ cursor: 'pointer' }}>
          行人 / 非机动车
        </summary>
        <div className="subpanel-body">
          <div className="table-wrap" style={{ maxHeight: 140 }}>
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>进口</th>
                  <th>行人</th>
                  <th>非机</th>
                </tr>
              </thead>
              <tbody>
                {channel.approaches.map((ap) => {
                  const m = getMultimodal(flow, ap.id)
                  return (
                    <tr key={ap.id}>
                      <td>{ap.name}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={m.ped}
                          disabled={!onMultimodal}
                          onChange={(e) => onMultimodal?.(ap.id, { ped: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={m.bike}
                          disabled={!onMultimodal}
                          onChange={(e) => onMultimodal?.(ap.id, { bike: Number(e.target.value) })}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="hint quiet">
            行人 {mmSum.ped} · 非机 {mmSum.bike}（不并入机动车 v/c）
          </p>
        </div>
      </details>
    </div>
  )
}
