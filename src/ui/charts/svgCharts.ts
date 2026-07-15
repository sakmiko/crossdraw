/** Lightweight SVG charts — data-linked, no external chart lib */

export type BarDatum = { label: string; value: number; color?: string }

export function barChartSvg(
  data: BarDatum[],
  opts: { width?: number; height?: number; title?: string; unit?: string } = {},
): string {
  const width = opts.width ?? 340
  const height = opts.height ?? 168
  const pad = { t: 22, r: 12, b: 40, l: 40 }
  const max = Math.max(1, ...data.map((d) => d.value))
  const niceMax = niceCeil(max)
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const gap = 8
  const bw = data.length ? (innerW - gap * (data.length - 1)) / data.length : 0

  let grid = ''
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (innerH * i) / 4
    const val = niceMax * (1 - i / 4)
    grid += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="#1e293b" stroke-width="1"/>`
    grid += `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="9">${fmt(val)}</text>`
  }

  const bars = data
    .map((d, i) => {
      const h = (d.value / niceMax) * innerH
      const x = pad.l + i * (bw + gap)
      const y = pad.t + innerH - h
      const color = d.color ?? '#38bdf8'
      return `<g>
        <rect x="${x}" y="${y}" width="${bw}" height="${Math.max(1, h)}" rx="4" fill="${color}" opacity="0.92"/>
        <text x="${x + bw / 2}" y="${height - 14}" text-anchor="middle" fill="#94a3b8" font-size="10">${escape(d.label)}</text>
        <text x="${x + bw / 2}" y="${y - 5}" text-anchor="middle" fill="#f1f5f9" font-size="10" font-weight="600">${fmt(d.value)}</text>
      </g>`
    })
    .join('')

  const unit = opts.unit ? `<text x="${pad.l}" y="12" fill="#64748b" font-size="9">${escape(opts.unit)}</text>` : ''
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>${unit}${grid}${bars}
  </svg>`
}

export function groupedBarSvg(
  groups: { group: string; items: { key: string; value: number; color: string }[] }[],
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 340
  const height = opts.height ?? 180
  const pad = { t: 22, r: 10, b: 36, l: 40 }
  const max = Math.max(1, ...groups.flatMap((g) => g.items.map((i) => i.value)))
  const niceMax = niceCeil(max)
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const gw = groups.length ? innerW / groups.length : 0
  const nKeys = groups[0]?.items.length || 1
  const bw = Math.max(5, (gw - 14) / nKeys)

  let grid = ''
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (innerH * i) / 4
    const val = niceMax * (1 - i / 4)
    grid += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="#1e293b" stroke-width="1"/>`
    grid += `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="9">${fmt(val)}</text>`
  }

  let body = ''
  groups.forEach((g, gi) => {
    g.items.forEach((it, ki) => {
      const h = (it.value / niceMax) * innerH
      const x = pad.l + gi * gw + 7 + ki * bw
      const y = pad.t + innerH - h
      body += `<rect x="${x}" y="${y}" width="${bw - 1.5}" height="${Math.max(1, h)}" rx="2.5" fill="${it.color}" opacity="0.95"/>`
      if (bw > 12) {
        body += `<text x="${x + (bw - 1.5) / 2}" y="${y - 3}" text-anchor="middle" fill="#e2e8f0" font-size="8">${fmt(it.value)}</text>`
      }
    })
    body += `<text x="${pad.l + gi * gw + gw / 2}" y="${height - 12}" text-anchor="middle" fill="#94a3b8" font-size="10">${escape(g.group)}</text>`
  })

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    <text x="${pad.l}" y="12" fill="#64748b" font-size="9">veh/h</text>
    ${grid}${body}</svg>`
}

export function lineChartSvg(
  series: { name: string; color: string; points: { x: number; y: number }[] }[],
  opts: { width?: number; height?: number; xLabel?: string; yLabel?: string } = {},
): string {
  const width = opts.width ?? 340
  const height = opts.height ?? 160
  const pad = { t: 16, r: 12, b: 30, l: 40 }
  const all = series.flatMap((s) => s.points)
  if (!all.length) {
    return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg"><rect width="100%" height="100%" fill="#0a1020"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#8494ab" font-size="11">暂无数据</text></svg>`
  }
  const minX = Math.min(...all.map((p) => p.x))
  const maxX = Math.max(...all.map((p) => p.x))
  const minY = Math.min(0, ...all.map((p) => p.y))
  const maxY = Math.max(1, ...all.map((p) => p.y))
  const niceMaxY = niceCeil(maxY)
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const sx = (x: number) => pad.l + ((x - minX) / Math.max(1e-6, maxX - minX)) * innerW
  const sy = (y: number) => pad.t + innerH - ((y - minY) / Math.max(1e-6, niceMaxY - minY)) * innerH
  let grid = ''
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (innerH * i) / 4
    grid += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="#1e293b" stroke-width="1"/>`
  }
  const paths = series
    .map((s) => {
      if (!s.points.length) return ''
      const d = s.points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
        .join(' ')
      const dots = s.points
        .map((p) => `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="3" fill="${s.color}" stroke="#0a1020" stroke-width="1"/>`)
        .join('')
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.2"/>${dots}`
    })
    .join('')
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>${grid}${paths}
    <text x="${pad.l}" y="${height - 8}" fill="#8494ab" font-size="9">${escape(opts.xLabel ?? '')}</text>
  </svg>`
}

export function stackedBandSvg(
  nodes: { name: string; distanceM: number; greenRatio: number; offsetSec: number }[],
  cycleSec: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 340
  const height = opts.height ?? 160
  const pad = { t: 18, r: 12, b: 30, l: 42 }
  if (nodes.length < 2) {
    return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg"><rect width="100%" height="100%" fill="#0a1020"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#8494ab" font-size="11">至少 2 个路口</text></svg>`
  }
  const maxD = Math.max(...nodes.map((n) => n.distanceM), 1)
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  let body = ''
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (innerH * i) / 4
    body += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="#1e293b" stroke-width="1"/>`
    body += `<text x="${pad.l - 4}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="8">${Math.round(cycleSec * (1 - i / 4))}s</text>`
  }
  nodes.forEach((n) => {
    const x = pad.l + (n.distanceM / maxD) * innerW
    const g0 = ((n.offsetSec % cycleSec) + cycleSec) % cycleSec
    const g1 = g0 + n.greenRatio * cycleSec
    const y0 = pad.t + (1 - g0 / cycleSec) * innerH
    const y1 = pad.t + (1 - Math.min(cycleSec, g1) / cycleSec) * innerH
    body += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + innerH}" stroke="#334155" stroke-width="1"/>`
    body += `<rect x="${x - 7}" y="${Math.min(y0, y1)}" width="14" height="${Math.max(4, Math.abs(y0 - y1))}" rx="3" fill="#34d399" opacity="0.88"/>`
    body += `<text x="${x}" y="${height - 10}" text-anchor="middle" fill="#94a3b8" font-size="9">${escape(n.name)}</text>`
  })
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const x0 = pad.l + (first.distanceM / maxD) * innerW
  const x1 = pad.l + (last.distanceM / maxD) * innerW
  const o0 = ((first.offsetSec % cycleSec) + cycleSec) % cycleSec
  const o1 = ((last.offsetSec % cycleSec) + cycleSec) % cycleSec
  const yA = pad.t + (1 - o0 / cycleSec) * innerH
  const yB = pad.t + (1 - o1 / cycleSec) * innerH
  body += `<path d="M${x0},${yA} L${x1},${yB}" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="5 3" fill="none" opacity="0.9"/>`
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    <text x="4" y="12" fill="#8494ab" font-size="9">时空图 · C=${cycleSec}s · 横轴距离</text>
    ${body}</svg>`
}

export function ringBarrierSvg(
  phases: { name: string; greenSec: number; yellowSec: number; allRedSec: number }[],
  cycleSec: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 340
  const height = opts.height ?? 78
  const total = Math.max(cycleSec, phases.reduce((s, p) => s + p.greenSec + p.yellowSec + p.allRedSec, 0), 1)
  let x = 0
  const colors = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#22d3ee']
  let body = ''
  phases.forEach((p, i) => {
    const wG = (p.greenSec / total) * width
    const wY = (p.yellowSec / total) * width
    const wR = (p.allRedSec / total) * width
    body += `<rect x="${x}" y="22" width="${Math.max(0, wG)}" height="30" fill="${colors[i % colors.length]}"/>`
    body += `<rect x="${x + wG}" y="22" width="${Math.max(0, wY)}" height="30" fill="#fbbf24"/>`
    body += `<rect x="${x + wG + wY}" y="22" width="${Math.max(0, wR)}" height="30" fill="#64748b"/>`
    if (wG > 36) {
      body += `<text x="${x + wG / 2}" y="41" text-anchor="middle" fill="#0f172a" font-size="9" font-weight="700">${escape(p.name)}</text>`
    }
    x += wG + wY + wR
  })
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    ${body}
    <text x="4" y="14" fill="#8494ab" font-size="9">Ring-Barrier · C=${cycleSec}s · 绿/黄/全红</text>
    <text x="4" y="${height - 6}" fill="#64748b" font-size="8">黄=黄灯 · 灰=全红</text>
  </svg>`
}

export function radarChartSvg(
  axes: { label: string; value: number; max?: number }[],
  opts: { width?: number; height?: number; title?: string } = {},
): string {
  const width = opts.width ?? 340
  const height = opts.height ?? 200
  const cx = width / 2
  const cy = height / 2 + 4
  const R = Math.min(width, height) * 0.34
  const n = Math.max(3, axes.length)
  if (!axes.length) {
    return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg"><rect width="100%" height="100%" fill="#0a1020"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#8494ab" font-size="11">暂无数据</text></svg>`
  }
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const pt = (i: number, r: number) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r]

  let grid = ''
  for (const ring of [0.25, 0.5, 0.75, 1]) {
    const pts = Array.from({ length: n }, (_, i) => pt(i, R * ring))
    grid += `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#1e293b" stroke-width="1"/>`
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, R)
    grid += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#1e293b" stroke-width="1"/>`
    const [lx, ly] = pt(i, R + 16)
    grid += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="9">${escape(axes[i].label)}</text>`
  }
  const dataPts = axes.map((a, i) => {
    const max = a.max && a.max > 0 ? a.max : 1
    const t = Math.max(0, Math.min(1, a.value / max))
    return pt(i, R * t)
  })
  const poly = dataPts.map((p) => p.join(',')).join(' ')
  const dots = dataPts
    .map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#38bdf8"/><title>${escape(axes[i].label)}=${fmt(axes[i].value)}</title>`)
    .join('')
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    <text x="8" y="14" fill="#8494ab" font-size="9">${escape(opts.title ?? '雷达图')}</text>
    ${grid}
    <polygon points="${poly}" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" stroke-width="2"/>
    ${dots}
  </svg>`
}

export function conflictMatrixSvg(
  labels: string[],
  levels: ('ok' | 'warn' | 'block' | 'same')[][],
  opts: { width?: number; cell?: number; active?: Set<string>; keys?: string[] } = {},
): string {
  const n = labels.length
  const cell = opts.cell ?? Math.max(14, Math.min(22, Math.floor(280 / Math.max(1, n))))
  const left = 42
  const top = 28
  const width = opts.width ?? left + n * cell + 12
  const height = top + n * cell + 12
  const color = (lv: string) =>
    lv === 'block' ? '#e85d5d' : lv === 'warn' ? '#e5a54b' : lv === 'same' ? '#334155' : '#1e3a2f'
  let body = ''
  for (let i = 0; i < n; i++) {
    body += `<text x="${left - 4}" y="${top + i * cell + cell * 0.7}" text-anchor="end" fill="#94a3b8" font-size="8">${escape(labels[i])}</text>`
    body += `<text x="${left + i * cell + cell / 2}" y="${top - 6}" text-anchor="middle" fill="#94a3b8" font-size="8">${escape(labels[i])}</text>`
    for (let j = 0; j < n; j++) {
      const lv = levels[i]?.[j] ?? 'ok'
      const x = left + j * cell
      const y = top + i * cell
      body += `<rect x="${x}" y="${y}" width="${cell - 1}" height="${cell - 1}" rx="2" fill="${color(lv)}" opacity="0.9"/>`
    }
  }
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    <text x="8" y="14" fill="#8494ab" font-size="9">冲突矩阵 · 红=禁止 黄=警告 绿=兼容</text>
    ${body}
  </svg>`
}

export function losGaugeSvg(
  los: string,
  delaySec: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 340
  const height = opts.height ?? 72
  const order = ['A', 'B', 'C', 'D', 'E', 'F']
  const colors = ['#22c55e', '#4ade80', '#a3e635', '#fbbf24', '#f97316', '#ef4444']
  const idx = Math.max(0, order.indexOf(los.toUpperCase()))
  const bw = (width - 24) / 6
  let body = ''
  order.forEach((L, i) => {
    const x = 12 + i * bw
    body += `<rect x="${x}" y="28" width="${bw - 4}" height="18" rx="3" fill="${colors[i]}" opacity="${i === idx ? 1 : 0.35}"/>`
    body += `<text x="${x + (bw - 4) / 2}" y="41" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="700">${L}</text>`
  })
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    <text x="12" y="16" fill="#8494ab" font-size="9">服务水平色带 · 当前 ${escape(los)} · 延误 ${fmt(delaySec)}s</text>
    ${body}
  </svg>`
}

function niceCeil(n: number): number {
  if (n <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(n)))
  const f = n / exp
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return nf * exp
}

function fmt(n: number): string {
  if (Math.abs(n) >= 100) return n.toFixed(0)
  if (Math.abs(n) >= 10) return n.toFixed(1)
  return n.toFixed(2)
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
