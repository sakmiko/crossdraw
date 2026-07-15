import { useMemo } from 'react'
import {
  barChartSvg,
  compareSchemesBarSvg,
  conflictMatrixSvg,
  crossSectionBarSvg,
  groupedBarSvg,
  lineChartSvg,
  losGaugeSvg,
  radarChartSvg,
  ringBarrierSvg,
  stackedBandSvg,
} from './svgCharts'
import type {
  AnalysisResult,
  BandCorridor,
  CrossSection,
  FlowScheme,
  SignalScheme,
  Approach,
  Phase,
} from '@/domain/types'
import { buildConflictMatrix } from '@/domain/signal/conflictMatrix'
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
    const byAp = new Map<string, { name: string; sum: number; n: number; max: number }>()
    for (const l of analysis.lanes) {
      const cur = byAp.get(l.approachId) ?? { name: l.approachName, sum: 0, n: 0, max: 0 }
      cur.sum += l.vc
      cur.n += 1
      cur.max = Math.max(cur.max, l.vc)
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
      { height: 150, unit: 'v/c 均值' },
    )
    return themeSvg(raw, colors)
  }, [analysis, colors])

  const delaySvg = useMemo(() => {
    const raw = barChartSvg(
      analysis.lanes.slice(0, 12).map((l) => ({
        label: `${l.approachName.replace('进口', '')}${l.movement}`,
        value: l.delaySec,
        color: l.delaySec >= 80 ? '#e85d5d' : l.delaySec >= 55 ? '#e5a54b' : '#6b8afd',
      })),
      { height: 150, unit: 's' },
    )
    return themeSvg(raw, colors)
  }, [analysis, colors])

  const radar = useMemo(() => {
    // normalize metrics into comparable axes (lower better for delay/queue/vc; invert for shape)
    const vc = Math.min(1.5, analysis.avgVc) / 1.5
    const delay = Math.min(120, analysis.avgDelay) / 120
    const queue = Math.min(300, analysis.avgQueueM) / 300
    const losMap: Record<string, number> = { A: 0.1, B: 0.25, C: 0.4, D: 0.55, E: 0.75, F: 1 }
    const los = losMap[analysis.losFinal] ?? 0.5
    const raw = radarChartSvg(
      [
        { label: 'v/c', value: vc, max: 1 },
        { label: '延误', value: delay, max: 1 },
        { label: '排队', value: queue, max: 1 },
        { label: 'LOS', value: los, max: 1 },
        { label: '稳定', value: Math.min(1, analysis.avgVc), max: 1 },
      ],
      { height: 190, title: '运行质量雷达（越大越差）' },
    )
    return themeSvg(raw, colors)
  }, [analysis, colors])

  const gauge = useMemo(
    () => themeSvg(losGaugeSvg(analysis.losFinal, analysis.avgDelay), colors),
    [analysis, colors],
  )

  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>服务水平</span>
        <small>与 KPI 同源</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: gauge }} />
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>饱和度 v/c（按进口）</span>
        <small>与评价表联动</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: vcSvg }} />
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>延误 (s)</span>
        <small>车道组/转向</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: delaySvg }} />
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>综合雷达</span>
        <small>归一化指标</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: radar }} />
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

export function SignalCharts({
  signal,
  approaches,
}: {
  signal: SignalScheme
  approaches?: Approach[]
}) {
  const colors = useChartColors()
  const ring = useMemo(
    () =>
      themeSvg(
        ringBarrierSvg(
          signal.phases.map((p) => ({
            name: p.isOverlap ? `${p.name}*` : p.name,
            greenSec: p.greenSec,
            yellowSec: p.yellowSec,
            allRedSec: p.allRedSec,
          })),
          signal.cycleSec,
          { height: 78 },
        ),
        colors,
      ),
    [signal, colors],
  )

  const matrix = useMemo(() => {
    if (!approaches?.length) return ''
    const { keys, cells } = buildConflictMatrix(approaches)
    const levels = cells.map((row) => row.map((c) => c.level))
    const raw = conflictMatrixSvg(
      keys.map((k) => k.label),
      levels,
    )
    return themeSvg(raw, colors)
  }, [approaches, colors])

  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>相位时间条</span>
        <small>绿/黄/全红 · *搭接</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: ring }} />
      {matrix && (
        <>
          <div className="chart-title" style={{ marginTop: 12 }}>
            <span>转向冲突矩阵</span>
            <small>与放行组合对照</small>
          </div>
          <div dangerouslySetInnerHTML={{ __html: matrix }} />
        </>
      )}
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

export function CrossSectionCharts({ section }: { section: CrossSection }) {
  const colors = useChartColors()
  const svg = useMemo(() => {
    const raw = crossSectionBarSvg(
      section.components.map((c) => ({ label: c.label, widthM: c.widthM, color: c.color })),
      { height: 120 },
    )
    return themeSvg(raw, colors)
  }, [section, colors])
  const total = section.components.reduce((s, c) => s + c.widthM, 0)
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>断面组成图</span>
        <small>总宽 {total.toFixed(2)} m</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="table-wrap" style={{ maxHeight: 140, marginTop: 8 }}>
        <table className="table">
          <thead>
            <tr>
              <th>组件</th>
              <th>宽度 m</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {section.components.map((c, i) => (
              <tr key={i}>
                <td>
                  <span className="legend-swatch" style={{ background: c.color, display: 'inline-block', marginRight: 6 }} />
                  {c.label}
                </td>
                <td>{c.widthM.toFixed(2)}</td>
                <td>{((c.widthM / Math.max(0.01, total)) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CompareCharts({
  rows,
}: {
  rows: { label: string; avgVc: number; avgDelay: number; los: string }[]
}) {
  const colors = useChartColors()
  const delaySvg = useMemo(
    () => themeSvg(compareSchemesBarSvg(rows, { metric: 'delay', height: 150 }), colors),
    [rows, colors],
  )
  const vcSvg = useMemo(
    () => themeSvg(compareSchemesBarSvg(rows, { metric: 'vc', height: 150 }), colors),
    [rows, colors],
  )
  if (!rows.length) return <p className="hint">暂无多方案</p>
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>多方案延误对比</span>
        <small>色=LOS</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: delaySvg }} />
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>多方案 v/c 对比</span>
        <small>同源 evaluate</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: vcSvg }} />
    </div>
  )
}

// re-export Phase type usage guard
export type { Phase }
