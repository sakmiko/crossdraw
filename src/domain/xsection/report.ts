/**
 * Cross-section report helpers — table/CSV/MD homologous with buildCrossSection.
 * Includes optional aux road strip (frontage) when enabled.
 */
import type { Approach, CrossSection, CrossSectionComponent } from '../types'
import { buildCrossSection, approachHash } from './build'
import { expectedSectionWidth, sectionAlignsWithApproach, sectionTotalWidth } from './align'

export type SectionComponentRow = {
  index: number
  type: string
  label: string
  widthM: number
  sharePct: number
  color: string
}

export type SectionReport = {
  approachId: string
  approachName: string
  bearingDeg: number
  totalWidthM: number
  expectedWidthM: number
  alignOk: boolean
  deltaM: number
  entryLaneCount: number
  exitLaneCount: number
  medianWidthM: number
  sidewalkWidthM: number
  bikeWidthM: number
  auxEnabled: boolean
  auxWidthM: number
  leftWait: boolean
  throughWait: boolean
  borrowLeft: boolean
  components: SectionComponentRow[]
  honesty: string
}

export function buildSectionReport(ap: Approach, xs?: CrossSection): SectionReport {
  const section = xs && xs.sourceHash === approachHash(ap) ? xs : buildCrossSection(ap)
  // attach aux as report-only strip (geometry draws it; classic build may omit)
  const comps = [...section.components]
  if (ap.auxRoad?.enabled) {
    const aw = Math.max(0.5, ap.auxRoad.widthM)
    comps.push({
      type: 'shoulder',
      widthM: aw,
      label: '辅路',
      color: '#57534e',
    })
  }
  const totalBase = sectionTotalWidth(section)
  const auxW = ap.auxRoad?.enabled ? Math.max(0.5, ap.auxRoad.widthM) : 0
  const total = totalBase + auxW
  const align = sectionAlignsWithApproach(ap)
  const rows: SectionComponentRow[] = comps.map((c, i) => ({
    index: i,
    type: c.type,
    label: c.label,
    widthM: c.widthM,
    sharePct: total > 0 ? (c.widthM / total) * 100 : 0,
    color: c.color,
  }))
  return {
    approachId: ap.id,
    approachName: ap.name,
    bearingDeg: ap.bearingDeg,
    totalWidthM: total,
    expectedWidthM: align.expected + auxW,
    alignOk: align.ok,
    deltaM: align.delta,
    entryLaneCount: ap.entryLanes.length,
    exitLaneCount: ap.exitLanes.length,
    medianWidthM: ap.median.widthM,
    sidewalkWidthM: ap.sidewalkWidthM,
    bikeWidthM: ap.bikeEnabled ? ap.bikeWidthM : 0,
    auxEnabled: !!ap.auxRoad?.enabled,
    auxWidthM: auxW,
    leftWait: !!ap.leftWait,
    throughWait: !!ap.throughWait,
    borrowLeft: !!ap.borrowLeft,
    components: rows,
    honesty: '断面与渠化进口参数同源 · 辅路为附加条带示意',
  }
}

export function sectionReportCsv(rep: SectionReport): string {
  const head = 'index,type,label,widthM,sharePct'
  const rows = rep.components.map(
    (c) => `${c.index},${c.type},${JSON.stringify(c.label)},${c.widthM.toFixed(3)},${c.sharePct.toFixed(1)}`,
  )
  const meta = [
    `# approach=${JSON.stringify(rep.approachName)}`,
    `# totalM=${rep.totalWidthM.toFixed(3)} expectedM=${rep.expectedWidthM.toFixed(3)} alignOk=${rep.alignOk ? 1 : 0}`,
    `# entry=${rep.entryLaneCount} exit=${rep.exitLaneCount} median=${rep.medianWidthM} sidewalk=${rep.sidewalkWidthM} bike=${rep.bikeWidthM} aux=${rep.auxWidthM}`,
  ]
  return [...meta, head, ...rows].join('\n')
}

export function sectionReportMarkdown(projectName: string, rep: SectionReport): string {
  return [
    `# ${projectName} · 横断面 · ${rep.approachName}`,
    '',
    `- 方位 ${rep.bearingDeg.toFixed(0)}° · 总宽 **${rep.totalWidthM.toFixed(2)} m**（期望 ${rep.expectedWidthM.toFixed(2)} m · ${rep.alignOk ? '同源✓' : `Δ=${rep.deltaM.toExponential(2)}`}）`,
    `- 进口 ${rep.entryLaneCount} 车道 · 出口 ${rep.exitLaneCount} 车道 · 中分 ${rep.medianWidthM.toFixed(2)} m · 人行 ${rep.sidewalkWidthM.toFixed(2)} m · 非机 ${rep.bikeWidthM > 0 ? rep.bikeWidthM.toFixed(2) + ' m' : '—'}`,
    `- 辅路 ${rep.auxEnabled ? rep.auxWidthM.toFixed(2) + ' m' : '关'} · 左转待转 ${rep.leftWait ? '是' : '否'} · 直行待行 ${rep.throughWait ? '是' : '否'} · 借道左转 ${rep.borrowLeft ? '是' : '否'}`,
    `- ${rep.honesty}`,
    '',
    '| # | 构成 | 类型 | 宽度 m | 占比 |',
    '|--:|------|------|-------:|-----:|',
    ...rep.components.map(
      (c) => `| ${c.index + 1} | ${c.label} | ${c.type} | ${c.widthM.toFixed(2)} | ${c.sharePct.toFixed(1)}% |`,
    ),
  ].join('\n')
}

/** Stack components for diagram when aux enabled (report-only order). */
export function componentsForDiagram(ap: Approach, section: CrossSection): CrossSectionComponent[] {
  const comps = [...section.components]
  if (ap.auxRoad?.enabled) {
    comps.push({
      type: 'shoulder',
      widthM: Math.max(0.5, ap.auxRoad.widthM),
      label: '辅路',
      color: '#57534e',
    })
  }
  return comps
}
