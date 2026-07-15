import { useMemo } from 'react'
import {
  controlMatrixSvg,
  flowMovementDiagramSvg,
  signalTimingDiagramSvg,
  timeSpaceDiagramSvg,
} from './professionalDiagrams'
import type { Approach, BandCorridor, FlowScheme, SignalScheme } from '@/domain/types'
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
  const svg = useMemo(
    () =>
      themeSvg(
        signalTimingDiagramSvg(
          signal.phases.map((p) => ({
            name: p.name,
            greenSec: p.greenSec,
            yellowSec: p.yellowSec,
            allRedSec: p.allRedSec,
            isOverlap: p.isOverlap,
          })),
          signal.cycleSec || 90,
        ),
        colors,
      ),
    [signal, colors],
  )
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>信号配时图</span>
        <small>矢量 · 绿/黄/红</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
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
  const svg = useMemo(
    () =>
      themeSvg(
        controlMatrixSvg(
          approaches.map((a) => a.name.replace('进口', '')),
          signal.phases.map((p) => ({ name: p.name, releases: p.releases })),
          approaches.map((a) => a.id),
        ),
        colors,
      ),
    [signal, approaches, colors],
  )
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>管控 / 放行图</span>
        <small>相位×进口</small>
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
        <small>教材图解风格</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}
