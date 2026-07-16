/**
 * Interactive ECharts option builders — homology with AnalysisResult / cycle scan.
 */
import type { AnalysisResult, Approach, FlowScheme, SignalScheme, BandCorridor, BandResult } from '@/domain/types'
import { buildFlowAlignment, type FlowDisplayMode } from '@/domain/flow/flowAlign'
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
