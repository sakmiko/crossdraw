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
import { barChartOption, losGaugeOption, radarChartOption } from '@/ui/charts/interactiveBoards'
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
      <div className="chart-title" style={{ marginTop: 10 }}>
        <span>静态条形</span>
        <small>导出同源</small>
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
  const ring = useMemo(
    () =>
      themeSvg(
        ringBarrierSvg(
          signal.phases.map((p) => ({
            name: p.name,
            greenSec: p.greenSec,
            yellowSec: p.yellowSec,
            allRedSec: p.allRedSec,
            isOverlap: p.isOverlap,
          })),
          signal.cycleSec,
          { height: 88 },
        ),
        colors,
      ),
    [signal, colors],
  )

  const report = useMemo(() => {
    if (!approaches?.length) return null
    return buildPhaseConflictReport(approaches, signal, phaseId)
  }, [approaches, signal, phaseId])

  const pedStrip = useMemo(() => {
    if (!approaches?.length) return ''
    return themeSvg(pedestrianPhaseStripSvg(signal, approaches, { width: 360 }), colors)
  }, [approaches, signal, colors])

  const pedRing = useMemo(() => {
    if (!approaches?.length) return ''
    return themeSvg(
      pedestrianRingSvg(approaches, signal, {
        width: 360,
        height: 300,
        focusPhaseId: phaseId,
      }),
      colors,
    )
  }, [approaches, signal, phaseId, colors])

  const dualRing = useMemo(() => {
    if (!isDualRingEnabled(signal)) return ''
    return themeSvg(dualRingDiagramSvg(signal, { width: 360, height: 168 }), colors)
  }, [signal, colors])

  const matrix = useMemo(() => {
    if (!report) return ''
    const levels = report.cells.map((row) => row.map((c) => c.level))
    const hot = new Set(
      report.activeHits.map((h) => [h.aKey, h.bKey].sort().join('|')),
    )
    const raw = conflictMatrixSvg(
      report.keys.map((k) => k.label),
      levels,
      {
        keys: report.keys.map((k) => `${k.approachId}:${k.movement}`),
        active: report.activeKeys,
        hotPairs: hot,
        subtitle: phaseConflictSummaryText(report),
      },
    )
    return themeSvg(raw, colors)
  }, [report, colors])

  const diagram = useMemo(() => {
    if (!approaches?.length) return ''
    const model = buildConflictDiagram(approaches, signal, phaseId)
    return themeSvg(conflictDiagramSvg(model, { width: 360, height: 300 }), colors)
  }, [approaches, signal, phaseId, colors])

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
      <div dangerouslySetInnerHTML={{ __html: ring }} />
      {dualRing && (
        <>
          <div className="chart-title" style={{ marginTop: 12 }}>
            <span>双环栏</span>
            <small>R1 / R2</small>
          </div>
          <div className="chart-svg-host chart-svg-host--pro" dangerouslySetInnerHTML={{ __html: dualRing }} />
        </>
      )}
      {pedStrip && (
        <>
          <div className="chart-title" style={{ marginTop: 12 }}>
            <span>行人</span>
            <small>{countPedIntervals(signal)} 面</small>
          </div>
          <div dangerouslySetInnerHTML={{ __html: pedStrip }} />
          {pedRing && (
            <>
              <div className="chart-title" style={{ marginTop: 12 }}>
                <span>行人环图</span>
                <small>当前相位</small>
              </div>
              <div className="chart-svg-host chart-svg-host--pro" dangerouslySetInnerHTML={{ __html: pedRing }} />
            </>
          )}
        </>
      )}
      {matrix && report && (
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
          <div dangerouslySetInnerHTML={{ __html: matrix }} />
          {diagram && (
            <>
              <div className="chart-title" style={{ marginTop: 12 }}>
                <span>冲突点</span>
                <small>示意</small>
              </div>
              <div dangerouslySetInnerHTML={{ __html: diagram }} />
            </>
          )}
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
  const share = useMemo(() => themeSvg(crossSectionShareSvg(section), colors), [section, colors])
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
      {pro ? (
        <div className="xsection-pro" dangerouslySetInnerHTML={{ __html: pro }} />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      )}
      <div className="chart-title" style={{ marginTop: 10 }}>
        <span>类型占比</span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: share }} />
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
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>多方案延误对比</span>
        <small>色=LOS · 静态</small>
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
export function TimingCompareCharts({
  rows,
}: {
  rows: { label: string; avgDelay: number; avgVc: number; los: string; cycleSec: number; method: string }[]
}) {
  const colors = useChartColors()
  const delaySvg = useMemo(
    () => themeSvg(timingCompareBarSvg(rows, { metric: 'delay', height: 150 }), colors),
    [rows, colors],
  )
  const vcSvg = useMemo(
    () => themeSvg(timingCompareBarSvg(rows, { metric: 'vc', height: 150 }), colors),
    [rows, colors],
  )
  const legend = useMemo(() => themeSvg(saturationHeatLegendSvg(340), colors), [colors])
  if (!rows.length) return <p className="hint">暂无比选数据</p>
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>配时方法比选图</span>
        <small>同流量·同渠化</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: delaySvg }} />
      <div className="chart-title" style={{ marginTop: 10 }}>
        <span>比选饱和度 v/c</span>
        <small>色阶=服务水平区</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: vcSvg }} />
      <div dangerouslySetInnerHTML={{ __html: legend }} />
    </div>
  )
}

export type { Phase }


export function SchemeCompareBoard({ project }: { project: Project }) {
  const colors = useChartColors()
  const snaps = useMemo(() => collectSchemeSnapshots(project, analyzeIntersection), [project])
  const strip = useMemo(
    () =>
      themeSvg(
        schemeTimingStripSvg(snaps, { max: 4, theme: colors.bg === '#ffffff' ? 'light' : 'dark' }),
        colors,
      ),
    [snaps, colors],
  )
  const delaySvg = useMemo(
    () => themeSvg(schemeMetricsCompareSvg(snaps, { metric: 'delay', width: 360, height: 160 }), colors),
    [snaps, colors],
  )
  const vcSvg = useMemo(
    () => themeSvg(schemeMetricsCompareSvg(snaps, { metric: 'vc', width: 360, height: 160 }), colors),
    [snaps, colors],
  )
  if (!snaps.length) return <p className="hint">请先在方案树中创建渠化/流量/信号方案</p>
  return (
    <div className="chart-card scheme-compare-board">
      <div className="chart-title">
        <span>并排配时图</span>
        <small>
          {snaps.length} 个组合 · 显示前 4
        </small>
      </div>
      <div className="scheme-strip" dangerouslySetInnerHTML={{ __html: strip }} />
      <div className="chart-title" style={{ marginTop: 12 }}>
        <span>指标对比</span>
        <small>延误 · v/c</small>
      </div>
      <div className="dual-charts">
        <div dangerouslySetInnerHTML={{ __html: delaySvg }} />
        <div dangerouslySetInnerHTML={{ __html: vcSvg }} />
      </div>
    </div>
  )
}


export function CorridorCompareCharts({ corridors }: { corridors: BandCorridor[] }) {
  const colors = useChartColors()
  const rows = useMemo(() => collectCorridorKpis(corridors), [corridors])
  const svg = useMemo(
    () => themeSvg(corridorKpiCompareSvg(rows, { width: 360, height: 200 }), colors),
    [rows, colors],
  )
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>多走廊带宽对比</span>
        <small>{rows.length} 条 · measureCorridor 同源</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
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
