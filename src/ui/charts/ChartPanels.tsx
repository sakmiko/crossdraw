import { useMemo } from 'react'
import {
  barChartSvg,
  groupedBarSvg,
  lineChartSvg,
  ringBarrierSvg,
  stackedBandSvg,
} from './svgCharts'
import type { AnalysisResult, BandCorridor, FlowScheme, SignalScheme, Approach } from '@/domain/types'
import { useAppStore } from '@/state/store'

function useChartColors() {
  const theme = useAppStore((s) => s.theme)
  return theme === 'light'
    ? { bg: '#ffffff', grid: '#e2e8f0', label: '#64748b', text: '#0f172a' }
    : { bg: '#0b1018', grid: '#1c2533', label: '#7d8b9e', text: '#e6edf5' }
}

function themeSvg(svg: string, c: { bg: string; grid: string; label: string; text: string }) {
  return svg
    .replaceAll('#0a1020', c.bg)
    .replaceAll('#1e293b', c.grid)
    .replaceAll('#1c2533', c.grid)
    .replaceAll('#334155', c.grid)
    .replaceAll('#8494ab', c.label)
    .replaceAll('#64748b', c.label)
    .replaceAll('#94a3b8', c.label)
    .replaceAll('#e8eef7', c.text)
    .replaceAll('#f1f5f9', c.text)
    .replaceAll('#e2e8f0', c.text)
}

export function AnalysisCharts({ analysis }: { analysis: AnalysisResult }) {
  const colors = useChartColors()
  const vcSvg = useMemo(() => {
    const byAp = new Map<string, { name: string; sum: number; n: number }>()
    for (const l of analysis.lanes) {
      const cur = byAp.get(l.approachId) ?? { name: l.approachName, sum: 0, n: 0 }
      cur.sum += l.vc
      cur.n += 1
      byAp.set(l.approachId, cur)
    }
    const raw = barChartSvg(
      [...byAp.values()].map((v) => {
        const avg = v.sum / Math.max(1, v.n)
        return {
          label: v.name.replace('进口', ''),
          value: avg,
          color: avg > 0.85 ? '#e85d5d' : avg > 0.7 ? '#e5a54b' : '#3ecf8e',
        }
      }),
      { height: 150, unit: 'v/c' },
    )
    return themeSvg(raw, colors)
  }, [analysis, colors])

  const delaySvg = useMemo(() => {
    const raw = barChartSvg(
      analysis.lanes.slice(0, 12).map((l) => ({
        label: `${l.approachName.replace('进口', '')}${l.movement}`,
        value: l.delaySec,
        color: '#6b8afd',
      })),
      { height: 150, unit: 's' },
    )
    return themeSvg(raw, colors)
  }, [analysis, colors])

  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>饱和度 v/c（按进口）</span>
        <small>与评价表联动</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: vcSvg }} />
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>延误 (s)</span>
        <small>车道组/转向</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: delaySvg }} />
    </div>
  )
}

export function FlowCharts({
  approaches,
  flow,
}: {
  approaches: Approach[]
  flow: FlowScheme
}) {
  const colors = useChartColors()
  const svg = useMemo(() => {
    const raw = groupedBarSvg(
      approaches.map((ap) => {
        const v = flow.volumes[ap.id] ?? { U: 0, L: 0, T: 0, R: 0 }
        return {
          group: ap.name.replace('进口', ''),
          items: [
            { key: 'L', value: v.L, color: '#0891b2' },
            { key: 'T', value: v.T, color: '#2563eb' },
            { key: 'R', value: v.R, color: '#7c3aed' },
          ],
        }
      }),
      { height: 160 },
    )
    return themeSvg(raw, colors)
  }, [approaches, flow, colors])

  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>转向流量</span>
        <small>L / T / R · 与矩阵同步</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="legend">
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: '#0891b2' }} />
          左转
        </span>
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: '#2563eb' }} />
          直行
        </span>
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: '#7c3aed' }} />
          右转
        </span>
      </div>
    </div>
  )
}

export function SignalCharts({ signal }: { signal: SignalScheme }) {
  const colors = useChartColors()
  const ring = useMemo(() => themeSvg(ringBarrierSvg(signal.phases, signal.cycleSec, { height: 70 }), colors), [signal, colors])
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>相位时间条</span>
        <small>绿/黄/全红</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: ring }} />
    </div>
  )
}

export function BandCharts({ corridor }: { corridor: BandCorridor }) {
  const colors = useChartColors()
  const space = useMemo(
    () =>
      themeSvg(
        stackedBandSvg(
          corridor.nodes.map((n) => ({
            name: n.name,
            distanceM: n.distanceM,
            greenRatio: n.greenRatio,
            offsetSec: n.offsetSec,
          })),
          corridor.nodes[0]?.cycleSec ?? 90,
          { height: 150 },
        ),
        colors,
      ),
    [corridor, colors],
  )
  const offsets = useMemo(
    () =>
      themeSvg(
        lineChartSvg(
          [
            {
              name: '相位差',
              color: '#3b9eff',
              points: corridor.nodes.map((n) => ({ x: n.distanceM, y: n.offsetSec })),
            },
          ],
          { height: 130, xLabel: '距离 (m)' },
        ),
        colors,
      ),
    [corridor, colors],
  )
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>时空图</span>
        <small>绿波带 · 数据联动</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: space }} />
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>相位差沿途</span>
        <small>s</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: offsets }} />
    </div>
  )
}
