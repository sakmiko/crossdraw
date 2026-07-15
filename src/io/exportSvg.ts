import type { Mesh } from '@/domain/types'

export function meshToSvg(mesh: Mesh, title = 'Crossdraw'): string {
  const pad = 20
  const w = Math.max(100, mesh.bbox.maxX - mesh.bbox.minX + pad * 2)
  const h = Math.max(100, mesh.bbox.maxY - mesh.bbox.minY + pad * 2)
  const ox = -mesh.bbox.minX + pad
  const oy = -mesh.bbox.minY + pad
  const parts: string[] = []
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
  )
  parts.push(`<title>${escapeXml(title)}</title>`)
  parts.push(`<rect width="100%" height="100%" fill="#e8eef5"/>`)
  for (const p of mesh.polygons) {
    const d = p.points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x + ox},${y + oy}`).join(' ') + ' Z'
    parts.push(
      `<path d="${d}" fill="${p.fill ?? 'none'}" fill-opacity="${p.alpha ?? 1}" stroke="${p.stroke ?? 'none'}" stroke-width="${p.strokeWidth ?? 0}"/>`,
    )
  }
  for (const l of mesh.polylines) {
    const d = l.points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x + ox},${y + oy}`).join(' ')
    const dash = l.dashed ? ' stroke-dasharray="2 2"' : ''
    parts.push(
      `<path d="${d}" fill="none" stroke="${l.stroke ?? '#000'}" stroke-width="${l.strokeWidth ?? 1}"${dash}/>`,
    )
  }
  for (const lb of mesh.labels) {
    parts.push(
      `<text x="${lb.at[0] + ox}" y="${lb.at[1] + oy}" fill="${lb.color ?? '#000'}" font-size="${lb.size ?? 12}" text-anchor="${lb.align === 'center' ? 'middle' : 'start'}" font-family="system-ui,sans-serif">${escapeXml(lb.text)}</text>`,
    )
  }
  parts.push(`</svg>`)
  return parts.join('\n')
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
