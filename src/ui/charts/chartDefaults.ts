/**
 * Shared ECharts interaction chrome (v0.5.136).
 * All interactive boards should go through withChartDefaults().
 */
import type { EChartsCoreOption } from 'echarts/core'

export type ChartDefaultsOpts = {
  /** enable dataZoom when many categories/points */
  dataZoom?: boolean | 'auto'
  legend?: boolean
  toolboxSave?: boolean
  /** data point count hint for auto dataZoom */
  pointCount?: number
}

const baseText = { color: '#94a3b8', fontSize: 10 }

export function withChartDefaults(
  option: EChartsCoreOption,
  opts: ChartDefaultsOpts = {},
): EChartsCoreOption {
  const pointCount = opts.pointCount ?? 0
  const wantZoom =
    opts.dataZoom === true || (opts.dataZoom === 'auto' && pointCount > 6)
  const legend = opts.legend !== false
  const toolboxSave = opts.toolboxSave !== false

  const o: Record<string, unknown> = { ...(option as object) }
  // idempotent: skip if already decorated
  if (o.__cdDefaults) return option
  o.__cdDefaults = true

  if (!o.tooltip) {
    o.tooltip = {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      textStyle: { fontSize: 11 },
    }
  }

  if (legend && o.legend === undefined) {
    o.legend = {
      top: 0,
      type: 'scroll',
      textStyle: baseText,
    }
  }

  if (wantZoom && !o.dataZoom) {
    o.dataZoom = [
      { type: 'inside', filterMode: 'none' },
      { type: 'slider', height: 16, bottom: 4, filterMode: 'none' },
    ]
    // leave room for slider
    const grid = (o.grid as Record<string, unknown>) || {}
    if (grid.bottom === undefined || Number(grid.bottom) < 36) {
      o.grid = { ...grid, bottom: 36 }
    }
  }

  if (toolboxSave) {
    const existing = (o.toolbox as Record<string, unknown>) || {}
    const feature = (existing.feature as Record<string, unknown>) || {}
    o.toolbox = {
      right: 8,
      top: 0,
      itemSize: 12,
      ...existing,
      feature: {
        saveAsImage: { title: '保存图片', pixelRatio: 2 },
        ...feature,
      },
    }
  }

  // emphasis defaults on series
  if (Array.isArray(o.series)) {
    o.series = o.series.map((s) => {
      if (!s || typeof s !== 'object') return s
      const ser = s as Record<string, unknown>
      if (!ser.emphasis) {
        ser.emphasis = { focus: 'series' }
      }
      return ser
    })
  }

  if (!o.animationDuration) {
    o.animationDuration = 280
  }

  return o as EChartsCoreOption
}
