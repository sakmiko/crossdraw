/**
 * Scheme comparison delta table (RoadGee-style multi-scheme).
 */
export type SchemeKpi = {
  label: string
  avgVc: number
  avgDelay: number
  los: string
  cycleSec: number
}

export type SchemeDelta = {
  label: string
  dVc: number
  dDelay: number
  better: boolean
}

export function schemeDeltas(base: SchemeKpi, rows: SchemeKpi[]): SchemeDelta[] {
  return rows
    .filter((r) => r.label !== base.label)
    .map((r) => {
      const dVc = r.avgVc - base.avgVc
      const dDelay = r.avgDelay - base.avgDelay
      return {
        label: r.label,
        dVc,
        dDelay,
        better: dDelay < -0.5 || (Math.abs(dDelay) < 0.5 && dVc < -0.02),
      }
    })
}

export function schemeDeltaMarkdown(name: string, base: SchemeKpi, deltas: SchemeDelta[]): string {
  return [
    `# ${name} · 方案差量（相对 ${base.label}）`,
    '',
    '| 方案 | Δv/c | Δ延误s | 更优 |',
    '|------|------:|-------:|------|',
    ...deltas.map(
      (d) =>
        `| ${d.label} | ${d.dVc >= 0 ? '+' : ''}${d.dVc.toFixed(3)} | ${d.dDelay >= 0 ? '+' : ''}${d.dDelay.toFixed(1)} | ${d.better ? '是' : ''} |`,
    ),
  ].join('\n')
}
