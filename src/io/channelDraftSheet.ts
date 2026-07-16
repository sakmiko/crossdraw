/**
 * Channelization draft sheet — title block, scale bar, north arrow, mesh drawing.
 * Export-only drafting chrome (interactive canvas stays clean).
 * Homology: rebuildChannelMesh / mesh geometry only. Schematic scale, not survey CAD.
 */
import type { ChannelizationScheme, Mesh, Project } from '@/domain/types'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { meshToSvg } from '@/io/exportSvg'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function stripOuterSvg(svg: string): { body: string; vb: [number, number, number, number] } {
  const vbMatch = svg.match(/viewBox=["']([^"']+)["']/)
  const parts = (vbMatch?.[1] ?? '0 0 400 300').split(/[\s,]+/).map(Number)
  const vb: [number, number, number, number] = [
    parts[0] || 0,
    parts[1] || 0,
    parts[2] || 400,
    parts[3] || 300,
  ]
  const body = svg
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .replace(/<rect width="100%" height="100%" fill="[^"]*"\/>/i, '')
  return { body, vb }
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    cross: '十字',
    t: 'T型',
    y: 'Y型',
    skewed: '斜交',
    roundabout: '环形',
    five: '五路',
    custom: '自定义',
  }
  return map[t] ?? t
}

/** Scale bar in drawing units (mesh is approx meters). */
function scaleBarSvg(x: number, y: number, meters = 20, pxPerM = 1): string {
  const len = meters * pxPerM
  let g = ''
  g += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="#0f172a" stroke-width="1.2"/>`
  g += `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="#0f172a" stroke-width="1"/>`
  g += `<line x1="${x + len}" y1="${y - 6}" x2="${x + len}" y2="${y + 6}" stroke="#0f172a" stroke-width="1"/>`
  // ticks mid
  for (let i = 1; i < 4; i++) {
    const tx = x + (len * i) / 4
    g += `<line x1="${tx}" y1="${y - 4}" x2="${tx}" y2="${y + 4}" stroke="#0f172a" stroke-width="0.8"/>`
  }
  g += `<text x="${x}" y="${y + 16}" fill="#334155" font-size="11" font-family="system-ui,sans-serif">0</text>`
  g += `<text x="${x + len}" y="${y + 16}" text-anchor="end" fill="#334155" font-size="11" font-family="system-ui,sans-serif">${meters} m</text>`
  g += `<text x="${x + len / 2}" y="${y - 10}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">比例尺（示意）</text>`
  return g
}

function northArrowSvg(cx: number, cy: number, r = 22): string {
  return [
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#0f172a" stroke-width="1.2"/>`,
    `<polygon points="${cx},${cy - r + 4} ${cx - 8},${cy + 6} ${cx + 8},${cy + 6}" fill="#0f172a"/>`,
    `<polygon points="${cx},${cy - r + 4} ${cx},${cy + 6} ${cx + 8},${cy + 6}" fill="#f8fafc" stroke="#0f172a" stroke-width="0.6"/>`,
    `<text x="${cx}" y="${cy + r + 14}" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="700" font-family="system-ui,sans-serif">N</text>`,
  ].join('')
}

export type ChannelDraftOptions = {
  projectName: string
  paper?: 'A3' | 'A4' | 'A3-landscape' | 'A4-landscape'
  scaleBarMeters?: number
  designer?: string
  date?: string
  drawingNo?: string
}

const PAPER: Record<string, { w: number; h: number; label: string }> = {
  A4: { w: 210, h: 297, label: 'A4 纵向' },
  'A4-landscape': { w: 297, h: 210, label: 'A4 横向' },
  A3: { w: 297, h: 420, label: 'A3 纵向' },
  'A3-landscape': { w: 420, h: 297, label: 'A3 横向' },
}

/**
 * Full drafting sheet in mm user units (1u=1mm), suitable for print SVG.
 */
export function buildChannelDraftSheet(
  project: Project,
  channel: ChannelizationScheme,
  mesh?: Mesh,
  opts: ChannelDraftOptions = { projectName: project.name },
): string {
  const paperKey = opts.paper ?? (channel.display.paperSize === 'A4' ? 'A4-landscape' : 'A3-landscape')
  const paper = PAPER[paperKey] ?? PAPER['A3-landscape']
  const W = paper.w
  const H = paper.h
  const margin = 8
  const titleH = 28
  const when = opts.date ?? new Date().toISOString().slice(0, 10)

  const m = mesh ?? rebuildChannelMesh(channel)
  const raw = meshToSvg(m, project.name)
  const frag = stripOuterSvg(raw)

  // drawing area
  const drawX = margin
  const drawY = margin
  const drawW = W - margin * 2
  const drawH = H - margin * 2 - titleH - 4

  const [, , vbW, vbH] = frag.vb
  const pad = 8
  const scale = Math.min((drawW - pad * 2) / vbW, (drawH - pad * 2) / vbH)
  const dw = vbW * scale
  const dh = vbH * scale
  const ox = drawX + pad + (drawW - pad * 2 - dw) / 2
  const oy = drawY + pad + (drawH - pad * 2 - dh) / 2

  // approximate px per meter: mesh units ≈ meters; scale maps mesh→mm
  const pxPerM = scale

  let body = ''
  body += `<rect width="${W}" height="${H}" fill="#ffffff"/>`
  // outer border double line
  body += `<rect x="${margin - 1.5}" y="${margin - 1.5}" width="${W - 2 * (margin - 1.5)}" height="${H - 2 * (margin - 1.5)}" fill="none" stroke="#0f172a" stroke-width="0.6"/>`
  body += `<rect x="${margin}" y="${margin}" width="${W - 2 * margin}" height="${H - 2 * margin}" fill="none" stroke="#0f172a" stroke-width="0.35"/>`

  // drawing viewport background
  body += `<rect x="${drawX}" y="${drawY}" width="${drawW}" height="${drawH}" fill="#e8eef5"/>`

  // mesh
  body += `<g transform="translate(${ox},${oy}) scale(${scale})">`
  body += `<g transform="translate(${-frag.vb[0]},${-frag.vb[1]})">${frag.body}</g>`
  body += `</g>`

  // north + scale (draft chrome — export only)
  if (channel.display.northArrow !== false) {
    body += northArrowSvg(drawX + drawW - 22, drawY + 28, 14)
  }
  const barM = opts.scaleBarMeters ?? 20
  body += scaleBarSvg(drawX + 12, drawY + drawH - 18, barM, Math.max(0.4, pxPerM))

  // title block bottom
  const ty = H - margin - titleH
  body += `<line x1="${margin}" y1="${ty}" x2="${W - margin}" y2="${ty}" stroke="#0f172a" stroke-width="0.4"/>`
  // cells
  const cols = [
    { x: margin, w: W * 0.34, label: '工程名称', value: opts.projectName || project.name },
    { x: margin + W * 0.34, w: W * 0.22, label: '渠化方案', value: channel.name },
    { x: margin + W * 0.56, w: W * 0.14, label: '交叉口类型', value: typeLabel(channel.intersectionType) },
    { x: margin + W * 0.70, w: W * 0.12, label: '图纸', value: paper.label },
    { x: margin + W * 0.82, w: W * 0.18 - margin, label: '日期', value: when },
  ]
  cols.forEach((c, i) => {
    if (i > 0) body += `<line x1="${c.x}" y1="${ty}" x2="${c.x}" y2="${H - margin}" stroke="#0f172a" stroke-width="0.3"/>`
    body += `<text x="${c.x + 2}" y="${ty + 6}" fill="#64748b" font-size="2.6" font-family="system-ui,sans-serif">${esc(c.label)}</text>`
    body += `<text x="${c.x + 2}" y="${ty + 16}" fill="#0f172a" font-size="3.6" font-weight="700" font-family="system-ui,sans-serif">${esc(c.value)}</text>`
  })
  body += `<line x1="${margin}" y1="${ty + 9}" x2="${W - margin}" y2="${ty + 9}" stroke="#cbd5e1" stroke-width="0.2"/>`

  // meta line
  const designer = opts.designer ?? 'Crossdraw'
  const dno = opts.drawingNo ?? 'CH-01'
  body += `<text x="${margin + 2}" y="${H - margin - 3}" fill="#94a3b8" font-size="2.4" font-family="system-ui,sans-serif">图号 ${esc(dno)} · 设计 ${esc(designer)} · 进口 ${channel.approaches.length} · 示意几何非测绘出图</text>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" class="channel-draft-sheet">
${body}
</svg>`
}

/** Screen-friendly large draft SVG (pixels) for preview in workspace. */
export function channelDraftPreviewSvg(
  project: Project,
  channel: ChannelizationScheme,
  mesh?: Mesh,
  width = 900,
): string {
  const sheet = buildChannelDraftSheet(project, channel, mesh, {
    projectName: project.name,
    paper: 'A3-landscape',
  })
  // wrap for screen: keep viewBox in mm but set pixel width
  return sheet
    .replace(/width="[^"]*mm"/, `width="${width}"`)
    .replace(/height="[^"]*mm"/, `height="${Math.round((width * 297) / 420)}"`)
}

export function channelDraftMarkdown(project: Project, channel: ChannelizationScheme): string {
  return [
    `# ${project.name} · 渠化出图说明 · ${channel.name}`,
    '',
    `- 交叉口类型：${typeLabel(channel.intersectionType)}`,
    `- 进口数：${channel.approaches.length}`,
    `- 图幅：${channel.display.paperSize}（导出可选 A3/A4 横纵）`,
    `- 指北针：${channel.display.northArrow ? '开' : '关'}`,
    '',
    '| 进口 | 方位° | 进口道 | 出口道 | 展宽 |',
    '|------|------:|------:|------:|------|',
    ...channel.approaches.map(
      (a) =>
        `| ${a.name} | ${a.bearingDeg.toFixed(0)} | ${a.entryLanes.length} | ${a.exitLanes.length} | ${(a.widen?.entryWidenCount ?? 0) + (a.widen?.exitWidenCount ?? 0) > 0 ? '是' : '否'} |`,
    ),
    '',
    '- 图框/比例尺/指北仅出现在**导出出图稿**，交互画布保持净几何。',
    '- 比例尺为示意，非测绘精度。',
  ].join('\n')
}
