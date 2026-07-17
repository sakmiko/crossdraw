/**
 * Shared ECharts interaction chrome (v0.5.137).
 * Colors follow CSS variables for light/dark readability.
 */
import type { EChartsCoreOption } from 'echarts/core'

export type ChartDefaultsOpts = {
  dataZoom?: boolean | 'auto'
  legend?: boolean
  toolboxSave?: boolean
  pointCount?: number
}

function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function themeColors() {
  const isLight = typeof document !== 'undefined'
    && document.documentElement.getAttribute('data-theme') === 'light'
  return {
    text: cssVar('--chart-text', isLight ? '#0f172a' : '#f8fafc'),
    muted: cssVar('--chart-label', isLight ? '#64748b' : '#94a3b8'),
    border: cssVar('--border', isLight ? 'rgba(15,23,42,0.12)' : 'rgba(148,163,184,0.2)'),
    panel: cssVar('--chart-bg', isLight ? '#ffffff' : '#0d1222'),
    tooltipBg: cssVar('--tooltip-bg', isLight ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.92)'),
  }
}

export function withChartDefaults(
  option: EChartsCoreOption,
  opts: ChartDefaultsOpts = {},
): EChartsCoreOption {
  const pointCount = opts.pointCount ?? 0
  const wantZoom =
    opts.dataZoom === true || (opts.dataZoom === 'auto' && pointCount > 6)
  const legend = opts.legend !== false
  const toolboxSave = opts.toolboxSave !== false
  const c = themeColors()

  const o: Record<string, unknown> = { ...(option as object) }
  if (o.__cdDefaults) return option
  o.__cdDefaults = true

  if (!o.backgroundColor) {
    o.backgroundColor = 'transparent'
  }

  if (!o.textStyle) {
    o.textStyle = { color: c.text, fontSize: 11 }
  } else if (typeof o.textStyle === 'object') {
    o.textStyle = { color: c.text, ...(o.textStyle as object) }
  }

  if (!o.tooltip) {
    o.tooltip = {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { fontSize: 11, color: c.text },
    }
  } else if (typeof o.tooltip === 'object') {
    const tip = { ...(o.tooltip as object) } as Record<string, unknown>
    if (!tip.textStyle) tip.textStyle = { fontSize: 11, color: c.text }
    if (!tip.backgroundColor) tip.backgroundColor = c.tooltipBg
    o.tooltip = tip
  }

  if (legend && o.legend === undefined) {
    o.legend = {
      top: 0,
      type: 'scroll',
      textStyle: { color: c.muted, fontSize: 10 },
    }
  } else if (legend && o.legend && typeof o.legend === 'object') {
    const leg = { ...(o.legend as object) } as Record<string, unknown>
    if (!leg.textStyle) leg.textStyle = { color: c.muted, fontSize: 10 }
    o.legend = leg
  }

  if (wantZoom && !o.dataZoom) {
    o.dataZoom = [
      { type: 'inside', filterMode: 'none' },
      { type: 'slider', height: 16, bottom: 4, filterMode: 'none',
        textStyle: { color: c.muted },
        borderColor: c.border,
        fillerColor: 'rgba(2, 132, 199, 0.15)',
      },
    ]
    const grid = (o.grid as Record<string, unknown>) || {}
    if (grid.bottom === undefined || Number(grid.bottom) < 36) {
      o.grid = { ...grid, bottom: 36 }
    }
  }

  // Axis label colors when axis present
  for (const key of ['xAxis', 'yAxis'] as const) {
    const ax = o[key]
    const paint = (a: Record<string, unknown>) => {
      if (!a.axisLabel) a.axisLabel = { color: c.muted, fontSize: 10 }
      else if (typeof a.axisLabel === 'object') {
        a.axisLabel = { color: c.muted, fontSize: 10, ...(a.axisLabel as object) }
      }
      if (!a.axisLine) a.axisLine = { lineStyle: { color: c.border } }
      if (!a.splitLine && key === 'yAxis') {
        a.splitLine = { lineStyle: { color: c.border, type: 'dashed' } }
      }
      return a
    }
    if (Array.isArray(ax)) o[key] = ax.map((a) => (a && typeof a === 'object' ? paint({ ...(a as object) }) : a))
    else if (ax && typeof ax === 'object') o[key] = paint({ ...(ax as object) })
  }

  if (toolboxSave) {
    const existing = (o.toolbox as Record<string, unknown>) || {}
    const feature = (existing.feature as Record<string, unknown>) || {}
    o.toolbox = {
      right: 8,
      top: 0,
      itemSize: 12,
      iconStyle: { borderColor: c.muted },
      ...existing,
      feature: {
        saveAsImage: {
          title: '保存图片',
          pixelRatio: 2,
          backgroundColor: c.panel,
        },
        ...feature,
      },
    }
  }

  if (Array.isArray(o.series)) {
    o.series = o.series.map((s) => {
      if (!s || typeof s !== 'object') return s
      const ser = s as Record<string, unknown>
      if (!ser.emphasis) ser.emphasis = { focus: 'series' }
      return ser
    })
  }

  if (!o.animationDuration) o.animationDuration = 280
  return o as EChartsCoreOption
}
