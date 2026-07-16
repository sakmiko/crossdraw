/**
 * Roundabout layout plan SVG — radii / lanes from computeRoundaboutLayout.
 * Engineering schematic; not full design-code capacity library.
 */
import type { Approach } from '@/domain/types'
import { computeRoundaboutLayout, roundaboutAnnotation } from '@/domain/geometry/roundabout'
import { escapeXml } from './chartStandards'

export function professionalRoundaboutPlanSvg(
  approaches: Approach[],
  opts: { size?: number; projectName?: string; title?: string } = {},
): string {
  const size = opts.size ?? 720
  const layout = computeRoundaboutLayout(approaches, 18)
  const cx = size / 2
  const cy = size / 2 + 8
  const scale = (size * 0.32) / Math.max(layout.outerR, 1)

  let g = ''
  g += `<rect width="${size}" height="${size}" fill="#f8fafc"/>`
  g += `<rect x="10" y="10" width="${size - 20}" height="${size - 20}" rx="12" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="40" fill="#0f172a" font-size="16" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(opts.title ?? '环形交叉口布局图')}</text>`
  g += `<text x="28" y="58" fill="#64748b" font-size="11">${escapeXml(opts.projectName ?? '')} · ${escapeXml(roundaboutAnnotation(layout))}</text>`

  // outer pavement
  const R = layout.outerR * scale
  const r = layout.innerR * scale
  g += `<circle cx="${cx}" cy="${cy}" r="${R + 8}" fill="#cbd5e1" opacity="0.45"/>`
  g += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#94a3b8" stroke="#64748b" stroke-width="2"/>`
  // circulatory lanes
  for (const lr of layout.laneRadii) {
    g += `<circle cx="${cx}" cy="${cy}" r="${lr * scale}" fill="none" stroke="#f8fafc" stroke-width="1.5" stroke-dasharray="6 4"/>`
  }
  // central island
  g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#86efac" stroke="#16a34a" stroke-width="2"/>`
  g += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#14532d" font-size="12" font-weight="700">中心岛</text>`

  // approach arms
  approaches.forEach((ap) => {
    const rad = ((ap.bearingDeg - 90) * Math.PI) / 180
    const x0 = cx + Math.cos(rad) * (R + 4)
    const y0 = cy + Math.sin(rad) * (R + 4)
    const x1 = cx + Math.cos(rad) * (R + 90)
    const y1 = cy + Math.sin(rad) * (R + 90)
    const half = Math.max(12, (ap.entryLanes.length + ap.exitLanes.length) * 4)
    // throat bar
    const px = -Math.sin(rad)
    const py = Math.cos(rad)
    g += `<line x1="${x0 + px * half}" y1="${y0 + py * half}" x2="${x0 - px * half}" y2="${y0 - py * half}" stroke="#475569" stroke-width="10" stroke-linecap="round"/>`
    g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#64748b" stroke-width="${half * 0.9}" stroke-linecap="round" opacity="0.55"/>`
    g += `<text x="${x1 + Math.cos(rad) * 8}" y="${y1 + Math.sin(rad) * 8}" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="700">${escapeXml(ap.name.replace('进口', ''))}</text>`
    g += `<text x="${x1 + Math.cos(rad) * 8}" y="${y1 + Math.sin(rad) * 8 + 14}" text-anchor="middle" fill="#64748b" font-size="10">${ap.entryLanes.length}进/${ap.exitLanes.length}出 · ${ap.bearingDeg.toFixed(0)}°</text>`
  })

  // dimension notes
  const notes = [
    `内岛 r = ${layout.innerR.toFixed(1)} m`,
    `外缘 R = ${layout.outerR.toFixed(1)} m`,
    `环道 ${layout.laneCount} 车道 · 宽 ${layout.circulatoryWidth.toFixed(1)} m`,
    `进口喉 r≈ ${layout.entryThroatR.toFixed(1)} m`,
  ]
  notes.forEach((n, i) => {
    g += `<text x="28" y="${size - 70 + i * 16}" fill="#334155" font-size="12">${escapeXml(n)}</text>`
  })
  g += `<text x="${size - 28}" y="${size - 24}" text-anchor="end" fill="#94a3b8" font-size="10">示意半径随进口宽度联动 · 非完整环岛设计规范库</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function roundaboutLayoutMarkdown(
  projectName: string,
  approaches: Approach[],
): string {
  const layout = computeRoundaboutLayout(approaches, 18)
  return [
    `# ${projectName} · 环岛布局参数`,
    '',
    `- ${roundaboutAnnotation(layout)}`,
    `- 内岛 r=${layout.innerR.toFixed(2)} m · 外缘 R=${layout.outerR.toFixed(2)} m`,
    `- 环道车道数 ${layout.laneCount} · 总宽 ${layout.circulatoryWidth.toFixed(2)} m`,
    '',
    '| 进口 | 方位° | 进口道 | 出口道 |',
    '|------|------:|------:|------:|',
    ...approaches.map(
      (a) => `| ${a.name} | ${a.bearingDeg.toFixed(0)} | ${a.entryLanes.length} | ${a.exitLanes.length} |`,
    ),
    '',
    '- 依据：工程示意，半径由进口总宽推算；非 FHWA/CJJ 完整环岛设计库',
  ].join('\n')
}
