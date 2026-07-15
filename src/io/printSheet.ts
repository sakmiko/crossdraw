/**
 * A4 print composition board — multi-panel SVG for report print preview.
 * Layout in mm mapped to SVG user units (1 unit = 1 mm).
 * All chart fragments are inlined as groups (data must already be SVG strings).
 */
export type PrintPanel = {
  id: string
  title: string
  /** full <svg>...</svg> markup */
  svg: string
}

export type PrintSheetOptions = {
  projectName: string
  schemeName: string
  /** A4 portrait 210×297 mm */
  paper?: 'A4' | 'A4-landscape'
  generatedAt?: string
  footerNote?: string
}

const A4 = { w: 210, h: 297 }
const A4L = { w: 297, h: 210 }

/** Extract inner content + viewBox from an SVG string */
export function parseSvgFragment(svg: string): { viewBox: string; body: string; vb: [number, number, number, number] } {
  const vbMatch = svg.match(/viewBox=["']([^"']+)["']/)
  const viewBox = vbMatch?.[1] ?? '0 0 400 300'
  const parts = viewBox.split(/[\s,]+/).map(Number)
  const vb: [number, number, number, number] = [
    parts[0] || 0,
    parts[1] || 0,
    parts[2] || 400,
    parts[3] || 300,
  ]
  let body = svg
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
  // strip outer full-size background rects that fight white paper (optional keep first)
  return { viewBox, body, vb }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Build a single A4 SVG sheet with title block + up to 4 chart panels (2×2).
 */
export function buildA4PrintSheet(panels: PrintPanel[], opts: PrintSheetOptions): string {
  const paper = opts.paper === 'A4-landscape' ? A4L : A4
  const W = paper.w
  const H = paper.h
  const margin = 10
  const headerH = 18
  const footerH = 10
  const gap = 4
  const contentTop = margin + headerH
  const contentH = H - margin - footerH - contentTop
  const contentW = W - margin * 2

  const slots = panels.slice(0, 4)
  const cols = slots.length <= 1 ? 1 : 2
  const rows = slots.length <= 2 ? 1 : 2
  // if 3 panels, still 2x2 with one empty
  const cellW = (contentW - gap * (cols - 1)) / cols
  const cellH = (contentH - gap * (rows - 1)) / Math.max(1, rows)

  const when =
    opts.generatedAt ??
    new Date().toISOString().slice(0, 19).replace('T', ' ')

  let body = ''
  // paper background
  body += `<rect width="${W}" height="${H}" fill="#ffffff"/>`
  // outer crop mark frame
  body += `<rect x="${margin - 2}" y="${margin - 2}" width="${W - 2 * (margin - 2)}" height="${H - 2 * (margin - 2)}" fill="none" stroke="#0f172a" stroke-width="0.4"/>`

  // header
  body += `<text x="${margin}" y="${margin + 6}" fill="#0f172a" font-size="5" font-weight="700" font-family="system-ui,sans-serif">${esc(opts.projectName)}</text>`
  body += `<text x="${margin}" y="${margin + 12}" fill="#475569" font-size="3.2" font-family="system-ui,sans-serif">方案 ${esc(opts.schemeName)} · 打印拼版预览 · Crossdraw</text>`
  body += `<text x="${W - margin}" y="${margin + 6}" text-anchor="end" fill="#64748b" font-size="3" font-family="system-ui,sans-serif">${esc(when)}</text>`
  body += `<line x1="${margin}" y1="${margin + headerH - 2}" x2="${W - margin}" y2="${margin + headerH - 2}" stroke="#cbd5e1" stroke-width="0.3"/>`

  slots.forEach((p, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = margin + col * (cellW + gap)
    const y = contentTop + row * (cellH + gap)
    const titleH = 5
    const pad = 2
    body += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.25"/>`
    body += `<text x="${x + pad}" y="${y + 3.8}" fill="#0f172a" font-size="3.2" font-weight="700" font-family="system-ui,sans-serif">${esc(p.title)}</text>`
    body += `<line x1="${x}" y1="${y + titleH}" x2="${x + cellW}" y2="${y + titleH}" stroke="#e2e8f0" stroke-width="0.2"/>`

    const frag = parseSvgFragment(p.svg)
    const innerW = cellW - pad * 2
    const innerH = cellH - titleH - pad * 2
    const [, , vbW, vbH] = frag.vb
    const scale = Math.min(innerW / vbW, innerH / vbH)
    const dw = vbW * scale
    const dh = vbH * scale
    const ox = x + pad + (innerW - dw) / 2
    const oy = y + titleH + pad + (innerH - dh) / 2
    // recolor dark chart bg to light for print
    let inner = frag.body
      .split('#0a1020').join('#ffffff')
      .split('#0b1018').join('#ffffff')
      .split('#0b1220').join('#ffffff')
    body += `<g transform="translate(${ox},${oy}) scale(${scale})">`
    body += `<g transform="translate(${-frag.vb[0]},${-frag.vb[1]})">${inner}</g>`
    body += `</g>`
  })

  // footer
  const note = opts.footerNote ?? '矢量拼版 · 数据与编辑器同源 · 比例示意非测绘出图'
  body += `<line x1="${margin}" y1="${H - margin - footerH + 2}" x2="${W - margin}" y2="${H - margin - footerH + 2}" stroke="#cbd5e1" stroke-width="0.3"/>`
  body += `<text x="${margin}" y="${H - margin - 2}" fill="#64748b" font-size="2.8" font-family="system-ui,sans-serif">${esc(note)}</text>`
  body += `<text x="${W - margin}" y="${H - margin - 2}" text-anchor="end" fill="#94a3b8" font-size="2.8" font-family="system-ui,sans-serif">${paper === A4L ? 'A4 横向' : 'A4 纵向'} · ${slots.length} 图</text>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" class="print-sheet">
${body}
</svg>`
}

/** Simple HTML wrapper for browser print */
export function printSheetHtml(svg: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; background: #e2e8f0; }
    .wrap { display: flex; justify-content: center; padding: 12px; }
    svg { background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.12); max-width: 100%; height: auto; }
    @media print {
      body { background: #fff; }
      .wrap { padding: 0; }
      svg { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="wrap">${svg.replace(/^<\?xml[^>]*>/, '')}</div>
</body>
</html>`
}
