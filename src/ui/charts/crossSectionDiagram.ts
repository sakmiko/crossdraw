/**
 * Professional road cross-section diagram (标准横断面图).
 * Textbook style: elevation band, component fills, width dims, lane arrows, crown hint.
 * Data-linked from Approach via buildCrossSection components.
 */
import type { Approach, CrossSection } from '@/domain/types'

export function professionalCrossSectionSvg(
  section: CrossSection,
  approach: Approach,
  opts: { width?: number; height?: number; theme?: 'dark' | 'light'; componentsOverride?: CrossSection['components'] } = {},
): string {
  const W = opts.width ?? 720
  const H = opts.height ?? 280
  const dark = opts.theme !== 'light'
  const bg = dark ? '#0b1018' : '#f8fafc'
  const panel = dark ? '#111827' : '#ffffff'
  const text = dark ? '#e6edf5' : '#0f172a'
  const muted = dark ? '#94a3b8' : '#64748b'
  const grid = dark ? '#1e293b' : '#e2e8f0'
  const dim = dark ? '#38bdf8' : '#0284c7'

  const comps = opts.componentsOverride ?? section.components
  const total = comps.reduce((s, c) => s + c.widthM, 0) || 1
  const padL = 48
  const padR = 24
  const padT = 40
  const groundY = 150
  const bandH = 52
  const usable = W - padL - padR
  const scale = usable / total

  let x = padL
  let body = `<rect width="${W}" height="${H}" fill="${bg}"/>`
  body += `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="10" fill="${panel}" stroke="${grid}"/>`
  body += `<text x="28" y="34" fill="${text}" font-size="14" font-weight="700">标准横断面 · ${escape(approach.name)}</text>`
  body += `<text x="${W - 28}" y="34" text-anchor="end" fill="${muted}" font-size="11">总宽 ${total.toFixed(2)} m · 方位 ${approach.bearingDeg.toFixed(0)}°</text>`

  // ground line + crown slight camber polyline
  const camberPts: string[] = []
  let cx = padL
  comps.forEach((c, i) => {
    const mid = cx + (c.widthM * scale) / 2
    const rise = c.type === 'median' ? 4 : c.type === 'sidewalk' ? 6 : c.type === 'bike' ? 2 : 0
    // vehicle lanes slight crown toward median
    const vehicleCamber =
      c.type === 'vehicle' ? (i < comps.length / 2 ? 1.2 : 1.2) : rise
    camberPts.push(`${mid},${groundY - vehicleCamber}`)
    cx += c.widthM * scale
  })
  body += `<line x1="${padL}" y1="${groundY + bandH / 2 + 8}" x2="${padL + usable}" y2="${groundY + bandH / 2 + 8}" stroke="${grid}" stroke-width="1"/>`

  // components as blocks
  x = padL
  comps.forEach((c) => {
    const w = c.widthM * scale
    const y = groundY - bandH / 2
    const hatch = c.type === 'median' && approach.median.style === 'yellowHatch'
    body += `<rect x="${x}" y="${y}" width="${Math.max(1, w - 1)}" height="${bandH}" fill="${c.color}" stroke="${dark ? '#0f172a' : '#334155'}" stroke-width="0.8" opacity="0.95"/>`
    if (hatch) {
      for (let hx = x + 4; hx < x + w - 2; hx += 6) {
        body += `<line x1="${hx}" y1="${y}" x2="${hx - 8}" y2="${y + bandH}" stroke="#92400e" stroke-width="0.6" opacity="0.5"/>`
      }
    }
    // curb tick for sidewalk edge
    if (c.type === 'sidewalk') {
      body += `<rect x="${x}" y="${y - 4}" width="${Math.max(1, w - 1)}" height="4" fill="${dark ? '#a8a29e' : '#78716c'}"/>`
    }
    // center label if wide enough
    if (w > 36) {
      body += `<text x="${x + w / 2}" y="${groundY + 4}" text-anchor="middle" fill="${text}" font-size="10" font-weight="600">${escape(shortLabel(c.label))}</text>`
      body += `<text x="${x + w / 2}" y="${groundY + 16}" text-anchor="middle" fill="${muted}" font-size="9">${c.widthM.toFixed(2)}m</text>`
    } else if (w > 18) {
      body += `<text x="${x + w / 2}" y="${groundY + 6}" text-anchor="middle" fill="${text}" font-size="8">${c.widthM.toFixed(1)}</text>`
    }
    // entry direction arrows on vehicle entry half (labels containing 进口)
    if (c.type === 'vehicle' && c.label.includes('进口')) {
      const ax = x + w / 2
      const ay = groundY - 10
      body += arrowDown(ax, ay, dark ? '#e2e8f0' : '#1e293b')
    }
    if (c.type === 'vehicle' && c.label.includes('出口')) {
      const ax = x + w / 2
      const ay = groundY + 18
      body += arrowUp(ax, ay, dark ? '#e2e8f0' : '#1e293b')
    }
    x += w
  })

  // overall dimension
  const dimY = groundY + bandH / 2 + 36
  body += `<line x1="${padL}" y1="${dimY}" x2="${padL + usable}" y2="${dimY}" stroke="${dim}" stroke-width="1.2"/>`
  body += `<line x1="${padL}" y1="${dimY - 6}" x2="${padL}" y2="${dimY + 6}" stroke="${dim}"/>`
  body += `<line x1="${padL + usable}" y1="${dimY - 6}" x2="${padL + usable}" y2="${dimY + 6}" stroke="${dim}"/>`
  body += `<text x="${padL + usable / 2}" y="${dimY - 8}" text-anchor="middle" fill="${dim}" font-size="12" font-weight="700">B = ${total.toFixed(2)} m</text>`

  // component tick dimensions below
  x = padL
  comps.forEach((c) => {
    const w = c.widthM * scale
    const y = dimY + 18
    if (w > 22) {
      body += `<line x1="${x + 2}" y1="${y}" x2="${x + w - 2}" y2="${y}" stroke="${muted}" stroke-width="0.8"/>`
      body += `<text x="${x + w / 2}" y="${y + 12}" text-anchor="middle" fill="${muted}" font-size="9">${c.widthM.toFixed(2)}</text>`
    }
    x += w
  })

  // legend
  const legendY = H - 36
  const legend = [
    { c: '#6b7280', t: '机动车' },
    { c: '#86efac', t: '中分/绿化' },
    { c: '#6ee7b7', t: '非机动车' },
    { c: '#d6d3d1', t: '人行道' },
    { c: '#57534e', t: '辅路' },
  ]
  legend.forEach((L, i) => {
    const lx = 28 + i * 100
    body += `<rect x="${lx}" y="${legendY}" width="12" height="12" rx="2" fill="${L.c}" stroke="${grid}"/>`
    body += `<text x="${lx + 18}" y="${legendY + 10}" fill="${muted}" font-size="10">${L.t}</text>`
  })

  // side note
  const auxNote = approach.auxRoad?.enabled ? ` · 辅路 ${approach.auxRoad.widthM.toFixed(1)}m` : ''
  const waitNote = [
    approach.leftWait ? '左转待转' : '',
    approach.throughWait ? '直行待行' : '',
    approach.borrowLeft ? '借道左转' : '',
  ].filter(Boolean).join(' · ')
  body += `<text x="${W - 28}" y="${H - 28}" text-anchor="end" fill="${muted}" font-size="9">与渠化进口参数热同步 · 示意断面${auxNote}${waitNote ? ' · ' + waitNote : ''}</text>`
  if (approach.leftWait || approach.throughWait || approach.borrowLeft) {
    body += `<text x="28" y="${H - 28}" fill="${muted}" font-size="9">${escape(waitNote || '')}</text>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`
}

function shortLabel(s: string): string {
  return s.replace('进口车道', '进').replace('出口车道', '出').replace('非机动车道', '非机').replace('人行道', '人行').replace('中分带', '中分')
}

function arrowDown(x: number, y: number, color: string): string {
  return `<path d="M${x} ${y - 8} L${x} ${y + 6} M${x - 3} ${y + 2} L${x} ${y + 6} L${x + 3} ${y + 2}" stroke="${color}" fill="none" stroke-width="1.2"/>`
}

function arrowUp(x: number, y: number, color: string): string {
  return `<path d="M${x} ${y + 8} L${x} ${y - 6} M${x - 3} ${y - 2} L${x} ${y - 6} L${x + 3} ${y - 2}" stroke="${color}" fill="none" stroke-width="1.2"/>`
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Stacked composition pie-like bar for type share */
export function crossSectionShareSvg(
  section: CrossSection,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 360
  const height = opts.height ?? 72
  const total = section.components.reduce((s, c) => s + c.widthM, 0) || 1
  const byType = new Map<string, { w: number; color: string }>()
  for (const c of section.components) {
    const key = c.type
    const cur = byType.get(key) ?? { w: 0, color: c.color }
    cur.w += c.widthM
    cur.color = c.color
    byType.set(key, cur)
  }
  let x = 12
  let body = `<rect width="${width}" height="${height}" fill="#0a1020"/>`
  body += `<text x="12" y="14" fill="#8494ab" font-size="9">断面类型占比</text>`
  for (const [type, v] of Array.from(byType.entries())) {
    const w = ((width - 24) * v.w) / total
    body += `<rect x="${x}" y="24" width="${Math.max(1, w - 1)}" height="22" fill="${v.color}" rx="3"/>`
    if (w > 40) {
      body += `<text x="${x + w / 2}" y="39" text-anchor="middle" fill="#0f172a" font-size="9" font-weight="700">${typeLabel(type)} ${((v.w / total) * 100).toFixed(0)}%</text>`
    }
    x += w
  }
  body += `<text x="12" y="${height - 8}" fill="#64748b" font-size="9">总宽 ${total.toFixed(2)} m</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="chart-svg">${body}</svg>`
}

function typeLabel(t: string): string {
  return ({ vehicle: '机动车', median: '中分', sidewalk: '人行', bike: '非机' } as Record<string, string>)[t] ?? t
}
