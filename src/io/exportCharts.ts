import { downloadBlob, downloadText } from './download'

export function exportSvgFile(name: string, svg: string) {
  const body = svg.includes('<svg') ? svg : `<svg xmlns="http://www.w3.org/2000/svg">${svg}</svg>`
  downloadText(name.endsWith('.svg') ? name : `${name}.svg`, body, 'image/svg+xml;charset=utf-8')
}

export function exportJsonFile(name: string, data: unknown) {
  downloadText(
    name.endsWith('.json') ? name : `${name}.json`,
    JSON.stringify(data, null, 2),
    'application/json',
  )
}

export async function exportSvgAsPng(name: string, svg: string, scale = 2): Promise<void> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('svg image load failed'))
      img.src = url
    })
    const w = Math.max(1, img.naturalWidth || 800)
    const h = Math.max(1, img.naturalHeight || 600)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.fillStyle = '#0b1018'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png failed'))), 'image/png')
    })
    downloadBlob(name.endsWith('.png') ? name : `${name}.png`, png)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Markdown report for scheme documentation */
export function analysisMarkdown(
  projectName: string,
  summary: {
    avgVc: number
    avgDelay: number
    avgQueueM: number
    losFinal: string
    cycleSec?: number
    Y?: number
    notes?: string[]
  },
): string {
  const lines = [
    `# ${projectName} — 交叉口评价简报`,
    '',
    '## 汇总指标',
    '',
    `| 指标 | 值 | 依据 |`,
    `|---|---|---|`,
    `| 平均 v/c | ${summary.avgVc.toFixed(3)} | 通行能力法 c=s·g/C |`,
    `| 车均延误 (s) | ${summary.avgDelay.toFixed(1)} | HCM 风格均匀+随机延误近似 |`,
    `| 平均排队 (m) | ${summary.avgQueueM.toFixed(1)} | 简化排队模型 · 5.5m/车 |`,
    `| 服务水平 LOS | ${summary.losFinal} | 延误分级（HCM 信号交叉口常用阈值） |`,
  ]
  if (summary.cycleSec != null) {
    lines.push(`| 周期 C (s) | ${summary.cycleSec} | Webster / 优化结果 |`)
  }
  if (summary.Y != null) {
    lines.push(`| 关键流量比 Y | ${summary.Y.toFixed(3)} | Webster 1958 |`)
  }
  lines.push('', '## 说明', '')
  lines.push(...(summary.notes ?? ['详见 docs/research/05-professional-basis.md']).map((n) => `- ${n}`))
  lines.push('')
  return lines.join('\n')
}
