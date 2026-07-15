import { useMemo, useState } from 'react'
import {
  controlMatrixSvg,
  flowMovementDiagramSvg,
  phaseFaceDiagramSvg,
  signalTimingDiagramSvg,
  timeSpaceDiagramSvg,
} from './professionalDiagrams'
import type { Approach, BandCorridor, FlowScheme, SignalScheme } from '@/domain/types'
import { buildSignalTimingAlignment, signalChartsAlignWithTable } from '@/domain/signal/timingAlign'
import {
  buildReleaseMatrix,
  controlMatrixChartInput,
  releaseMatrixAlignsWithPhases,
} from '@/domain/signal/releaseAlign'
import { useAppStore } from '@/state/store'

function useChartColors() {
  const theme = useAppStore((s) => s.theme)
  return theme === 'light'
    ? { bg: '#ffffff', grid: '#e2e8f0', label: '#64748b', text: '#0f172a', muted: '#64748b' }
    : { bg: '#0b1018', grid: '#1c2533', label: '#7d8b9e', text: '#e6edf5', muted: '#64748b' }
}

function themeSvg(svg: string, c: { bg: string; grid: string; label: string; text: string; muted: string }) {
  return svg
    .replaceAll('#0a1020', c.bg)
    .replaceAll('#1e293b', c.grid)
    .replaceAll('#334155', c.grid)
    .replaceAll('#8494ab', c.label)
    .replaceAll('#94a3b8', c.label)
    .replaceAll('#64748b', c.muted)
    .replaceAll('#e2e8f0', c.text)
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
}: {
  approaches: Approach[]
  flow: FlowScheme
}) {
  const colors = useChartColors()
  const svg = useMemo(() => {
    const data = approaches.map((a) => {
      const v = flow.volumes[a.id] ?? { L: 0, T: 0, R: 0, U: 0 }
      return { name: a.name.replace('进口', ''), bearingDeg: a.bearingDeg, L: v.L, T: v.T, R: v.R }
    })
    return themeSvg(flowMovementDiagramSvg(data, { size: 340 }), colors)
  }, [approaches, flow, colors])
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>流量流向箭头图</span>
        <small>线宽∝流量</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
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
