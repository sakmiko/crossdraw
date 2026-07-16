/**
 * Reusable ECharts wrapper — auto-resize, canvas renderer, PNG export helper.
 * Analysis/timing boards use this for live interaction (RoadGee-style).
 */
import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { BarChart, LineChart, ScatterChart, RadarChart, PieChart, HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent,
  MarkLineComponent,
  MarkPointComponent,
  VisualMapComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart, LineChart, ScatterChart, RadarChart, PieChart, HeatmapChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  DataZoomComponent, ToolboxComponent, MarkLineComponent, MarkPointComponent,
  VisualMapComponent,
  CanvasRenderer,
])

export type ChartProps = {
  option: EChartsCoreOption
  style?: React.CSSProperties
  className?: string
  autoResize?: boolean
  theme?: string
}

export type EChartHandle = {
  getDataURL: (opts?: { type?: 'png' | 'jpeg'; pixelRatio?: number; backgroundColor?: string }) => string | null
  getInstance: () => echarts.ECharts | null
}

export const EChart = forwardRef<EChartHandle, ChartProps>(function EChart(
  { option, style, className, autoResize = true, theme },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!hostRef.current) return
    const c = echarts.init(hostRef.current, theme, { renderer: 'canvas' })
    chartRef.current = c
    return () => {
      c.dispose()
      chartRef.current = null
    }
  }, [theme])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true })
  }, [option])

  const onResize = useCallback(() => {
    chartRef.current?.resize({ animation: { duration: 120 } })
  }, [])

  useEffect(() => {
    if (!autoResize || !hostRef.current) return
    const ro = new ResizeObserver(onResize)
    ro.observe(hostRef.current)
    return () => ro.disconnect()
  }, [autoResize, onResize])

  useImperativeHandle(ref, () => ({
    getDataURL: (opts) => {
      const c = chartRef.current
      if (!c) return null
      return c.getDataURL({
        type: opts?.type ?? 'png',
        pixelRatio: opts?.pixelRatio ?? 2,
        backgroundColor: opts?.backgroundColor ?? '#0f172a',
      })
    },
    getInstance: () => chartRef.current,
  }), [])

  return (
    <div
      ref={hostRef}
      className={className ?? 'echart-host'}
      style={{ width: '100%', height: 320, minHeight: 200, ...style }}
    />
  )
})

/** Off-DOM render of an option to PNG data URL (for export center). */
export async function echartsOptionToPngDataUrl(
  option: EChartsCoreOption,
  size: { width?: number; height?: number; pixelRatio?: number; backgroundColor?: string } = {},
): Promise<string> {
  const width = size.width ?? 900
  const height = size.height ?? 420
  const el = document.createElement('div')
  el.style.cssText = `width:${width}px;height:${height}px;position:fixed;left:-9999px;top:0;`
  document.body.appendChild(el)
  const c = echarts.init(el, undefined, { renderer: 'canvas', width, height })
  c.setOption(option, { notMerge: true })
  // allow layout
  await new Promise((r) => requestAnimationFrame(() => r(null)))
  const url = c.getDataURL({
    type: 'png',
    pixelRatio: size.pixelRatio ?? 2,
    backgroundColor: size.backgroundColor ?? '#0f172a',
  })
  c.dispose()
  el.remove()
  return url
}

export { echarts }
