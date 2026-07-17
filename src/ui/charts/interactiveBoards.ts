/**
 * Interactive ECharts option builders — homology with AnalysisResult / cycle scan.
 * Replaces all static SVG charts with interactive ECharts equivalents.
 */
import type { AnalysisResult, Approach, FlowScheme, SignalScheme, BandCorridor, BandResult, CrossSection, CrossSectionComponent } from '@/domain/types'
import type { SaturationKpi } from '@/domain/signal/saturationKpi'
import type { UnsignalizedAnalysis } from '@/domain/analysis/unsignalized'
import type { TimingCompareRow } from '@/domain/analysis/timingCompare'
import type { QueueEstimate } from '@/domain/analysis/queueStorage'
import type { IntergreenRow } from '@/domain/signal/intergreen'
import type { StorageCheckRow } from '@/domain/channel/storageCheck'
import type { OverlapRow } from '@/ui/charts/overlapReviewBoard'
import type { CriticalLaneRow } from '@/ui/charts/criticalApproachBoard'
import type { PedOptRow } from '@/ui/charts/pedTimingOptBoard'
import type { CycleScanResult } from '@/domain/analysis/cycleScan'
import { buildLostTimeReport } from '@/ui/charts/lostTimeBoard'
import { buildFlowAlignment, type FlowDisplayMode } from '@/domain/flow/flowAlign'
import { losByControlDelay } from '@/ui/charts/chartStandards'
import { isDualRingEnabled, buildDualRingAlignment, phaseDuration } from '@/domain/signal/dualRing'
import { buildConflictMatrix } from '@/domain/signal/conflictMatrix'
import { buildPhaseConflictReport } from '@/domain/signal/phaseConflictView'
import { buildConflictDiagram } from '@/domain/signal/conflictDiagram'
import { buildReleaseMatrix, controlMatrixChartInput } from '@/domain/signal/releaseAlign'
import { pedCrossingsOf, pedWalkFdw, phaseHasPed, countPedIntervals } from '@/domain/signal/pedestrian'
import { collectCriticalLanes } from '@/ui/charts/criticalApproachBoard'
import { computeSaturationKpi } from '@/domain/signal/saturationKpi'
import { computeSchemeY } from '@/domain/signal/autoTimingPack'
import { websterOptimalCycle } from '@/domain/analysis/lostTime'
import { collectPedOptRows } from '@/ui/charts/pedTimingOptBoard'
import { collectOverlapRows } from '@/ui/charts/overlapReviewBoard'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'
import { collectIntergreenRows } from '@/domain/signal/intergreen'
import { collectStorageCheckRows } from '@/domain/channel/storageCheck'
import { estimateQueueStorage } from '@/domain/analysis/queueStorage'
import { scanCycleSensitivity } from '@/domain/analysis/cycleScan'
import type { CorridorKpiRow } from './bandCorridorCompare'
import type { SchemeSnapshot } from './schemeCompareDiagrams'
import type { EChartsCoreOption } from 'echarts/core'

const LOS_COLORS: Record<string, string> = {
  A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', E: '#ef4444', F: '#991b1b',
}

function losFromVc(vc: number): string {
  if (vc <= 0.25) return 'A'
  if (vc <= 0.5) return 'B'
  if (vc <= 0.7) return 'C'
  if (vc <= 0.85) return 'D'
  if (vc <= 0.95) return 'E'
  return 'F'
}

export function vcDelayOption(analysis: AnalysisResult): EChartsCoreOption {
  const rows = analysis.lanes.map((r) => ({
    name: `${r.approachName} ${r.movement}`,
    vc: r.vc,
    delay: r.delaySec,
    los: losFromVc(r.vc),
    q: r.queueM,
  }))
  rows.sort((a, b) => b.vc - a.vc)
  const maxVc = Math.max(1.2, ...rows.map((r) => r.vc), 0.1)

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params as Record<string, unknown>]
        const idx = (items[0] as { dataIndex?: number })?.dataIndex ?? 0
        const r = rows[idx]
        if (!r) return ''
        return `<b>${r.name}</b><br/>v/c ${r.vc.toFixed(3)} · LOS ${r.los}<br/>延误 ${r.delay.toFixed(1)} s<br/>排队 ${r.q.toFixed(1)} m`
      },
    },
    legend: { data: ['v/c', '延误'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 72, right: 48, top: 28, bottom: 56 },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.name),
      axisLabel: { rotate: 32, fontSize: 10 },
    },
    yAxis: [
      { type: 'value', name: 'v/c', min: 0, max: maxVc, splitLine: { lineStyle: { type: 'dashed', opacity: 0.4 } } },
      { type: 'value', name: '延误(s)', min: 0, position: 'right' },
    ],
    dataZoom: [{ type: 'inside', xAxisIndex: 0 }],
    series: [
      {
        name: 'v/c',
        type: 'bar',
        barMaxWidth: 28,
        data: rows.map((r) => ({
          value: Number(r.vc.toFixed(4)),
          itemStyle: { color: LOS_COLORS[r.los] ?? '#64748b', borderRadius: [2, 2, 0, 0] },
        })),
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ yAxis: 1, label: { formatter: 'v/c=1', fontSize: 10 }, lineStyle: { color: '#ef4444', type: 'dashed' } }],
        },
      },
      {
        name: '延误',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbolSize: 6,
        data: rows.map((r) => Number(r.delay.toFixed(2))),
        lineStyle: { width: 2, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
      },
    ],
  }
}

export function cycleScanOption(
  points: { c: number; delay: number; maxVc: number }[],
  currentC: number,
): EChartsCoreOption {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['延误', '最大 v/c'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 56, right: 56, top: 28, bottom: 36 },
    xAxis: { type: 'category', data: points.map((p) => `${p.c}`), name: 'C(s)', nameLocation: 'middle', nameGap: 22 },
    yAxis: [
      { type: 'value', name: '延误(s)', min: 0 },
      { type: 'value', name: 'max v/c', min: 0, position: 'right' },
    ],
    series: [
      {
        name: '延误',
        type: 'line',
        smooth: true,
        data: points.map((p) => p.delay),
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
        markPoint: { data: [{ type: 'min', name: 'min' }], symbolSize: 36 },
        markLine:
          currentC > 0
            ? {
                silent: true,
                symbol: 'none',
                data: [{ xAxis: String(currentC), lineStyle: { color: '#a855f7', type: 'dotted' }, label: { formatter: '当前' } }],
              }
            : undefined,
      },
      {
        name: '最大 v/c',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: points.map((p) => p.maxVc),
        lineStyle: { color: '#f97316', width: 2 },
        itemStyle: { color: '#f97316' },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ yAxis: 1, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: '1.0' } }],
        },
      },
    ],
  }
}


/** Grouped L/T/R bars per approach — homology buildFlowAlignment */
export function flowLtrOption(
  approaches: Approach[],
  flow: FlowScheme,
  mode: FlowDisplayMode = 'natural',
): EChartsCoreOption {
  const align = buildFlowAlignment(approaches, flow, mode)
  const cats = align.barGroups.map((g) => g.group)
  const pick = (key: string) =>
    align.barGroups.map((g) => g.items.find((i) => i.key === key)?.value ?? 0)
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['L', 'T', 'R'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 48, right: 16, top: 28, bottom: 40 },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 4 }],
    xAxis: { type: 'category', data: cats, axisLabel: { fontSize: 10, rotate: cats.length > 5 ? 28 : 0 } },
    yAxis: { type: 'value', name: align.unit, min: 0 },
    series: [
      { name: 'L', type: 'bar', stack: 'ltr', data: pick('L'), itemStyle: { color: '#0891b2' }, barMaxWidth: 28 },
      { name: 'T', type: 'bar', stack: 'ltr', data: pick('T'), itemStyle: { color: '#2563eb' }, barMaxWidth: 28 },
      { name: 'R', type: 'bar', stack: 'ltr', data: pick('R'), itemStyle: { color: '#7c3aed' }, barMaxWidth: 28 },
    ],
  }
}


/** Stacked G/Y/AR bars per phase — axis sum vs cycle C (homology timing). */
export function phaseTimingOption(signal: SignalScheme): EChartsCoreOption {
  const phases = signal.phases.filter((p) => !p.isOverlap)
  const names = phases.map((p) => p.name)
  const greens = phases.map((p) => p.greenSec)
  const yellows = phases.map((p) => p.yellowSec)
  const allReds = phases.map((p) => p.allRedSec)
  const sums = phases.map((p) => p.greenSec + p.yellowSec + p.allRedSec)
  const C = Math.max(1, signal.cycleSec)
  const mainSum = sums.reduce((a, b) => a + b, 0)
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params as Record<string, unknown>]
        const idx = (items[0] as { dataIndex?: number })?.dataIndex ?? 0
        const p = phases[idx]
        if (!p) return ''
        const s = p.greenSec + p.yellowSec + p.allRedSec
        return `${p.name}<br/>G ${p.greenSec}s · Y ${p.yellowSec}s · AR ${p.allRedSec}s · Σ ${s}s`
      },
    },
    legend: { data: ['绿', '黄', '全红'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 48, right: 16, top: 28, bottom: 36 },
    xAxis: { type: 'category', data: names, axisLabel: { fontSize: 10, rotate: names.length > 5 ? 24 : 0 } },
    yAxis: {
      type: 'value',
      name: 's',
      min: 0,
      max: Math.max(C, ...sums, 1) * 1.05,
    },
    series: [
      { name: '绿', type: 'bar', stack: 'ph', data: greens, itemStyle: { color: '#22c55e' }, barMaxWidth: 36 },
      { name: '黄', type: 'bar', stack: 'ph', data: yellows, itemStyle: { color: '#eab308' }, barMaxWidth: 36 },
      { name: '全红', type: 'bar', stack: 'ph', data: allReds, itemStyle: { color: '#ef4444' }, barMaxWidth: 36 },
      {
        name: 'C',
        type: 'line',
        data: names.map(() => C),
        symbol: 'none',
        lineStyle: { type: 'dashed', color: '#a855f7', width: 1.5 },
        tooltip: { show: false },
      },
    ],
    graphic: [
      {
        type: 'text',
        right: 12,
        top: 8,
        style: {
          text: `Σ主相 ${mainSum.toFixed(0)}s / C ${C}s`,
          fill: Math.abs(mainSum - C) <= 1.5 ? '#22c55e' : '#f97316',
          fontSize: 11,
        },
      },
    ],
  }
}


/** Green-wave KPI: forward/backward band + offsets by node (homology BandResult). */
export function bandBandwidthOption(
  corridor: BandCorridor,
  band: BandResult,
): EChartsCoreOption {
  const nodes = corridor.nodes
  const nameById = new Map(nodes.map((n) => [n.id, n.name]))
  const offMap = new Map(band.offsets.map((o) => [o.id, o.offsetSec]))
  const cats = nodes.map((n) => n.name.replace('路口', '').slice(0, 8))
  const offsets = nodes.map((n) => offMap.get(n.id) ?? n.offsetSec)
  const greens = nodes.map((n) => {
    const C = Math.max(1, n.cycleSec || 90)
    return n.greenRatio * C
  })
  const fwd = band.forwardBandwidthSec ?? band.bandwidthSec
  const bwd = band.backwardBandwidthSec ?? 0
  const C0 = Math.max(1, nodes[0]?.cycleSec ?? 90)
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['相位差', '绿时长', '上行b', '下行b'], top: 0, textStyle: { fontSize: 10 } },
    grid: { left: 48, right: 48, top: 28, bottom: 40 },
    dataZoom: [{ type: 'inside' }],
    xAxis: {
      type: 'category',
      data: cats,
      axisLabel: { fontSize: 10, rotate: cats.length > 5 ? 28 : 0 },
    },
    yAxis: [
      { type: 'value', name: 's', min: 0 },
      { type: 'value', name: 'b(s)', min: 0, position: 'right' },
    ],
    series: [
      {
        name: '相位差',
        type: 'bar',
        data: offsets,
        itemStyle: { color: '#3b82f6' },
        barMaxWidth: 22,
      },
      {
        name: '绿时长',
        type: 'line',
        data: greens,
        smooth: true,
        itemStyle: { color: '#22c55e' },
        lineStyle: { width: 2 },
      },
      {
        name: '上行b',
        type: 'line',
        yAxisIndex: 1,
        data: cats.map(() => fwd),
        symbol: 'none',
        lineStyle: { type: 'dashed', color: '#06b6d4', width: 1.5 },
      },
      {
        name: '下行b',
        type: 'line',
        yAxisIndex: 1,
        data: cats.map(() => bwd),
        symbol: 'none',
        lineStyle: { type: 'dotted', color: '#f97316', width: 1.5 },
      },
    ],
    graphic: [
      {
        type: 'text',
        right: 10,
        top: 6,
        style: {
          text: `比 ${(band.bandwidthRatio * 100).toFixed(1)}% · a ${band.halfCycleDistanceM.toFixed(0)}m · C~${C0}s`,
          fill: '#94a3b8',
          fontSize: 11,
        },
      },
    ],
  }
}


export type CompareSchemeRow = {
  label: string
  avgVc: number
  avgDelay: number
  los: string
}

/** Multi-scheme delay + v/c dual axis (homology collectCompareRows / analyzeIntersection). */
export function compareSchemesOption(rows: CompareSchemeRow[]): EChartsCoreOption {
  const labels = rows.map((r) => {
    const parts = r.label.split('/')
    return (parts[parts.length - 1] || r.label).slice(0, 10)
  })
  const delays = rows.map((r) => r.avgDelay)
  const vcs = rows.map((r) => r.avgVc)
  const losColor: Record<string, string> = {
    A: '#22c55e',
    B: '#84cc16',
    C: '#eab308',
    D: '#f97316',
    E: '#ef4444',
    F: '#b91c1c',
  }
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params as { dataIndex?: number }]
        const idx = (items[0] as { dataIndex?: number })?.dataIndex ?? 0
        const r = rows[idx]
        if (!r) return ''
        return `${r.label}<br/>延误 ${r.avgDelay.toFixed(1)}s · v/c ${r.avgVc.toFixed(3)} · LOS ${r.los}`
      },
    },
    legend: { data: ['延误', 'v/c'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 52, right: 52, top: 28, bottom: labels.length > 4 ? 56 : 36 },
    dataZoom: labels.length > 6 ? [{ type: 'inside' }, { type: 'slider', height: 14, bottom: 4 }] : undefined,
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { fontSize: 10, rotate: labels.length > 4 ? 28 : 0 },
    },
    yAxis: [
      { type: 'value', name: '延误(s)', min: 0 },
      { type: 'value', name: 'v/c', min: 0, position: 'right' },
    ],
    series: [
      {
        name: '延误',
        type: 'bar',
        data: delays.map((v, i) => ({
          value: v,
          itemStyle: { color: losColor[rows[i]?.los] ?? '#3b82f6' },
        })),
        barMaxWidth: 28,
      },
      {
        name: 'v/c',
        type: 'line',
        yAxisIndex: 1,
        data: vcs,
        smooth: true,
        itemStyle: { color: '#a855f7' },
        lineStyle: { width: 2 },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ yAxis: 1, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: '1.0' } }],
        },
      },
    ],
  }
}


/** Cross-section component widths (stacked bar + type share) — homology section.components. */
export function xsectionWidthOption(
  components: CrossSectionComponent[],
  opts?: { title?: string },
): EChartsCoreOption {
  const comps = components.filter((c) => c.widthM > 0)
  const labels = comps.map((c) => c.label.replace('进口', '进').replace('出口', '出').slice(0, 10))
  const widths = comps.map((c) => c.widthM)
  const colors = comps.map((c) => c.color || '#64748b')
  const total = widths.reduce((a, b) => a + b, 0) || 1
  // type aggregation for pie
  const byType = new Map<string, number>()
  for (const c of comps) {
    byType.set(c.type, (byType.get(c.type) ?? 0) + c.widthM)
  }
  const typeNames: Record<string, string> = {
    sidewalk: '人行',
    bike: '非机',
    vehicle: '机动车',
    median: '中分',
    shoulder: '路肩/辅',
    green: '绿化',
  }
  const pieData = [...byType.entries()].map(([t, w]) => ({
    name: typeNames[t] ?? t,
    value: +w.toFixed(2),
  }))
  return {
    backgroundColor: 'transparent',
    title: opts?.title
      ? { text: opts.title, left: 0, top: 0, textStyle: { fontSize: 12, fontWeight: 600 } }
      : undefined,
    tooltip: {
      trigger: 'item',
      formatter: (p: { seriesType?: string; name?: string; value?: number; percent?: number }) => {
        if (p.seriesType === 'pie') {
          return `${p.name}<br/>${Number(p.value).toFixed(2)} m · ${Number(p.percent).toFixed(1)}%`
        }
        return `${p.name}<br/>${Number(p.value).toFixed(2)} m · ${((Number(p.value) / total) * 100).toFixed(1)}%`
      },
    },
    legend: { type: 'scroll', bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 48, right: 12, top: 28, bottom: 48 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { fontSize: 9, rotate: labels.length > 6 ? 32 : 0 },
    },
    yAxis: { type: 'value', name: 'm', min: 0 },
    series: [
      {
        name: '宽度',
        type: 'bar',
        data: widths.map((w, i) => ({ value: w, itemStyle: { color: colors[i] } })),
        barMaxWidth: 28,
        label: { show: labels.length <= 10, position: 'top', fontSize: 9, formatter: (p: { value?: number }) => `${Number(p.value).toFixed(1)}` },
      },
      {
        name: '类型占比',
        type: 'pie',
        radius: ['18%', '32%'],
        center: ['82%', '38%'],
        data: pieData,
        label: { fontSize: 9, formatter: '{b}\n{d}%' },
        z: 3,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 8,
        top: 6,
        style: {
          text: `总宽 ${total.toFixed(2)} m · ${comps.length} 构件`,
          fill: '#94a3b8',
          fontSize: 11,
        },
      },
    ],
  }
}

/** Critical approach board — ranked v/c + heat color bars. */
export function criticalApproachOption(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  analysis: AnalysisResult,
  opts: { width?: number } = {},
): EChartsCoreOption {
  const W = opts.width ?? 720
  const kpi = computeSaturationKpi(approaches, flow, signal)
  const y = computeSchemeY(approaches, flow, signal)
  const rows = collectCriticalLanes(analysis, 8)
  const rowH = 30
  const top = 80
  const H = top + 24 + Math.max(1, rows.length) * rowH + 32

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return ''
        const idx = (params as { dataIndex?: number }).dataIndex ?? 0
        if (idx === undefined || idx >= rows.length) return ''
        const r = rows[idx]
        return `${r.approachName}<br/>${r.movement}<br/>v/c ${r.vc.toFixed(3)} · 延误 ${r.delaySec.toFixed(1)}s · 量 ${r.volumePeak.toFixed(0)}`
      },
    },
    grid: { left: 80, right: 24, top: top + 8, bottom: 24 },
    xAxis: {
      type: 'value',
      name: 'v/c',
      min: 0,
      max: Math.max(1, ...rows.map((r) => r.vc), 1.1) * 1.05,
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: rows.map((r, i) => `${r.approachName.slice(0, 6)}/${r.movement}`),
      axisLabel: { width: 100 },
      inverse: true,
    },
    series: [
      {
        name: 'v/c',
        type: 'bar',
        barHeight: 18,
        data: rows.map((r) => ({
          value: r.vc,
          itemStyle: {
            color:
              r.vc >= 1.0
                ? '#dc2626'
                : r.vc >= 0.9
                ? '#ea580c'
                : r.vc >= 0.75
                ? '#ca8a04'
                : '#16a34a',
          },
        })),
        label: {
          show: true,
          position: 'right',
          distance: 8,
          formatter: (params: unknown) => {
            const idx = (params as { dataIndex?: number }).dataIndex ?? 0
            const r = rows[idx]
            if (!r) return ''
            return `${r.vc.toFixed(3)}`
          },
          fontSize: 10,
        },
      },
    ],
  }
}

/** Lost-time board — L value + C vs Y curve. */
export function lostTimeOption(
  signal: SignalScheme,
  opts: { width?: number; Y?: number } = {},
): EChartsCoreOption {
  const rep = buildLostTimeReport(signal)
  const Y = opts.Y ?? 0.5
  const Copt = websterOptimalCycle(Y, rep.L)
  const W = opts.width ?? 720
  const H = 280

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return ''
        const idx = (params as { dataIndex?: number }).dataIndex ?? 0
        if (idx >= rep.curve.length) return ''
        const point = rep.curve[idx]
        return `Y=${point.Y}<br/>C=${point.C}s`
      },
    },
    grid: { left: 20, right: 20, top: 50, bottom: 40 },
    xAxis: {
      type: 'value',
      name: 'Y',
      min: 0,
      max: 0.9,
    },
    yAxis: {
      type: 'value',
      name: 'C (s)',
      min: 0,
    },
    series: [
      {
        name: 'C vs Y',
        type: 'line',
        smooth: true,
        data: rep.curve.map((p) => [p.Y, p.C]),
        lineStyle: { width: 2, color: '#3b82f6' },
        areaStyle: {},
      },
      {
        name: 'Current Y',
        type: 'scatter',
        data: [[Y, Copt]],
        symbolSize: 12,
        itemStyle: { color: '#ef4444' },
      },
      {
        name: 'L Line',
        type: 'line',
        data: [[0, rep.L], [0.9, rep.L]],
        lineStyle: { type: 'dashed', width: 1, color: '#64748b' },
        label: {
          show: true,
          position: 'start',
          formatter: `L = ${rep.L.toFixed(1)}s`,
          fontSize: 10,
        },
      },
    ],
  }
}

/** Pedestrian timing optimization board. */
export function pedTimingOptOption(
  signal: SignalScheme,
  approaches: Approach[],
  opts: { width?: number } = {},
): EChartsCoreOption {
  const rows = collectPedOptRows(signal, approaches)
  const W = opts.width ?? 800
  const rowH = 28
  const top = 56
  const H = top + 24 + Math.max(1, rows.length) * rowH + 32

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return ''
        const idx = (params as { dataIndex?: number }).dataIndex ?? 0
        if (idx >= rows.length) return ''
        const r = rows[idx]
        if (!r) return ''
        const needG = r.recWalk + r.recFdw - (r.curWalk + r.curFdw)
        return `${r.phaseName}<br/>当前: Walk ${r.curWalk}s / FDW ${r.curFdw}s<br/>建议: Walk ${r.recWalk}s / FDW ${r.recFdw}s<br/>还需绿时: ${needG > 0 ? '+' : ''}${needG.toFixed(1)}s`
      },
    },
    grid: { left: 80, right: 24, top: top + 8, bottom: 24 },
    xAxis: {
      type: 'value',
      name: 'green time (s)',
      min: 0,
      max: Math.max(
        60,
        ...rows.map((r: { greenSec: number; recWalk: number; recFdw: number }) => Math.max(r.greenSec, r.recWalk + r.recFdw)),
        1,
      ) * 1.05,
    },
    yAxis: {
      type: 'category',
      data: rows.map((r: { phaseName: string }) => r.phaseName.slice(0, 8)),
      axisLabel: { width: 100 },
      inverse: true,
    },
    series: [
      {
        name: '当前绿时',
        type: 'bar',
        barHeight: 16,
        data: rows.map((r: { greenSec: number }) => r.greenSec),
        itemStyle: { color: '#64748b' },
      },
      {
        name: '建议Walk/FDW',
        type: 'bar',
        barHeight: 16,
        data: rows.map((r: { recWalk: number; recFdw: number }) => r.recWalk + r.recFdw),
        itemStyle: { color: '#22c55e' },
      },
    ],
  }
}

/** Overlap (搭接) phase review board. */
export function overlapReviewOption(
  signal: SignalScheme,
  opts: { width?: number } = {},
): EChartsCoreOption {
  const rows = collectOverlapRows(signal)
  const al = buildSignalTimingAlignment(signal)
  const mainN = signal.phases.filter((p) => !p.isOverlap).length
  const W = opts.width ?? 760
  const rowH = 28
  const top = 56
  const H = top + 24 + Math.max(1, rows.length) * rowH + 36

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return ''
        const idx = (params as { dataIndex?: number }).dataIndex ?? 0
        if (idx >= rows.length) return ''
        const r = rows[idx]
        return `${r.name}<br/>G ${r.greenSec}s · Y ${r.yellowSec}s · AR ${r.allRedSec}s<br/>放行: ${r.releases || '—'}`
      },
    },
    grid: { left: 80, right: 24, top: top + 8, bottom: 24 },
    xAxis: {
      type: 'value',
      name: 'green time (s)',
      min: 0,
      max: Math.max(60, ...rows.map((r) => r.greenSec + r.yellowSec + r.allRedSec)) * 1.05,
    },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.name.slice(0, 8)),
      axisLabel: { width: 100 },
      inverse: true,
    },
    series: [
      {
        name: '相位绿时',
        type: 'bar',
        barHeight: 20,
        data: rows.map((r: { greenSec: number }) => r.greenSec),
        itemStyle: { color: '#22c55e' },
      },
    ],
  }
}

/** Intergreen review board — yellow / all-red vs recommendation. */
export function intergreenOption(
  signal: SignalScheme,
  approaches: Approach[],
  opts: { width?: number } = {},
): EChartsCoreOption {
  const rows = collectIntergreenRows(signal, approaches)
  const W = opts.width ?? 860
  const rowH = 26
  const top = 56
  const H = top + 24 + Math.max(1, rows.length) * rowH + 28
  const shortN = rows.filter((r) => r.status === 'short').length

  function col(st: IntergreenRow['status']): string {
    if (st === 'short') return '#dc2626'
    if (st === 'long') return '#ea580c'
    return '#16a34a'
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return ''
        const idx = (params as { dataIndex?: number }).dataIndex ?? 0
        if (idx >= rows.length) return ''
        const r = rows[idx]
        if (!r) return ''
        return `${r.phaseName}<br/>黄灯: ${r.yellowSec}s (推荐 ${r.recYellow}s)<br/>全红: ${r.allRedSec}s (推荐 ${r.recAllRed}s)<br/>状态: ${
          r.status === 'short'
            ? '偏短'
            : r.status === 'long'
            ? '偏长'
            : '正常'
        }`
      },
    },
    grid: { left: 80, right: 24, top: top + 8, bottom: 24 },
    xAxis: {
      type: 'value',
      name: 'time (s)',
      min: 0,
      max: Math.max(
        10,
        ...rows.map((r) => Math.max(r.yellowSec, r.recYellow, r.allRedSec, r.recAllRed)),
        5,
      ) * 1.1,
    },
    yAxis: {
      type: 'category',
      data: rows.map((r: { phaseName: string }) => r.phaseName.slice(0, 8)),
      axisLabel: { width: 100 },
      inverse: true,
    },
    series: [
      {
        name: '现状',
        type: 'bar',
        barHeight: 18,
        data: rows.map((r) => {
          const total = r.yellowSec + r.allRedSec
          return { value: total, itemStyle: { color: col(r.status) } }
        }),
      },
      {
        name: '推荐',
        type: 'bar',
        barHeight: 18,
        data: rows.map((r) => r.recYellow + r.recAllRed),
        itemStyle: { color: '#64748b' },
      },
    ],
  }
}

  /** Storage length check board — queue vs bay. */
  export function storageCheckOption(
    approaches: Approach[],
    signal: SignalScheme,
    analysis: AnalysisResult,
    opts: { width?: number } = {},
  ): EChartsCoreOption {
    const rows = collectStorageCheckRows(approaches, signal, analysis)
    const W = opts.width ?? 860
    const rowH = 26
    const top = 56
    const H = top + 24 + Math.max(1, rows.length) * rowH + 32

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          if (!Array.isArray(params)) return ''
          const idx = (params as { dataIndex?: number }).dataIndex ?? 0
          if (idx >= rows.length) return ''
          const r = rows[idx]
          if (!r) return ''
          return `${r.approachName.slice(0, 6)}/${r.movement}<br/>排队 ${r.queueM.toFixed(1)}m<br/>可用存储 ${r.availableM}m<br/>利用率 ${(r.ratio * 100).toFixed(0)}%`
        },
      },
      grid: { left: 80, right: 24, top: top + 8, bottom: 24 },
      xAxis: {
        type: 'value',
        name: '利用率 (%)',
        min: 0,
        max: 120,
      },
      yAxis: {
        type: 'category',
        data: rows.map((r) => `${r.approachName.slice(0, 6)}/${r.movement}`),
        axisLabel: { width: 120 },
        inverse: true,
      },
      series: [
        {
          name: '利用率',
          type: 'bar',
          barHeight: 20,
          data: rows.map((r) => r.ratio * 100),
          itemStyle: {
            color: (params: unknown) => {
              const idx = (params as { dataIndex?: number }).dataIndex ?? 0
              const r = rows[idx]
              if (!r) return '#64748b'
              return r.status === 'overflow'
                ? '#dc2626'
                : r.status === 'tight'
                ? '#ea580c'
                : '#16a34a'
            },
          },
        },
      ],
    }
  }

  /** Queue storage review board. */
  export function queueStorageOption(
    rows: QueueEstimate[],
    opts: { width?: number } = {},
  ): EChartsCoreOption {
    const W = opts.width ?? 800
    const rowH = 26
    const top = 44
    const H = top + 28 + Math.max(1, rows.length) * rowH + 24

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          if (!Array.isArray(params)) return ''
          const idx = (params as { dataIndex?: number }).dataIndex ?? 0
          if (idx >= rows.length) return ''
          const r = rows[idx]
          if (!r) return ''
          return `${r.approachName.slice(0, 8)}/${r.movement}<br/>流量 ${r.volumeVph.toFixed(0)} veh/h<br/>红时 ${r.redSec}s<br/>车道 ${r.lanes}<br/>车辆 ${r.vehicles.toFixed(1)}<br/>存储长度 ${r.storageM.toFixed(1)}m`
        },
      },
      grid: { left: 80, right: 24, top: top + 8, bottom: 24 },
      xAxis: {
        type: 'value',
        name: '存储长度 (m)',
        min: 0,
      },
      yAxis: {
        type: 'category',
        data: rows.map((r) => `${r.approachName.slice(0, 6)}/${r.movement}`),
        axisLabel: { width: 120 },
        inverse: true,
      },
      series: [
        {
          name: '存储长度',
          type: 'bar',
          barHeight: 20,
          data: rows.map((r) => r.storageM),
          itemStyle: { color: '#3b82f6' },
        },
      ],
    }
  }

  /** Cycle C sensitivity board — delay & max v/c vs cycle. */
  export function cycleScanBoardOption(
    approaches: Approach[],
    flow: FlowScheme,
    signal: SignalScheme,
    opts: {
      width?: number
      height?: number
      minCycle?: number
      maxCycle?: number
      stepSec?: number
      scan?: CycleScanResult
    } = {},
  ): EChartsCoreOption {
    const scan =
      opts.scan ??
      scanCycleSensitivity(approaches, flow, signal, {
        minCycle: opts.minCycle,
        maxCycle: opts.maxCycle,
        stepSec: opts.stepSec,
      })
    const W = opts.width ?? 900
    const H = opts.height ?? 300
    const padL = 52
    const padR = 52
    const padT = 56
    const padB = 36
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const pts = scan.points
    const maxD = Math.max(1, ...pts.map((p) => p.avgDelay), scan.bestDelay.avgDelay)
    const maxV = Math.max(0.5, ...pts.map((p) => p.maxVc), 1.2)
    const minC = scan.minCycle
    const maxC = scan.maxCycle

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          if (!Array.isArray(params)) return ''
          const idx = (params as { dataIndex?: number }).dataIndex ?? 0
          if (idx >= pts.length) return ''
          const p = pts[idx]
          if (!p) return ''
          return `C=${p.cycleSec}s<br/>延误 ${p.avgDelay.toFixed(1)}s<br/>最大 v/c ${p.maxVc.toFixed(3)}`
        },
      },
      grid: { left: padL, right: padR, top: padT, bottom: padB },
      xAxis: {
        type: 'value',
        name: 'C (s)',
        min: minC,
        max: maxC,
      },
      yAxis: [
        {
          type: 'value',
          name: '延误 (s)',
          min: 0,
          max: maxD * 1.05,
          position: 'left',
        },
        {
          type: 'value',
          name: '最大 v/c',
          min: 0,
          max: maxV * 1.05,
          position: 'right',
        },
      ],
      series: [
        {
          name: '延误',
          type: 'line',
          smooth: true,
          data: pts.map((p) => [p.cycleSec, p.avgDelay]),
          lineStyle: { width: 2, color: '#0284c7' },
        },
        {
          name: '最大 v/c',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: pts.map((p) => [p.cycleSec, p.maxVc]),
          lineStyle: { width: 1.5, color: '#ea580c', opacity: 0.9 },
        },
        {
          name: '当前延误',
          type: 'scatter',
          data: [
            [
              scan.currentCycle,
              scan.current.avgDelay,
            ],
          ],
          symbolSize: 8,
          itemStyle: { color: '#6366f1' },
        },
        {
          name: '最小延误点',
          type: 'scatter',
          data: [
            [
              scan.bestDelay.cycleSec,
              scan.bestDelay.avgDelay,
            ],
          ],
          symbolSize: 10,
          itemStyle: { color: '#dc2626' },
        },
        {
          name: '最小maxVC点',
          type: 'scatter',
          data: [
            [
              scan.bestVc.cycleSec,
              scan.bestVc.maxVc,
            ],
          ],
          symbolSize: 10,
          itemStyle: { color: '#f97316' },
        },
      ],
    }
  }

/** LOS gauge chart (ECharts gauge). */
export function losGaugeOption(los: string, delaySec: number): EChartsCoreOption {
  const losMap: Record<string, number> = { A: 10, B: 30, C: 50, D: 65, E: 80, F: 95 }
  const losColor: Record<string, string> = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', E: '#ef4444', F: '#dc2626' }
  return {
    series: [{
      type: 'gauge',
      min: 0, max: 100,
      progress: { show: true, width: 14 },
      axisLine: { lineStyle: { width: 14 } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      detail: {
        valueAnimation: false,
        formatter: `${los} (${delaySec.toFixed(1)}s)`,
        fontSize: 16, fontWeight: 700,
        color: losColor[los] ?? '#94a3b8',
        offsetCenter: [0, '0%'],
      },
      data: [{ value: losMap[los] ?? 50 }],
      itemStyle: { color: losColor[los] ?? '#94a3b8' },
    }],
  }
}

/** Radar chart (ECharts radar). */
export function radarChartOption(
  axes: { label: string; value: number; max?: number }[],
  opts: { height?: number; title?: string } = {},
): EChartsCoreOption {
  return {
    title: opts.title ? { text: opts.title, textStyle: { fontSize: 11, color: '#94a3b8' }, left: 'center', top: 0 } : undefined,
    radar: {
      indicator: axes.map(a => ({ name: a.label, max: a.max ?? 1 })),
      radius: '60%',
      splitNumber: 4,
      axisName: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.15)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.15)' } },
    },
    series: [{
      type: 'radar',
      data: [{ value: axes.map(a => a.value), name: '指标' }],
      areaStyle: { opacity: 0.15 },
      lineStyle: { width: 2 },
      itemStyle: { color: '#38bdf8' },
    }],
  }
}

/** Simple bar chart (replaces barChartSvg). */
export function barChartOption(
  data: { label: string; value: number; color?: string }[],
  opts: { height?: number; unit?: string } = {},
): EChartsCoreOption {
  return {
    grid: { left: 50, right: 16, top: 8, bottom: 24 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.label),
      axisLabel: { fontSize: 10, rotate: data.length > 6 ? 30 : 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 },
      name: opts.unit,
    },
    tooltip: { trigger: 'axis' },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.value,
        itemStyle: d.color ? { color: d.color } : undefined,
      })),
      barMaxWidth: 24,
      label: { show: data.length <= 8, position: 'top', fontSize: 10, formatter: (p: { value: number }) => p.value.toFixed(1) },
    }],
  }
}
