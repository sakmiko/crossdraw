/**
 * Peak hour factor (PHF) and peak 15-min flow.
 * v15 = v_h / (4 * PHF)
 */
export function peak15MinFlow(hourlyVolume: number, phf: number): number {
  const p = Math.min(1, Math.max(0.25, phf || 0.92))
  return hourlyVolume / (4 * p)
}

export function applyPhfToHourly(hourlyVolume: number, phf: number): {
  hourly: number
  peak15: number
  designHourly: number
} {
  const peak15 = peak15MinFlow(hourlyVolume, phf)
  return {
    hourly: hourlyVolume,
    peak15,
    /** design hourly used in some analyses = 4 * peak15 */
    designHourly: peak15 * 4,
  }
}

export function phfSummaryMarkdown(name: string, phf: number, sampleHourly: number): string {
  const r = applyPhfToHourly(sampleHourly, phf)
  return [
    `# ${name} · PHF`,
    '',
    `- PHF = ${phf}`,
    `- 示例小时流量 ${sampleHourly} → 高峰15min ${r.peak15.toFixed(0)} · 设计小时 ${r.designHourly.toFixed(0)}`,
  ].join('\n')
}
