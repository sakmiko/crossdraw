import { losLegendSvg as losLegendSvgImpl } from './losLegend'
import { niceCeil as niceCeilStd, fmtNum, vcHeatAccurate } from './chartStandards'
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
  phases: { name: string; greenSec: number; yellowSec: number; allRedSec: number; isOverlap?: boolean }[],
  cycleSec: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 360
  const height = opts.height ?? 88
  const C = Math.max(1, cycleSec)
  const padL = 4
  const padR = 4
  const usable = width - padL - padR
  const scale = usable / C
  // main phases only on ring (overlap drawn as hatch overlay at end)
  const main = phases.filter((p) => !p.isOverlap)
  const overlaps = phases.filter((p) => p.isOverlap)
  const sumMain = main.reduce((s, p) => s + p.greenSec + p.yellowSec + p.allRedSec, 0)
  let x = padL
  let body = ''
  // red remainder background
  body += `<rect x="${padL}" y="26" width="${usable}" height="28" fill="#7f1d1d" opacity="0.35"/>`
  main.forEach((p) => {
    const g = Math.max(0, p.greenSec) * scale
    const y = Math.max(0, p.yellowSec) * scale
    const r = Math.max(0, p.allRedSec) * scale
    body += `<rect x="${x}" y="26" width="${Math.max(0, g)}" height="28" fill="#16a34a"/>`
    body += `<rect x="${x + g}" y="26" width="${Math.max(0, y)}" height="28" fill="#ca8a04"/>`
    body += `<rect x="${x + g + y}" y="26" width="${Math.max(0, r)}" height="28" fill="#7f1d1d"/>`
    if (g > 28) {
      body += `<text x="${x + g / 2}" y="44" text-anchor="middle" fill="#052e16" font-size="9" font-weight="700">${escape(p.name)}</text>`
    }
    // second labels G/Y
    if (g > 16) body += `<text x="${x + g / 2}" y="58" text-anchor="middle" fill="#94a3b8" font-size="8">${Math.round(p.greenSec)}</text>`
    x += g + y + r
  })
  // time ticks 0 and C
  body += `<text x="${padL}" y="22" fill="#94a3b8" font-size="8">0</text>`
  body += `<text x="${padL + usable}" y="22" text-anchor="end" fill="#94a3b8" font-size="8">${Math.round(C)}</text>`
  const bal = Math.round((sumMain - C) * 10) / 10
  const balTxt = Math.abs(bal) < 0.15 ? 'Σ主相位=C 闭合' : `Σ主相位=${sumMain.toFixed(1)}s 差${bal > 0 ? '+' : ''}${bal}`
  const ov = overlaps.length ? ` · 搭接${overlaps.length}个不计入环` : ''
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    <text x="4" y="12" fill="#8494ab" font-size="9">Ring-Barrier 环栏条 · 轴=C=${cycleSec}s · 绿/黄/全红</text>
    ${body}
    <text x="4" y="${height - 6}" fill="#64748b" font-size="8">${balTxt}${ov} · 与配时图表字段同源</text>
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
  // Delegate to losLegendSvg so thresholds stay aligned with domain LOS.
  return losLegendSvgImpl(los, delaySec, opts)
}


export function crossSectionBarSvg(
  components: { label: string; widthM: number; color: string }[],
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 340
  const height = opts.height ?? 120
  const total = Math.max(0.1, components.reduce((s, c) => s + c.widthM, 0))
  const pad = { t: 18, r: 10, b: 36, l: 10 }
  const innerW = width - pad.l - pad.r
  const barH = 36
  const y = pad.t + 8
  let x = pad.l
  let body = ''
  components.forEach((c) => {
    const w = (c.widthM / total) * innerW
    body += `<rect x="${x}" y="${y}" width="${Math.max(1, w)}" height="${barH}" fill="${c.color}" stroke="#0f172a" stroke-width="0.5"/>`
    if (w > 28) {
      body += `<text x="${x + w / 2}" y="${y + barH / 2 + 3}" text-anchor="middle" fill="#0f172a" font-size="9" font-weight="700">${escape(c.label)}</text>`
      body += `<text x="${x + w / 2}" y="${y + barH + 12}" text-anchor="middle" fill="#94a3b8" font-size="9">${fmt(c.widthM)}m</text>`
    } else if (w > 14) {
      body += `<text x="${x + w / 2}" y="${y + barH + 12}" text-anchor="middle" fill="#94a3b8" font-size="8">${fmt(c.widthM)}</text>`
    }
    x += w
  })
  // dimension line
  body += `<line x1="${pad.l}" y1="${height - 14}" x2="${width - pad.r}" y2="${height - 14}" stroke="#64748b" stroke-width="1"/>`
  body += `<text x="${width / 2}" y="${height - 4}" text-anchor="middle" fill="#94a3b8" font-size="9">总宽 ${fmt(total)} m</text>`
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
    <rect width="100%" height="100%" fill="#0a1020"/>
    <text x="8" y="12" fill="#8494ab" font-size="9">横断面组成 · 与参数联动</text>
    ${body}
  </svg>`
}

export function compareSchemesBarSvg(
  rows: { label: string; avgVc: number; avgDelay: number; los: string }[],
  opts: { width?: number; height?: number; metric?: 'vc' | 'delay' } = {},
): string {
  const metric = opts.metric ?? 'delay'
  const data = rows.map((r) => ({
    label: r.label.length > 10 ? r.label.slice(0, 10) + '…' : r.label,
    value: metric === 'vc' ? r.avgVc : r.avgDelay,
    color:
      r.los === 'F' || r.los === 'E'
        ? '#e85d5d'
        : r.los === 'D'
          ? '#e5a54b'
          : '#3ecf8e',
  }))
  return barChartSvg(data, {
    width: opts.width,
    height: opts.height ?? 160,
    unit: metric === 'vc' ? 'v/c' : '延误 s',
  })
}

function niceCeil(max: number): number {
  return niceCeilStd(max)
}

function fmt(v: number): string {
  return fmtNum(v, Math.abs(v) >= 10 ? 'flow' : 'delay')
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Saturation (v/c) continuous heat color — textbook capacity diagram style */
export function vcHeatColor(vc: number): string {
  return vcHeatAccurate(vc)
}

export function timingCompareBarSvg(
  rows: { label: string; avgDelay: number; avgVc: number; los: string }[],
  opts: { width?: number; height?: number; metric?: 'delay' | 'vc' } = {},
): string {
  const metric = opts.metric ?? 'delay'
  const data = rows.map((r) => ({
    label: r.label.length > 8 ? r.label.slice(0, 8) : r.label,
    value: metric === 'delay' ? r.avgDelay : r.avgVc,
    color: metric === 'vc' ? vcHeatColor(r.avgVc) : r.avgDelay >= 80 ? '#ef4444' : r.avgDelay >= 55 ? '#eab308' : '#38bdf8',
  }))
  return barChartSvg(data, {
    width: opts.width ?? 360,
    height: opts.height ?? 160,
    unit: metric === 'delay' ? '车均延误 s' : '平均 v/c',
  })
}

export function saturationHeatLegendSvg(width = 320): string {
  const stops = [
    [0.25, '#22c55e', 'A'],
    [0.5, '#84cc16', 'B'],
    [0.7, '#eab308', 'C'],
    [0.85, '#f97316', 'D'],
    [0.95, '#ef4444', 'E'],
    [1.1, '#b91c1c', 'F'],
  ]
  const h = 36
  const pad = 12
  const bw = (width - pad * 2) / stops.length
  let body = `<text x="${pad}" y="12" fill="#94a3b8" font-size="9">饱和度 v/c 色阶</text>`
  stops.forEach((s, i) => {
    const x = pad + i * bw
    body += `<rect x="${x}" y="16" width="${bw - 2}" height="12" fill="${s[1]}" rx="2"/>`
    body += `<text x="${x + (bw - 2) / 2}" y="32" text-anchor="middle" fill="#94a3b8" font-size="8">${s[2]}</text>`
  })
  return `<svg viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg" class="chart-svg"><rect width="100%" height="100%" fill="#0a1020"/>${body}</svg>`
}
