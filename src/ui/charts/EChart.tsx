/**
 * Reusable ECharts wrapper — auto-resize, canvas renderer.
 * Analysis/timing boards use this for live interaction (RoadGee-style).
 */
import { useEffect, useRef, useCallback } from 'react'
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

export function EChart({ option, style, className, autoResize = true, theme }: ChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const c = echarts.init(ref.current, theme, { renderer: 'canvas' })
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
    if (!autoResize || !ref.current) return
    const ro = new ResizeObserver(onResize)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [autoResize, onResize])

  return (
    <div
      ref={ref}
      className={className ?? 'echart-host'}
      style={{ width: '100%', height: 320, minHeight: 200, ...style }}
    />
  )
}

export { echarts }
