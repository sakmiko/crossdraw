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
  const scale = (size * 0.3) / Math.max(layout.outerR, 1)

  let g = ''
  g += `<rect width="${size}" height="${size}" fill="#e0f2fe"/>`
  g += `<rect x="10" y="10" width="${size - 20}" height="${size - 20}" rx="4" fill="#f0f9ff" stroke="#bae6fd"/>`
  g += `<text x="28" y="40" fill="#0f172a" font-size="16" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(opts.title ?? '环形交叉口布局图')}</text>`
  g += `<text x="28" y="58" fill="#64748b" font-size="11">${escapeXml(opts.projectName ?? '')} · ${escapeXml(roundaboutAnnotation(layout))}</text>`

  const R = layout.outerR * scale
  const rIsland = layout.islandR * scale
  const rApron = layout.apronOuterR * scale

  // soft ground halo
  g += `<circle cx="${cx}" cy="${cy}" r="${R + 18}" fill="#cbd5e1" opacity="0.35"/>`
  // continuous circulatory asphalt
  g += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#475569" stroke="#1e293b" stroke-width="2"/>`
  // lane dashed rings
  for (const lr of layout.laneRadii) {
    g += `<circle cx="${cx}" cy="${cy}" r="${lr * scale}" fill="none" stroke="#e2e8f0" stroke-width="1.4" stroke-dasharray="7 5" opacity="0.9"/>`
  }
  // truck apron
  g += `<circle cx="${cx}" cy="${cy}" r="${rApron}" fill="#a8a29e" stroke="#78716c" stroke-width="1.5"/>`
  // circular central island (never square)
  g += `<circle cx="${cx}" cy="${cy}" r="${rIsland}" fill="#4ade80" stroke="#15803d" stroke-width="2"/>`
  g += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#14532d" font-size="12" font-weight="700">中心岛</text>`

  // CCW chevrons
  const midR = (rApron + R) / 2
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2
    const x = cx + Math.cos(ang) * midR
    const y = cy + Math.sin(ang) * midR
    const tx = -Math.sin(ang)
    const ty = Math.cos(ang)
    const nx = -ty
    const ny = tx
    const p1 = `${x - tx * 10 + nx * 5},${y - ty * 10 + ny * 5}`
    const p2 = `${x + tx * 12},${y + ty * 12}`
    const p3 = `${x - tx * 10 - nx * 5},${y - ty * 10 - ny * 5}`
    g += `<polyline points="${p1} ${p2} ${p3}" fill="none" stroke="#f8fafc" stroke-width="2" opacity="0.75"/>`
  }

  // approaches + teardrop splitters
  approaches.forEach((ap) => {
    const rad = ((ap.bearingDeg - 90) * Math.PI) / 180
    const ux = Math.cos(rad)
    const uy = Math.sin(rad)
    const px = -uy
    const py = ux
    const half = Math.max(14, (ap.entryLanes.length + ap.exitLanes.length) * 5)
    const x0 = cx + ux * (R + 2)
    const y0 = cy + uy * (R + 2)
    const x1 = cx + ux * (R + 95)
    const y1 = cy + uy * (R + 95)
    g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#64748b" stroke-width="${half * 0.85}" stroke-linecap="butt" opacity="0.7"/>`
    // teardrop splitter
    const n0 = R + 8
    const n1 = R + 48
    const pts = [
      [cx + ux * n0, cy + uy * n0],
      [cx + ux * (n0 + 10) + px * 6, cy + uy * (n0 + 10) + py * 6],
      [cx + ux * n1 + px * 8, cy + uy * n1 + py * 8],
      [cx + ux * n1 - px * 8, cy + uy * n1 - py * 8],
      [cx + ux * (n0 + 10) - px * 6, cy + uy * (n0 + 10) - py * 6],
    ]
    g += `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="#86efac" stroke="#166534" stroke-width="1.2"/>`
    // yield dash
    g += `<line x1="${cx + ux * (R + 1) + px * half * 0.35}" y1="${cy + uy * (R + 1) + py * half * 0.35}" x2="${cx + ux * (R + 1) - px * half * 0.05}" y2="${cy + uy * (R + 1) - py * half * 0.05}" stroke="#f8fafc" stroke-width="3" stroke-dasharray="4 3"/>`
    g += `<text x="${x1 + ux * 10}" y="${y1 + uy * 10}" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="700">${escapeXml(ap.name.replace('进口', ''))}</text>`
    g += `<text x="${x1 + ux * 10}" y="${y1 + uy * 10 + 14}" text-anchor="middle" fill="#64748b" font-size="10">${ap.entryLanes.length}进/${ap.exitLanes.length}出 · ${ap.bearingDeg.toFixed(0)}°</text>`
  })

  const notes = [
    `内岛 r = ${layout.islandR.toFixed(1)} m（圆形）`,
    `路缘带/Apron 至 ${layout.apronOuterR.toFixed(1)} m`,
    `外缘 R = ${layout.outerR.toFixed(1)} m · ICD≈${layout.icdM.toFixed(0)} m`,
    `环道 ${layout.laneCount} 车道 · 宽 ${layout.circulatoryWidth.toFixed(1)} m`,
  ]
  notes.forEach((n, i) => {
    g += `<text x="28" y="${size - 70 + i * 16}" fill="#334155" font-size="12">${escapeXml(n)}</text>`
  })

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
    `- 内岛 r=${layout.islandR.toFixed(2)} m（圆形）· 外缘 R=${layout.outerR.toFixed(2)} m`,
    `- 环道车道数 ${layout.laneCount} · 总宽 ${layout.circulatoryWidth.toFixed(2)} m · ICD≈${layout.icdM.toFixed(1)} m`,
    '',
    '| 进口 | 方位° | 进口道 | 出口道 |',
    '|------|------:|------:|------:|',
    ...approaches.map(
      (a) => `| ${a.name} | ${a.bearingDeg.toFixed(0)} | ${a.entryLanes.length} | ${a.exitLanes.length} |`,
    ),
    '',
    '- 工程示意：圆形中心岛 + 连续环道 + 水滴形导流岛；非完整规范库',
  ].join('\n')
}
