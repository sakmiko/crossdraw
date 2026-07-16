/**
 * Export ECharts option as PNG download (homology: option builders only).
 */
import type { EChartsCoreOption } from 'echarts/core'
import { echartsOptionToPngDataUrl } from '@/ui/charts/EChart'
import { downloadBlob } from '@/io/download'

export async function downloadEchartsPng(
  filename: string,
  option: EChartsCoreOption,
  size?: { width?: number; height?: number; pixelRatio?: number; backgroundColor?: string },
) {
  const dataUrl = await echartsOptionToPngDataUrl(option, size)
  const bin = atob(dataUrl.split(',')[1] ?? '')
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  downloadBlob(filename.endsWith('.png') ? filename : `${filename}.png`, new Blob([arr], { type: 'image/png' }))
}
