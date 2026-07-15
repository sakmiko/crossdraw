/**
 * Flow workspace panel — extracted from App for maintainability.
 */
import type { Approach, ChannelizationScheme, FlowScheme, TurnVolumes } from '@/domain/types'
import {
  buildFlowAlignment,
  flowChartsAlignWithTable,
  type FlowDisplayMode,
} from '@/domain/flow/flowAlign'
import { FlowCharts } from '@/ui/charts/ChartPanels'
import { FlowDirectionPanel } from '@/ui/charts/ProfessionalPanels'

export type FlowWorkspaceProps = {
  channel: ChannelizationScheme
  flow: FlowScheme
  displayMode: FlowDisplayMode
  onDisplayMode: (m: FlowDisplayMode) => void
  onFlowParams: (patch: Partial<Pick<FlowScheme, 'heavyRatio' | 'phf' | 'pce' | 'defaultSatFlow'>>) => void
  onVolume: (approachId: string, volumes: Partial<TurnVolumes>) => void
}

export function FlowWorkspace({
  channel,
  flow,
  displayMode,
  onDisplayMode,
  onFlowParams,
  onVolume,
}: FlowWorkspaceProps) {
  const ok = flowChartsAlignWithTable(channel.approaches, flow, displayMode).ok
  const naturalAlign = buildFlowAlignment(channel.approaches, flow, 'natural')

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="panel-header">
        <h2 style={{ margin: 0 }}>流量 · {flow.name}</h2>
        <span className={`integrity-badge ${ok ? 'ok' : 'bad'}`}>
          {ok ? '表/图同源 ✓' : '表/图不一致'}
        </span>
      </div>

      <div className="field-row">
        <label>
          大车比例
          <input
            type="number"
            step={0.01}
            value={flow.heavyRatio}
            onChange={(e) => onFlowParams({ heavyRatio: Number(e.target.value) })}
          />
        </label>
        <label>
          PHF
          <input
            type="number"
            step={0.01}
            value={flow.phf}
            onChange={(e) => onFlowParams({ phf: Number(e.target.value) })}
          />
        </label>
        <label>
          图示数据
          <select
            value={displayMode}
            onChange={(e) => onDisplayMode(e.target.value as FlowDisplayMode)}
          >
            <option value="natural">自然流量 veh/h（与表一致）</option>
            <option value="peak">高峰 pcu/h（计大车/PHF）</option>
          </select>
        </label>
      </div>

      <div className="table-wrap" style={{ maxHeight: 200 }}>
        <table className="table">
          <thead>
            <tr>
              <th>进口</th>
              <th>L</th>
              <th>T</th>
              <th>R</th>
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
                  value={v[k]}
                  onChange={(e) => onVolume(ap.id, { [k]: Number(e.target.value) })}
                />
              )
              const sum = (v.L || 0) + (v.T || 0) + (v.R || 0)
              return (
                <tr key={ap.id}>
                  <td>{ap.name}</td>
                  <td>{cell('L')}</td>
                  <td>{cell('T')}</td>
                  <td>{cell('R')}</td>
                  <td className="hint">{sum}</td>
                  <td className="hint">{row ? Math.round(row.peakSum) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="hint">
        表内为自然流量 veh/h；图示可选高峰 pcu/h（大车×PCE、/PHF）。柱状图与流向图共用
        buildFlowAlignment。
      </p>
      <FlowCharts approaches={channel.approaches} flow={flow} mode={displayMode} />
      <FlowDirectionPanel approaches={channel.approaches} flow={flow} mode={displayMode} />
    </div>
  )
}
