/**
 * Interactive ECharts option builders — homology with AnalysisResult / cycle scan.
 */
import type { AnalysisResult } from '@/domain/types'
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
