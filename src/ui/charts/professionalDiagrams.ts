/** Professional traffic diagrams — vector SVG, textbook-style */

export function signalTimingDiagramSvg(
  phases: { name: string; greenSec: number; yellowSec: number; allRedSec: number; isOverlap?: boolean }[],
  cycleSec: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 520
  const rowH = 28
  const head = 36
  const left = 88
  const height = opts.height ?? head + phases.length * rowH + 28
  const total = Math.max(cycleSec, phases.reduce((s, p) => s + (p.isOverlap ? 0 : p.greenSec + p.yellowSec + p.allRedSec), 1), 1)
  const scale = (width - left - 16) / total
  let body = ''
  // time axis
  body += `<line x1="${left}" y1="${head - 8}" x2="${width - 12}" y2="${head - 8}" stroke="#64748b" stroke-width="1"/>`
  for (let t = 0; t <= total; t += Math.max(5, Math.round(total / 8))) {
    const x = left + t * scale
    body += `<line x1="${x}" y1="${head - 12}" x2="${x}" y2="${head - 6}" stroke="#64748b"/>`
    body += `<text x="${x}" y="${head - 14}" text-anchor="middle" fill="#94a3b8" font-size="9">${t}</text>`
  }
  let cursor = 0
  phases.forEach((p, i) => {
    const y = head + i * rowH
    body += `<text x="8" y="${y + 16}" fill="#e2e8f0" font-size="11">${escape(p.name)}${p.isOverlap ? '*' : ''}</text>`
    const g = p.greenSec * scale
    const yEl = p.yellowSec * scale
    const r = p.allRedSec * scale
    const x0 = p.isOverlap ? left : left + cursor * scale
    body += `<rect x="${x0}" y="${y + 4}" width="${Math.max(0, g)}" height="16" fill="#22c55e"/>`
    body += `<rect x="${x0 + g}" y="${y + 4}" width="${Math.max(0, yEl)}" height="16" fill="#eab308"/>`
    body += `<rect x="${x0 + g + yEl}" y="${y + 4}" width="${Math.max(0, r)}" height="16" fill="#ef4444"/>`
    if (!p.isOverlap) cursor += p.greenSec + p.yellowSec + p.allRedSec
  })
  body += `<text x="${left}" y="${height - 8}" fill="#94a3b8" font-size="9">配时图 · C=${cycleSec}s · 绿/黄/红 · *搭接（Webster 1958 / 教材制图）</text>`
  return svgShell(width, height, body)
}

export function controlMatrixSvg(
  approaches: string[],
  phases: { name: string; releases: Record<string, string[]> }[],
  approachIds: string[],
  opts: { width?: number; cell?: number } = {},
): string {
  const cellW = opts.cell ?? 36
  const cellH = 22
  const left = 72
  const top = 32
  const width = opts.width ?? left + phases.length * cellW + 16
  const height = top + approaches.length * cellH + 24
  let body = `<text x="8" y="16" fill="#94a3b8" font-size="9">相位放行管控图 · 进口×相位</text>`
  phases.forEach((ph, j) => {
    body += `<text x="${left + j * cellW + cellW / 2}" y="${top - 8}" text-anchor="middle" fill="#94a3b8" font-size="9">${escape(ph.name)}</text>`
  })
  approaches.forEach((name, i) => {
    const y = top + i * cellH
    body += `<text x="8" y="${y + 15}" fill="#e2e8f0" font-size="10">${escape(name)}</text>`
    phases.forEach((ph, j) => {
      const id = approachIds[i]
      const movs = ph.releases[id] ?? []
      const x = left + j * cellW
      const label = movs.join('') || '—'
      const on = movs.length > 0
      body += `<rect x="${x + 1}" y="${y + 2}" width="${cellW - 2}" height="${cellH - 4}" rx="3" fill="${on ? '#14532d' : '#1e293b'}" stroke="#334155"/>`
      body += `<text x="${x + cellW / 2}" y="${y + 15}" text-anchor="middle" fill="${on ? '#86efac' : '#64748b'}" font-size="10" font-weight="600">${escape(label)}</text>`
    })
  })
  return svgShell(width, height, body)
}

export function flowMovementDiagramSvg(
  approaches: { name: string; bearingDeg: number; L: number; T: number; R: number }[],
  opts: { size?: number } = {},
): string {
  const size = opts.size ?? 360
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.30
  const maxV = Math.max(1, ...approaches.flatMap((a) => [a.L, a.T, a.R]))
  const total = approaches.reduce((s, a) => s + a.L + a.T + a.R, 0)
  let body = ''
  body += `<text x="8" y="16" fill="#94a3b8" font-size="9">流量流向图 · 线宽∝流量 · 总量 ${Math.round(total)} pcu/h</text>`
  // intersection disc
  body += `<circle cx="${cx}" cy="${cy}" r="${R * 0.42}" fill="#111827" stroke="#475569" stroke-width="2"/>`
  body += `<circle cx="${cx}" cy="${cy}" r="${R * 0.12}" fill="#1e293b" stroke="#64748b" stroke-width="1"/>`
  for (const ap of approaches) {
    const rad = ((ap.bearingDeg - 90) * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    // road stub
    const xOut = cx + cos * R * 1.42
    const yOut = cy + sin * R * 1.42
    const xIn = cx + cos * R * 0.55
    const yIn = cy + sin * R * 0.55
    body += `<line x1="${xOut}" y1="${yOut}" x2="${xIn}" y2="${yIn}" stroke="#334155" stroke-width="16" stroke-linecap="round" opacity="0.85"/>`
    body += `<line x1="${xOut}" y1="${yOut}" x2="${xIn}" y2="${yIn}" stroke="#1e293b" stroke-width="1.5"/>`
    // approach from outside toward center
    const x1 = cx + cos * R * 1.28
    const y1 = cy + sin * R * 1.28
    const x0 = cx + cos * R * 0.62
    const y0 = cy + sin * R * 0.62
    const tw = 1.5 + (ap.T / maxV) * 11
    body += arrow(x1, y1, x0, y0, '#3b82f6', tw, `${Math.round(ap.T)}`)
    const lx = Math.cos(rad + Math.PI / 2)
    const ly = Math.sin(rad + Math.PI / 2)
    const lw = 1.2 + (ap.L / maxV) * 9
    body += arrow(x1 + lx * 12, y1 + ly * 12, x0 + lx * 26, y0 + ly * 26, '#06b6d4', lw, `${Math.round(ap.L)}`)
    const rx = Math.cos(rad - Math.PI / 2)
    const ry = Math.sin(rad - Math.PI / 2)
    const rw = 1.2 + (ap.R / maxV) * 9
    body += arrow(x1 + rx * 12, y1 + ry * 12, x0 + rx * 26, y0 + ry * 26, '#a855f7', rw, `${Math.round(ap.R)}`)
    const sum = ap.L + ap.T + ap.R
    body += `<text x="${cx + cos * R * 1.58}" y="${cy + sin * R * 1.58}" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700">${escape(ap.name)}</text>`
    body += `<text x="${cx + cos * R * 1.58}" y="${cy + sin * R * 1.58 + 12}" text-anchor="middle" fill="#94a3b8" font-size="9">Σ${Math.round(sum)}</text>`
  }
  // legend chips
  const chips = [
    ['#3b82f6', '直行 T'],
    ['#06b6d4', '左转 L'],
    ['#a855f7', '右转 R'],
  ]
  chips.forEach((c, i) => {
    const x = 10 + i * 72
    body += `<rect x="${x}" y="${size - 22}" width="10" height="10" rx="2" fill="${c[0]}"/>`
    body += `<text x="${x + 14}" y="${size - 13}" fill="#94a3b8" font-size="9">${c[1]}</text>`
  })
  return svgShell(size, size, body)
}

export function timeSpaceDiagramSvg(
  nodes: { name: string; distanceM: number; greenRatio: number; offsetSec: number; cycleSec: number }[],
  speedKmh: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 520
  const height = opts.height ?? 280
  const pad = { t: 28, r: 16, b: 36, l: 48 }
  if (nodes.length < 2) {
    return svgShell(width, height, `<text x="50%" y="50%" text-anchor="middle" fill="#8494ab">至少 2 个路口</text>`)
  }
  const maxD = Math.max(...nodes.map((n) => n.distanceM), 1)
  const C = nodes[0].cycleSec || 90
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  let body = `<text x="8" y="16" fill="#94a3b8" font-size="9">干道协调时距图 · v=${speedKmh}km/h · C=${C}s（教材图解风格）</text>`
  // grid time
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (innerH * i) / 4
    body += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="#1e293b"/>`
    body += `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="9">${Math.round(C * (1 - i / 4))}s</text>`
  }
  const v = (speedKmh * 1000) / 3600
  nodes.forEach((n) => {
    const x = pad.l + (n.distanceM / maxD) * innerW
    body += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + innerH}" stroke="#334155"/>`
    const g0 = ((n.offsetSec % C) + C) % C
    const g1 = g0 + n.greenRatio * C
    const y0 = pad.t + (1 - g0 / C) * innerH
    const y1 = pad.t + (1 - Math.min(C, g1) / C) * innerH
    body += `<rect x="${x - 8}" y="${Math.min(y0, y1)}" width="16" height="${Math.max(3, Math.abs(y0 - y1))}" fill="#22c55e" opacity="0.85"/>`
    body += `<text x="${x}" y="${height - 12}" text-anchor="middle" fill="#94a3b8" font-size="9">${escape(n.name)}</text>`
  })
  // forward / backward trajectories (two-way band sketch)
  if (nodes.length >= 2) {
    const a = nodes[0]
    const b = nodes[nodes.length - 1]
    const x0 = pad.l + (a.distanceM / maxD) * innerW
    const x1 = pad.l + (b.distanceM / maxD) * innerW
    const travel = (b.distanceM - a.distanceM) / Math.max(0.1, v)
    const t0 = ((a.offsetSec % C) + C) % C
    const t1 = (t0 + travel) % C
    const yA = pad.t + (1 - t0 / C) * innerH
    const yB = pad.t + (1 - t1 / C) * innerH
    body += `<path d="M${x0},${yA} L${x1},${yB}" stroke="#38bdf8" stroke-width="2.5" fill="none"/>`
    // backward: from B green start reverse
    const tB = ((b.offsetSec % C) + C) % C
    const tA2 = (tB + travel) % C
    const yB0 = pad.t + (1 - tB / C) * innerH
    const yA2 = pad.t + (1 - tA2 / C) * innerH
    body += `<path d="M${x1},${yB0} L${x0},${yA2}" stroke="#f472b6" stroke-width="2.2" stroke-dasharray="5 3" fill="none"/>`
    body += `<text x="${width - pad.r}" y="${pad.t + 12}" text-anchor="end" fill="#38bdf8" font-size="8">→上行</text>`
    body += `<text x="${width - pad.r}" y="${pad.t + 24}" text-anchor="end" fill="#f472b6" font-size="8">←下行</text>`
  }
  body += `<text x="${pad.l}" y="${height - 4}" fill="#64748b" font-size="8">横轴距离 · 纵轴周期内时间 · 绿条=有效绿窗 · 双向轨迹</text>`
  return svgShell(width, height, body)
}

/** Approach lamp face by phase — textbook "灯态/放行示意" */
export function phaseFaceDiagramSvg(
  approaches: { name: string; bearingDeg: number; id: string }[],
  phase: { name: string; releases: Record<string, string[]> },
  opts: { size?: number } = {},
): string {
  const size = opts.size ?? 320
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.34
  let body = `<text x="8" y="16" fill="#94a3b8" font-size="9">相位灯态图 · ${escape(phase.name)} · 绿=放行</text>`
  body += `<circle cx="${cx}" cy="${cy}" r="${R * 0.22}" fill="#111827" stroke="#334155"/>`
  for (const ap of approaches) {
    const rad = ((ap.bearingDeg - 90) * Math.PI) / 180
    const x = cx + Math.cos(rad) * R
    const y = cy + Math.sin(rad) * R
    const movs = phase.releases[ap.id] ?? []
    const on = movs.length > 0
    body += `<circle cx="${x}" cy="${y}" r="18" fill="${on ? '#14532d' : '#1f2937'}" stroke="${on ? '#22c55e' : '#475569'}" stroke-width="2"/>`
    body += `<text x="${x}" y="${y - 2}" text-anchor="middle" fill="${on ? '#86efac' : '#94a3b8'}" font-size="10" font-weight="700">${escape(ap.name.replace('进口', ''))}</text>`
    body += `<text x="${x}" y="${y + 12}" text-anchor="middle" fill="${on ? '#bbf7d0' : '#64748b'}" font-size="9">${escape(movs.join('') || '红')}</text>`
    // road stub
    const x0 = cx + Math.cos(rad) * R * 0.35
    const y0 = cy + Math.sin(rad) * R * 0.35
    body += `<line x1="${x0}" y1="${y0}" x2="${x}" y2="${y}" stroke="#374151" stroke-width="10" stroke-linecap="round"/>`
  }
  body += `<text x="8" y="${size - 10}" fill="#64748b" font-size="8">与相位放行矩阵同源 · 方案说明书常用图</text>`
  return svgShell(size, size, body)
}

function arrow(x1: number, y1: number, x2: number, y2: number, color: string, w: number, label: string): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const ah = 6
  const tipx = x2
  const tipy = y2
  const bx = tipx - ux * ah
  const by = tipy - uy * ah
  return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
  <polygon points="${tipx},${tipy} ${bx + px * 3},${by + py * 3} ${bx - px * 3},${by - py * 3}" fill="${color}"/>
  <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 4}" text-anchor="middle" fill="${color}" font-size="9" font-weight="600">${escape(label)}</text>`
}

function svgShell(width: number, height: number, body: string): string {
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
  <rect width="100%" height="100%" fill="#0a1020"/>${body}</svg>`
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
