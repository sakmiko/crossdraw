import { useMemo } from 'react'
import {
  compareSchemesBarSvg,
  conflictMatrixSvg,
  crossSectionBarSvg,
  groupedBarSvg,
  lineChartSvg,
  losGaugeSvg,
  radarChartSvg,
  ringBarrierSvg,
  saturationHeatLegendSvg,
  stackedBandSvg,
  timingCompareBarSvg,
  vcHeatColor,
} from './svgCharts'
import { barChartOption, losGaugeOption, radarChartOption, ringBarrierOption, conflictMatrixOption, dualRingOption, pedPhaseStripOption, crossSectionBarOption, compareSchemesBarOption, timingCompareBarOption } from '@/ui/charts/interactiveBoards'
import type {
  AnalysisResult,
  BandCorridor,
  CrossSection,
  FlowScheme,
  SignalScheme,
  Approach,
  Phase,
  Project,
} from '@/domain/types'
import { buildConflictMatrix } from '@/domain/signal/conflictMatrix'
import { buildPhaseConflictReport, phaseConflictSummaryText } from '@/domain/signal/phaseConflictView'
import { buildConflictDiagram, conflictDiagramSvg } from '@/domain/signal/conflictDiagram'
import { pedestrianPhaseStripSvg } from './pedestrianDiagram'
import { pedestrianRingSvg } from './pedestrianRing'
import { dualRingDiagramSvg } from './dualRingDiagram'
import { isDualRingEnabled } from '@/domain/signal/dualRing'
import { countPedIntervals } from '@/domain/signal/pedestrian'
import { useAppStore } from '@/state/store'
import {
  collectSchemeSnapshots,
  schemeMetricsCompareSvg,
  schemeTimingStripSvg,
} from './schemeCompareDiagrams'
import { analyzeIntersection } from '@/domain/analysis'
import { buildFlowAlignment, type FlowDisplayMode } from '@/domain/flow/flowAlign'
import { professionalCrossSectionSvg, crossSectionShareSvg } from './crossSectionDiagram'
import { collectCorridorKpis, corridorKpiCompareSvg } from './bandCorridorCompare'
import { chartColorsForTheme, themeSvg } from './chartTheme'
import { EChart } from '@/ui/charts/EChart'
import { vcDelayOption, flowLtrOption, phaseTimingOption, compareSchemesOption, xsectionWidthOption } from '@/ui/charts/interactiveBoards'

function useChartColors() {
  const theme = useAppStore((s) => s.theme)
  return chartColorsForTheme(theme === 'light' ? 'light' : 'dark')
}

export function AnalysisCharts({ analysis }: { analysis: AnalysisResult }) {
  const colors = useChartColors()
  const liveOpt = useMemo(() => vcDelayOption(analysis), [analysis])
  const vcSvg = useMemo(() => {
      const byAp = new Map<string, { name: string; sum: number; n: number; max: number }>()
      for (const l of analysis.lanes) {
        const cur = byAp.get(l.approachId) ?? { name: l.approachName, sum: 0, n: 0, max: 0 }
        cur.sum += l.vc
        cur.n += 1
        cur.max = Math.max(cur.max, l.vc)
        byAp.set(l.approachId, cur)
      }
      const data = [...byAp.values()].map(v => ({
        label: v.name.replace('进口', ''),
        value: v.sum / Math.max(1, v.n),
        color: vcHeatColor(v.sum / Math.max(1, v.n)),
      }))
      return barChartOption(data, { height: 150, unit: 'v/c 均值' })
    }, [analysis])

    const delaySvg = useMemo(() => {
      const data = analysis.lanes.slice(0, 12).map(l => ({
        label: `${l.approachName.replace('进口', '')}${l.movement}`,
        value: l.delaySec,
        color: l.delaySec >= 80 ? '#e85d5d' : l.delaySec >= 55 ? '#e5a54b' : '#6b8afd',
      }))
      return barChartOption(data, { height: 150, unit: 's' })
    }, [analysis])

    const radar = useMemo(() => {
      // normalize metrics into comparable axes (lower better for delay/queue/vc; invert for shape)
      const vc = Math.min(1.5, analysis.avgVc) / 1.5
      const delay = Math.min(120, analysis.avgDelay) / 120
      const queue = Math.min(300, analysis.avgQueueM) / 300
      const losMap: Record<string, number> = { A: 0.1, B: 0.25, C: 0.4, D: 0.55, E: 0.75, F: 1 }
      const los = losMap[analysis.losFinal] ?? 0.5
      const axes = [
        { label: 'v/c', value: vc, max: 1 },
        { label: '延误', value: delay, max: 1 },
        { label: '排队', value: queue, max: 1 },
        { label: 'LOS', value: los, max: 1 },
        { label: '稳定', value: Math.min(1, analysis.avgVc), max: 1 },
      ]
      return radarChartOption(axes, { height: 190, title: '运行质量雷达（越大越差）' })
    }, [analysis])

    const gauge = useMemo(() => losGaugeOption(analysis.losFinal, analysis.avgDelay), [analysis])

    return (
      <div className="analysis-charts">
        <EChart option={gauge} style={{ height: 160 }} />
        <div className="chart-title" style={{ marginTop: 12 }}>
          <span>饱和度 v/c（按进口）</span>
          <small>与评价表联动</small>
        </div>
        <EChart option={vcSvg} style={{ height: 150 }} />
        <div className="chart-title" style={{ marginTop: 12 }}>
          <span>延误 (s)</span>
          <small>车道组/转向</small>
        </div>
        <EChart option={delaySvg} style={{ height: 150 }} />
        <div className="chart-title" style={{ marginTop: 12 }}>
          <span>综合雷达</span>
          <small>归一化指标</small>
        </div>
        <EChart option={radar} style={{ height: 190 }} />
      </div>
    )
}

export function FlowCharts({
  approaches,
  flow,
  mode = 'natural',
}: {
  approaches: Approach[]
  flow: FlowScheme
  mode?: FlowDisplayMode
}) {
  const colors = useChartColors()
  const align = useMemo(() => buildFlowAlignment(approaches, flow, mode), [approaches, flow, mode])
  const svg = useMemo(
    () => themeSvg(groupedBarSvg(align.barGroups, { height: 160 }), colors),
    [align, colors],
  )
  const liveOpt = useMemo(() => flowLtrOption(approaches, flow, mode), [approaches, flow, mode])

  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>转向流量</span>
        <small>
          L / T / R · {align.unit} · Σ={align.mode === 'peak' ? align.totalPeakLTR.toFixed(0) : align.totalLTR.toFixed(0)}
        </small>
      </div>
      <EChart option={liveOpt} style={{ height: 260 }} className="echart-host" />
    </div>
  )
}

export function SignalCharts({
  signal,
  approaches,
  focusPhaseId,
  onFocusPhase,
}: {
  signal: SignalScheme
  approaches?: Approach[]
  focusPhaseId?: string | null
  onFocusPhase?: (id: string) => void
}) {
  const colors = useChartColors()
  const phaseId = focusPhaseId ?? signal.phases[0]?.id ?? null
  const ringOpt = useMemo(() => ringBarrierOption(signal.phases, signal.cycleSec), [signal])

  const report = useMemo(() => {
    if (!approaches?.length) return null
    return buildPhaseConflictReport(approaches, signal, phaseId)
  }, [approaches, signal, phaseId])

  const pedStripOpt = useMemo(() => pedPhaseStripOption(signal), [signal])

  // pedRing removed - redundant with pedStrip ECharts

  const dualRingOpt = useMemo(() => isDualRingEnabled(signal) ? dualRingOption(signal) : null, [signal])

  const matrixOpt = useMemo(() => {
    if (!report) return null
    const levels = report.cells.map((row) => row.map((c) => c.level))
    return conflictMatrixOption(report.keys.map((k) => k.label), levels)
  }, [report])

  // diagram removed - redundant with conflict matrix ECharts

  const phaseOpt = useMemo(() => phaseTimingOption(signal), [signal])

  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>相位 G/Y/AR</span>
        <small>ECharts · Σ≈C</small>
      </div>
      <EChart option={phaseOpt} style={{ height: 240 }} className="echart-host" />
      <div className="chart-title" style={{ marginTop: 10 }}>
        <span>环栏</span>
        <small>轴 = C</small>
      </div>
      <EChart option={ringOpt} style={{ height: 88 }} />
      {dualRingOpt && (
        <>
          <div className="chart-title" style={{ marginTop: 12 }}>
            <span>双环栏</span>
            <small>R1 / R2</small>
          </div>
          {dualRingOpt && <EChart option={dualRingOpt} style={{ height: 168 }} />}
        </>
      )}
      {pedStripOpt && (
        <>
          <div className="chart-title" style={{ marginTop: 12 }}>
            <span>行人</span>
            <small>{countPedIntervals(signal)} 面</small>
          </div>
          <EChart option={pedStripOpt} style={{ height: 160 }} />

        </>
      )}
      {matrixOpt && report && (
        <>
          <div className="chart-title" style={{ marginTop: 12 }}>
            <span>冲突矩阵</span>
            <small>{phaseConflictSummaryText(report)}</small>
          </div>
          <div className="toolbar" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {signal.phases.map((p) => (
              <button
                key={p.id}
                type="button"
                className={p.id === phaseId ? 'primary' : 'ghost'}
                onClick={() => onFocusPhase?.(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
          {matrixOpt && <EChart option={matrixOpt} style={{ height: 200 }} />}

          {report.activeHits.length > 0 ? (
            <div className="table-wrap" style={{ marginTop: 8, maxHeight: 140 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>等级</th>
                    <th>运动对</th>
                    <th>原因</th>
                  </tr>
                </thead>
                <tbody>
                  {report.activeHits.slice(0, 12).map((h, i) => (
                    <tr key={`${h.aKey}-${h.bKey}-${i}`} className={h.level === 'block' ? 'row-block' : 'row-warn'}>
                      <td>{h.level === 'block' ? '禁止' : '警告'}</td>
                      <td>
                        {h.aLabel} × {h.bLabel}
                      </td>
                      <td>{h.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="hint" style={{ marginTop: 8 }}>
              当前相位放行组合在矩阵上无相悖高亮。切换相位或改 L/T/R 即时刷新。
            </p>
          )}
          <p className="hint">
            矩阵全局：禁止 {report.counts.block} · 警告 {report.counts.warn} · 与 detectPhaseConflicts 规则同源
          </p>
        </>
      )}
    </div>
  )
}

export function BandCharts({ corridor }: { corridor: BandCorridor }) {
  const colors = useChartColors()
  const spaceOpt = useMemo(() => {
    const fwd = corridor.nodes.map(n => [n.distanceM, n.offsetSec])
    const bwd = corridor.nodes.map(n => [n.distanceM, n.offsetSec - n.greenRatio * n.cycleSec])
    return {
      grid: { left: 50, right: 16, top: 16, bottom: 32 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value', name: '距离(m)', axisLabel: { fontSize: 9 } },
      yAxis: { type: 'value', name: '时间(s)', axisLabel: { fontSize: 9 } },
      series: [
        { name: '上行', type: 'line', data: fwd, smooth: true, itemStyle: { color: '#38bdf8' } },
        { name: '下行', type: 'line', data: bwd, smooth: true, itemStyle: { color: '#a78bfa' } },
      ],
    }
  }, [corridor])
  const offsetsOpt = useMemo(() => {
    return {
      grid: { left: 50, right: 16, top: 16, bottom: 32 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', name: '距离(m)', axisLabel: { fontSize: 9 } },
    yAxis: { type: 'value', name: '相位差(s)', axisLabel: { fontSize: 9 } },
    series: [{ name: '相位差', type: 'line', data: corridor.nodes.map(n => [n.distanceM, n.offsetSec]), smooth: true, itemStyle: { color: '#3b9eff' }, areaStyle: { opacity: 0.1 } }],
    }
  }, [corridor])
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>时空图</span>
        <small>绿波带 · 数据联动</small>
      </div>
      <EChart option={spaceOpt} style={{ height: 160 }} />
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>相位差沿途</span>
        <small>s</small>
      </div>
      <EChart option={offsetsOpt} style={{ height: 130 }} />
    </div>
  )
}

export function CrossSectionCharts({
  section,
  approach,
}: {
  section: CrossSection
  approach?: import('@/domain/types').Approach
}) {
  const colors = useChartColors()
  const theme = colors.bg === '#ffffff' ? 'light' : 'dark'
  const pro = useMemo(() => {
    if (!approach) return null
    return professionalCrossSectionSvg(section, approach, { theme: theme as 'dark' | 'light' })
  }, [section, approach, theme])
  const shareOpt = useMemo(() => crossSectionBarOption(section.components.map(c => ({ label: c.label, widthM: c.widthM, color: c.color }))), [section])
  const svg = useMemo(() => {
    const raw = crossSectionBarSvg(
      section.components.map((c) => ({ label: c.label, widthM: c.widthM, color: c.color })),
      { height: 100 },
    )
    return themeSvg(raw, colors)
  }, [section, colors])
  const total = section.components.reduce((s, c) => s + c.widthM, 0)
  const liveOpt = useMemo(() => xsectionWidthOption(section.components), [section.components])
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>断面构件宽度</span>
        <small>ECharts · 总宽 {total.toFixed(2)} m</small>
      </div>
      <EChart option={liveOpt} style={{ height: 280 }} className="echart-host" />
      <div className="chart-title" style={{ marginTop: 10 }}>
        <span>标准横断面图</span>
        <small>总宽 {total.toFixed(2)} m · 数据联动</small>
      </div>
      {pro && (
        <div className="xsection-pro" dangerouslySetInnerHTML={{ __html: pro }} />
      )}
      <div className="chart-title" style={{ marginTop: 10 }}>
        <span>类型占比</span>
      </div>
      <EChart option={shareOpt} style={{ height: 120 }} />
      <div className="table-wrap" style={{ maxHeight: 160, marginTop: 8 }}>
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
                  <span
                    className="legend-swatch"
                    style={{ background: c.color, display: 'inline-block', marginRight: 6 }}
                  />
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
  const liveOpt = useMemo(() => compareSchemesOption(rows), [rows])
  if (!rows.length) return <p className="hint">暂无多方案</p>
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>多方案交互对比</span>
        <small>ECharts · 延误+v/c</small>
      </div>
      <EChart option={liveOpt} style={{ height: 280 }} className="echart-host" />
    </div>
  )
}

// re-export Phase type usage guard
export function TimingCompareCharts({
  rows,
}: {
  rows: { label: string; avgDelay: number; avgVc: number; los: string; cycleSec: number; method: string }[]
}) {
  const colors = useChartColors()
  const timingOpt = useMemo(() => timingCompareBarOption(rows.map(r => ({ method: r.method, cycleSec: r.cycleSec, avgVc: r.avgVc, avgDelay: r.avgDelay }))), [rows])
  if (!rows.length) return <p className="hint">暂无比选数据</p>
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>配时方法比选图</span>
        <small>同流量·同渠化</small>
      </div>
      <EChart option={timingOpt} style={{ height: 200 }} />
    </div>
  )
}

export type { Phase }


export function SchemeCompareBoard({ project }: { project: Project }) {
  const colors = useChartColors()
  const snaps = useMemo(() => collectSchemeSnapshots(project, analyzeIntersection), [project])
  const compareOpt = useMemo(() => compareSchemesBarOption(snaps.map(s => ({ label: `${s.channel}/${s.signal}`, avgVc: s.avgVc, avgDelay: s.avgDelay, los: s.los }))), [snaps])
  if (!snaps.length) return <p className="hint">请先在方案树中创建渠化/流量/信号方案</p>
  return (
    <div className="chart-card scheme-compare-board">
      <div className="chart-title">
        <span>并排配时图</span>
        <small>
          {snaps.length} 个组合 · 显示前 4
        </small>
      </div>
      <EChart option={compareOpt} style={{ height: 200 }} />
    </div>
  )
}


export function CorridorCompareCharts({ corridors }: { corridors: BandCorridor[] }) {
  const colors = useChartColors()
  const rows = useMemo(() => collectCorridorKpis(corridors), [corridors])
  const corridorKpiOpt = useMemo(() => barChartOption(rows.map(r => ({ label: r.name, value: r.forwardSec, color: '#38bdf8' })), { height: 200, unit: 's' }), [rows])
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>多走廊带宽对比</span>
        <small>{rows.length} 条 · measureCorridor 同源</small>
      </div>
      <EChart option={corridorKpiOpt} style={{ height: 200 }} />
      <div className="table-wrap" style={{ marginTop: 8, maxHeight: 160 }}>
        <table className="table">
          <thead>
            <tr>
              <th>走廊</th>
              <th>上行b</th>
              <th>下行b</th>
              <th>比</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.forwardSec.toFixed(1)}</td>
                <td>{r.backwardSec.toFixed(1)}</td>
                <td>{(r.bandwidthRatio * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
