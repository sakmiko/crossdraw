import { roadgeeFlowDiagramSvg, DEFAULT_ROADGEE_FLOW_STYLE, type RoadGeeFlowStyle } from './roadgeeFlowDiagram'
import { useMemo, useState } from 'react'
import {
  controlMatrixSvg,
  flowMovementDiagramSvg,
  // classic kept; RoadGee panel uses roadgeeFlowDiagram
  phaseFaceDiagramSvg,
  signalTimingDiagramSvg,
  timeSpaceDiagramSvg,
} from './professionalDiagrams'
import type { Approach, BandCorridor, FlowScheme, SignalScheme } from '@/domain/types'
import { buildFlowAlignment, flowChartsAlignWithTable, type FlowDisplayMode } from '@/domain/flow/flowAlign'
import { buildSignalTimingAlignment, signalChartsAlignWithTable } from '@/domain/signal/timingAlign'
import {
  buildReleaseMatrix,
  controlMatrixChartInput,
  releaseMatrixAlignsWithPhases,
} from '@/domain/signal/releaseAlign'
import { useAppStore } from '@/state/store'
import { chartColorsForTheme, themeSvg } from './chartTheme'

function useChartColors() {
  const theme = useAppStore((s) => s.theme)
  return chartColorsForTheme(theme === 'light' ? 'light' : 'dark')
}

export function SignalTimingPanel({ signal }: { signal: SignalScheme }) {
  const colors = useChartColors()
  const align = useMemo(() => buildSignalTimingAlignment(signal), [signal])
  const check = useMemo(() => signalChartsAlignWithTable(signal), [signal])
  const svg = useMemo(
    () =>
      themeSvg(
        signalTimingDiagramSvg(align.chartPhases, align.cycleSec),
        colors,
      ),
    [align, colors],
  )
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>信号配时图</span>
        <small>
          C={align.cycleSec}s · Σ主={align.mainSumSec.toFixed(1)}s ·{' '}
          {align.closed ? '闭合' : `差${align.balanceSec > 0 ? '+' : ''}${align.balanceSec}`}
          {check.ok ? ' · 表图对齐✓' : ' · 对齐异常'}
        </small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="table-wrap" style={{ marginTop: 8, maxHeight: 160 }}>
        <table className="table">
          <thead>
            <tr>
              <th>相位</th>
              <th>G</th>
              <th>Y</th>
              <th>AR</th>
              <th>时长</th>
              <th>类型</th>
            </tr>
          </thead>
          <tbody>
            {align.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.greenSec}</td>
                <td>{r.yellowSec}</td>
                <td>{r.allRedSec}</td>
                <td>{r.durationSec}</td>
                <td>{r.isOverlap ? '搭接' : '主相'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ControlMatrixPanel({
  signal,
  approaches,
}: {
  signal: SignalScheme
  approaches: Approach[]
}) {
  const colors = useChartColors()
  const matrix = useMemo(() => buildReleaseMatrix(signal, approaches), [signal, approaches])
  const check = useMemo(() => releaseMatrixAlignsWithPhases(signal, approaches), [signal, approaches])
  const svg = useMemo(() => {
    const input = controlMatrixChartInput(signal, approaches)
    return themeSvg(
      controlMatrixSvg(input.approaches, input.phases, input.approachIds),
      colors,
    )
  }, [signal, approaches, colors])
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>管控 / 放行图</span>
        <small>
          {matrix.activeCount}/{matrix.totalCells} 放行格 ·{' '}
          {check.ok ? '与 L/T/R 按钮对齐✓' : `错位 ${check.mismatches.length}`}
        </small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="table-wrap" style={{ marginTop: 8, maxHeight: 180 }}>
        <table className="table">
          <thead>
            <tr>
              <th>进口\相位</th>
              {matrix.phaseNames.map((n) => (
                <th key={n}>{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.cells.map((row, i) => (
              <tr key={matrix.approachIds[i]}>
                <td>{matrix.approachNames[i]}</td>
                {row.map((cell) => (
                  <td key={cell.phaseId} style={{ fontWeight: cell.active ? 700 : 400 }}>
                    {cell.label}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PhaseFacePanel({
  signal,
  approaches,
}: {
  signal: SignalScheme
  approaches: Approach[]
}) {
  const colors = useChartColors()
  const phases = signal.phases
  const [idx, setIdx] = useState(0)
  const ph = phases[Math.min(idx, Math.max(0, phases.length - 1))] ?? phases[0]
  const svg = useMemo(() => {
    if (!ph) return ''
    return themeSvg(
      phaseFaceDiagramSvg(
        approaches.map((a) => ({ name: a.name, bearingDeg: a.bearingDeg, id: a.id })),
        { name: ph.name, releases: ph.releases },
        { size: 300 },
      ),
      colors,
    )
  }, [ph, approaches, colors])
  if (!phases.length) return null
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>相位灯态图</span>
        <small>切换相位预览</small>
      </div>
      <div className="toolbar" style={{ marginBottom: 8 }}>
        {phases.map((p, i) => (
          <button key={p.id} type="button" className={i === idx ? 'primary' : 'ghost'} onClick={() => setIdx(i)}>
            {p.name}
          </button>
        ))}
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}

export function FlowDirectionPanel({
  approaches,
  flow,
  mode = 'natural',
}: {
  approaches: Approach[]
  flow: FlowScheme
  mode?: FlowDisplayMode
}) {
  const colors = useChartColors()
  const [style, setStyle] = useState<RoadGeeFlowStyle>({ ...DEFAULT_ROADGEE_FLOW_STYLE })
  const align = useMemo(() => buildFlowAlignment(approaches, flow, mode), [approaches, flow, mode])
  const check = useMemo(() => flowChartsAlignWithTable(approaches, flow, mode), [approaches, flow, mode])
  const svgRoadgee = useMemo(
    () => roadgeeFlowDiagramSvg(approaches, flow, { size: 420, mode, style }),
    [approaches, flow, mode, style],
  )
  const svgClassic = useMemo(
    () => themeSvg(flowMovementDiagramSvg(align.diagramData, { size: 320 }), colors),
    [align, colors],
  )
  const patch = (p: Partial<RoadGeeFlowStyle>) => setStyle((s) => ({ ...s, ...p }))
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>流量流向图</span>
        <small>
          {align.unit} · {check.ok ? '与表同源✓' : '同源异常'} · 改表即改图
        </small>
      </div>
      <div className="field-row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <label>
          颜色方案
          <select value={style.scheme} onChange={(e) => patch({ scheme: Number(e.target.value) as 1 | 2 | 3 })}>
            <option value={1}>方案1</option>
            <option value={2}>方案2</option>
            <option value={3}>方案3</option>
          </select>
        </label>
        <label>
          粗细
          <input type="number" step={0.1} min={0.5} max={3} value={style.thickness}
            onChange={(e) => patch({ thickness: Number(e.target.value) })} />
        </label>
        <label>
          字号Σ
          <input type="number" min={10} max={24} value={style.font3}
            onChange={(e) => patch({ font3: Number(e.target.value) })} />
        </label>
        <label>
          间距
          <input type="number" min={20} max={80} value={style.spacing}
            onChange={(e) => patch({ spacing: Number(e.target.value) })} />
        </label>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            const blob = new Blob([svgRoadgee], { type: 'image/svg+xml' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = 'crossdraw-流量流向图.svg'
            a.click()
            URL.revokeObjectURL(a.href)
          }}
        >
          下载图片
        </button>
      </div>
      <div className="chart-svg-host chart-svg-host--pro" dangerouslySetInnerHTML={{ __html: svgRoadgee }} />
      <details className="subpanel" style={{ marginTop: 8 }}>
        <summary className="subpanel-summary">经典流向（对照）</summary>
        <div className="subpanel-body" dangerouslySetInnerHTML={{ __html: svgClassic }} />
      </details>

      <div className="table-wrap" style={{ marginTop: 8, maxHeight: 140 }}>
        <table className="table">
          <thead>
            <tr>
              <th>进口</th>
              <th>L</th>
              <th>T</th>
              <th>R</th>
              <th>Σ</th>
            </tr>
          </thead>
          <tbody>
            {align.rows.map((r) => (
              <tr key={r.approachId}>
                <td>{r.approachName.replace('进口', '')}</td>
                <td>{Math.round(r.chartL)}</td>
                <td>{Math.round(r.chartT)}</td>
                <td>{Math.round(r.chartR)}</td>
                <td>{Math.round(r.chartL + r.chartT + r.chartR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TimeSpacePanel({ corridor }: { corridor: BandCorridor }) {
  const colors = useChartColors()
  const svg = useMemo(
    () =>
      themeSvg(
        timeSpaceDiagramSvg(
          corridor.nodes.map((n) => ({
            name: n.name,
            distanceM: n.distanceM,
            greenRatio: n.greenRatio,
            offsetSec: n.offsetSec,
            cycleSec: n.cycleSec,
          })),
          corridor.speedKmh,
          { width: 340, height: 240 },
        ),
        colors,
      ),
    [corridor, colors],
  )
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>绿波时距图</span>
        <small>双向轨迹 · 教材图解</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}
