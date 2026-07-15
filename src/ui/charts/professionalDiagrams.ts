/**
 * Professional traffic diagrams — textbook timing / control / flow / time-space.
 * Numeric values are taken from scheme data without decorative rounding.
 * Timing diagram uses programmed cycle C as the sole time axis (s).
 */
import {
  CHART_COLORS,
  chartFooter,
  escapeXml,
  fmtNum,
  timeTicks,
} from './chartStandards'

function svgShell(width: number, height: number, body: string, bg = CHART_COLORS.bg): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="chart-svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  ${body}
</svg>`
}

/**
 * Signal timing bar chart (配时图).
 * - Time axis = cycleSec (s), not phase-sum (avoids scale drift)
 * - Each main phase row: green / yellow / all-red at programmed start
 * - Remainder of cycle shown as red (rest red)
 * - Labels: G/Y/AR seconds; footer checks Σ(G+Y+AR) vs C
 */
export function signalTimingDiagramSvg(
  phases: { name: string; greenSec: number; yellowSec: number; allRedSec: number; isOverlap?: boolean }[],
  cycleSec: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 560
  const rowH = 32
  const head = 44
  const left = 96
  const right = 16
  const foot = 36
  const main = phases.filter((p) => !p.isOverlap)
  const overlaps = phases.filter((p) => p.isOverlap)
  const rows = [...main, ...overlaps]
  const height = opts.height ?? head + rows.length * rowH + foot
  const C = Math.max(1, cycleSec)
  const scale = (width - left - right) / C

  // programmed sum of main phases
  const sumMain = main.reduce((s, p) => s + p.greenSec + p.yellowSec + p.allRedSec, 0)
  const balance = Math.round((sumMain - C) * 10) / 10

  let body = ''
  // title
  body += `<text x="12" y="16" fill="${CHART_COLORS.axis}" font-size="11" font-weight="700">信号配时图</text>`
  body += `<text x="${width - right}" y="16" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="10">C = ${fmtNum(C, 'int')} s</text>`

  // axis
  const axisY = head - 10
  body += `<line x1="${left}" y1="${axisY}" x2="${width - right}" y2="${axisY}" stroke="${CHART_COLORS.grid}" stroke-width="1.2"/>`
  for (const t of timeTicks(C)) {
    const x = left + t * scale
    body += `<line x1="${x}" y1="${axisY - 4}" x2="${x}" y2="${axisY + 4}" stroke="${CHART_COLORS.axis}"/>`
    body += `<text x="${x}" y="${axisY - 8}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="9">${fmtNum(t, 'int')}</text>`
  }
  body += `<text x="${left}" y="28" fill="${CHART_COLORS.muted}" font-size="9">t (s)</text>`

  let cursor = 0
  rows.forEach((p, i) => {
    const y = head + i * rowH
    const isOv = !!p.isOverlap
    body += `<text x="10" y="${y + 18}" fill="${CHART_COLORS.text}" font-size="11">${escapeXml(p.name)}${isOv ? '*' : ''}</text>`

    // rest red full cycle background for main phases
    if (!isOv) {
      body += `<rect x="${left}" y="${y + 6}" width="${C * scale}" height="18" fill="${CHART_COLORS.red}" opacity="0.35"/>`
    }

    const g = Math.max(0, p.greenSec)
    const ye = Math.max(0, p.yellowSec)
    const ar = Math.max(0, p.allRedSec)
    const x0 = isOv ? left + ((cursor % C) * scale) : left + cursor * scale

    // clip if beyond C
    const drawSeg = (x: number, wSec: number, color: string) => {
      if (wSec <= 0) return
      const w = Math.min(wSec, Math.max(0, C - (x - left) / scale)) * scale
      if (w <= 0) return
      body += `<rect x="${x}" y="${y + 6}" width="${Math.max(0.5, w)}" height="18" fill="${color}"/>`
    }
    drawSeg(x0, g, CHART_COLORS.green)
    drawSeg(x0 + g * scale, ye, CHART_COLORS.yellow)
    drawSeg(x0 + (g + ye) * scale, ar, '#7f1d1d')

    // numeric labels when space
    const minLabel = 18
    if (g * scale >= minLabel) {
      body += `<text x="${x0 + (g * scale) / 2}" y="${y + 19}" text-anchor="middle" fill="#052e16" font-size="9" font-weight="700">${fmtNum(g, 'int')}</text>`
    }
    if (ye * scale >= 12) {
      body += `<text x="${x0 + g * scale + (ye * scale) / 2}" y="${y + 19}" text-anchor="middle" fill="#422006" font-size="8" font-weight="700">${fmtNum(ye, 'int')}</text>`
    }
    if (ar * scale >= 12) {
      body += `<text x="${x0 + (g + ye) * scale + (ar * scale) / 2}" y="${y + 19}" text-anchor="middle" fill="#fecaca" font-size="8" font-weight="700">${fmtNum(ar, 'int')}</text>`
    }

    // duration callout
    const dur = g + ye + ar
    body += `<text x="${width - right}" y="${y + 18}" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="9">${fmtNum(dur, 'sec')}s</text>`

    if (!isOv) cursor += g + ye + ar
  })

  // legend
  const ly = height - 22
  const legend = [
    [CHART_COLORS.green, '绿灯 G'],
    [CHART_COLORS.yellow, '黄灯 Y'],
    ['#7f1d1d', '全红 AR'],
    [CHART_COLORS.red, '红灯(余)'],
  ] as const
  legend.forEach((L, i) => {
    const x = left + i * 88
    body += `<rect x="${x}" y="${ly - 8}" width="10" height="10" fill="${L[0]}"/>`
    body += `<text x="${x + 14}" y="${ly}" fill="${CHART_COLORS.muted}" font-size="9">${L[1]}</text>`
  })

  const balTxt =
    Math.abs(balance) < 0.15
      ? `主相位 Σ(G+Y+AR)=${fmtNum(sumMain, 'sec')}s = C · 闭合`
      : `主相位 Σ(G+Y+AR)=${fmtNum(sumMain, 'sec')}s，与 C 差 ${balance > 0 ? '+' : ''}${balance}s`
  body += chartFooter(
    `配时图 · ${balTxt} · *搭接不计入周期累加 · 纵轴相位/横轴时间(s)`,
    12,
    height - 6,
  )

  return svgShell(width, height, body)
}

export function controlMatrixSvg(
  approaches: string[],
  phases: { name: string; releases: Record<string, string[]> }[],
  approachIds: string[],
  opts: { width?: number; cell?: number } = {},
): string {
  const cellW = opts.cell ?? 44
  const cellH = 26
  const left = 80
  const top = 40
  const width = opts.width ?? left + phases.length * cellW + 20
  const height = top + approaches.length * cellH + 36
  let body = `<text x="12" y="16" fill="${CHART_COLORS.axis}" font-size="11" font-weight="700">相位放行管控图</text>`
  body += `<text x="12" y="30" fill="${CHART_COLORS.muted}" font-size="9">单元格 = 该相位放行转向（L/T/R）· 空 = 禁行</text>`
  phases.forEach((ph, j) => {
    body += `<text x="${left + j * cellW + cellW / 2}" y="${top - 10}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="9">${escapeXml(ph.name)}</text>`
  })
  approaches.forEach((name, i) => {
    const y = top + i * cellH
    body += `<text x="12" y="${y + 17}" fill="${CHART_COLORS.text}" font-size="10">${escapeXml(name)}</text>`
    phases.forEach((ph, j) => {
      const id = approachIds[i]
      const movs = [...(ph.releases[id] ?? [])].sort((a, b) => 'LTRU'.indexOf(a) - 'LTRU'.indexOf(b))
      const x = left + j * cellW
      const label = movs.length ? movs.join('·') : '—'
      const on = movs.length > 0
      body += `<rect x="${x + 2}" y="${y + 3}" width="${cellW - 4}" height="${cellH - 6}" rx="4" fill="${on ? '#14532d' : '#1e293b'}" stroke="${CHART_COLORS.grid}"/>`
      body += `<text x="${x + cellW / 2}" y="${y + 17}" text-anchor="middle" fill="${on ? '#86efac' : '#64748b'}" font-size="10" font-weight="700">${escapeXml(label)}</text>`
    })
  })
  body += chartFooter('管控图 · 与相位 releases 字段一一对应', 12, height - 8)
  return svgShell(width, height, body)
}

export function flowMovementDiagramSvg(
  approaches: { name: string; bearingDeg: number; L: number; T: number; R: number }[],
  opts: { size?: number } = {},
): string {
  const size = opts.size ?? 400
  const cx = size / 2
  const cy = size / 2 + 6
  const R = size * 0.28
  const maxV = Math.max(1, ...approaches.flatMap((a) => [a.L, a.T, a.R]))
  const total = approaches.reduce((s, a) => s + a.L + a.T + a.R, 0)
  let body = ''
  body += `<text x="12" y="16" fill="${CHART_COLORS.axis}" font-size="11" font-weight="700">流量流向图</text>`
  body += `<text x="12" y="30" fill="${CHART_COLORS.muted}" font-size="9">线宽 ∝ 转向流量 · 标注单位 pcu/h · Σ = ${fmtNum(total, 'int')} pcu/h</text>`
  body += `<circle cx="${cx}" cy="${cy}" r="${R * 0.4}" fill="#111827" stroke="#475569" stroke-width="2"/>`
  body += `<circle cx="${cx}" cy="${cy}" r="4" fill="#94a3b8"/>`

  // scale bar for line width
  body += `<text x="${size - 12}" y="16" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="9">比例：最大转向 = ${fmtNum(maxV, 'int')} pcu/h</text>`

  for (const ap of approaches) {
    const rad = ((ap.bearingDeg - 90) * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const xOut = cx + cos * R * 1.45
    const yOut = cy + sin * R * 1.45
    const xIn = cx + cos * R * 0.52
    const yIn = cy + sin * R * 0.52
    body += `<line x1="${xOut}" y1="${yOut}" x2="${xIn}" y2="${yIn}" stroke="#334155" stroke-width="18" stroke-linecap="round" opacity="0.9"/>`

    const x1 = cx + cos * R * 1.3
    const y1 = cy + sin * R * 1.3
    const x0 = cx + cos * R * 0.58
    const y0 = cy + sin * R * 0.58
    // width mapping: 1.5..12 px proportional to flow
    const wmap = (v: number) => 1.5 + (v / maxV) * 10.5
    body += arrow(x1, y1, x0, y0, CHART_COLORS.through, wmap(ap.T), fmtNum(ap.T, 'int'))
    const lx = Math.cos(rad + Math.PI / 2)
    const ly = Math.sin(rad + Math.PI / 2)
    body += arrow(x1 + lx * 14, y1 + ly * 14, x0 + lx * 28, y0 + ly * 28, CHART_COLORS.left, wmap(ap.L), fmtNum(ap.L, 'int'))
    const rx = Math.cos(rad - Math.PI / 2)
    const ry = Math.sin(rad - Math.PI / 2)
    body += arrow(x1 + rx * 14, y1 + ry * 14, x0 + rx * 28, y0 + ry * 28, CHART_COLORS.right, wmap(ap.R), fmtNum(ap.R, 'int'))
    const sum = ap.L + ap.T + ap.R
    body += `<text x="${cx + cos * R * 1.62}" y="${cy + sin * R * 1.62}" text-anchor="middle" fill="${CHART_COLORS.text}" font-size="11" font-weight="700">${escapeXml(ap.name)}</text>`
    body += `<text x="${cx + cos * R * 1.62}" y="${cy + sin * R * 1.62 + 12}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="9">Σ${fmtNum(sum, 'int')} · ${fmtNum(ap.bearingDeg, 'int')}°</text>`
  }

  const chips = [
    [CHART_COLORS.through, '直行 T'],
    [CHART_COLORS.left, '左转 L'],
    [CHART_COLORS.right, '右转 R'],
  ] as const
  chips.forEach((c, i) => {
    const x = 12 + i * 78
    body += `<rect x="${x}" y="${size - 22}" width="10" height="10" rx="2" fill="${c[0]}"/>`
    body += `<text x="${x + 14}" y="${size - 13}" fill="${CHART_COLORS.muted}" font-size="9">${c[1]}</text>`
  })
  return svgShell(size, size, body)
}

export function timeSpaceDiagramSvg(
  nodes: { name: string; distanceM: number; greenRatio: number; offsetSec: number; cycleSec: number }[],
  speedKmh: number,
  opts: { width?: number; height?: number } = {},
): string {
  const width = opts.width ?? 560
  const height = opts.height ?? 300
  const pad = { t: 40, r: 20, b: 40, l: 52 }
  if (nodes.length < 2) {
    return svgShell(width, height, `<text x="50%" y="50%" text-anchor="middle" fill="${CHART_COLORS.muted}">至少 2 个路口</text>`)
  }
  const sorted = [...nodes].sort((a, b) => a.distanceM - b.distanceM)
  const C = sorted[0].cycleSec || 90
  const maxD = Math.max(...sorted.map((n) => n.distanceM), 1)
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const xOf = (d: number) => pad.l + (d / maxD) * innerW
  const yOf = (t: number) => pad.t + (1 - t / C) * innerH
  const v = (speedKmh * 1000) / 3600

  let body = `<text x="12" y="16" fill="${CHART_COLORS.axis}" font-size="11" font-weight="700">干道时距图（示意）</text>`
  body += `<text x="12" y="30" fill="${CHART_COLORS.muted}" font-size="9">横轴距离 m · 纵轴周期时间 s · 绿条=有效绿窗 · v=${fmtNum(speedKmh, 'flow')} km/h · C=${fmtNum(C, 'int')}s</text>`

  // grid
  for (const t of timeTicks(C)) {
    const y = yOf(t)
    body += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="${CHART_COLORS.grid}" stroke-width="1"/>`
    body += `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="${CHART_COLORS.muted}" font-size="9">${fmtNum(t, 'int')}</text>`
  }

  for (const n of sorted) {
    const x = xOf(n.distanceM)
    body += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + innerH}" stroke="${CHART_COLORS.grid}"/>`
    const g0 = ((n.offsetSec % C) + C) % C
    const gSec = Math.max(0.5, n.greenRatio * C)
    // green may wrap
    const segments: [number, number][] = []
    if (g0 + gSec <= C) segments.push([g0, g0 + gSec])
    else {
      segments.push([g0, C])
      segments.push([0, g0 + gSec - C])
    }
    for (const [a, b] of segments) {
      const y1 = yOf(a)
      const y0 = yOf(b)
      body += `<rect x="${x - 9}" y="${Math.min(y0, y1)}" width="18" height="${Math.max(3, Math.abs(y0 - y1))}" fill="${CHART_COLORS.green}" opacity="0.85" rx="2"/>`
    }
    body += `<text x="${x}" y="${height - 18}" text-anchor="middle" fill="${CHART_COLORS.axis}" font-size="10">${escapeXml(n.name)}</text>`
    body += `<text x="${x}" y="${height - 6}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="8">${fmtNum(n.distanceM, 'int')}m o=${fmtNum(n.offsetSec, 'sec')}s λ=${fmtNum(n.greenRatio, 'vc')}</text>`
  }

  // progressive trajectory from first offset through travel times
  let t = ((sorted[0].offsetSec % C) + C) % C
  const pts: string[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const dist = sorted[i].distanceM - sorted[i - 1].distanceM
      t = (t + dist / Math.max(0.1, v)) % C
    }
    pts.push(`${xOf(sorted[i].distanceM)},${yOf(t)}`)
  }
  body += `<polyline fill="none" stroke="#38bdf8" stroke-width="2" points="${pts.join(' ')}"/>`
  body += chartFooter('时距示意 · 完整交互图见绿波页（带宽色带/悬停）', 12, height - 2)
  return svgShell(width, height, body)
}

export function phaseFaceDiagramSvg(
  approaches: { name: string; bearingDeg: number; id: string }[],
  phase: { name: string; releases: Record<string, string[]> },
  opts: { size?: number } = {},
): string {
  const size = opts.size ?? 180
  const cx = size / 2
  const cy = size / 2 + 4
  const R = size * 0.28
  let body = `<text x="8" y="14" fill="${CHART_COLORS.muted}" font-size="10" font-weight="700">${escapeXml(phase.name)}</text>`
  body += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#111827" stroke="#475569"/>`
  for (const ap of approaches) {
    const rad = ((ap.bearingDeg - 90) * Math.PI) / 180
    const movs = phase.releases[ap.id] ?? []
    const on = movs.length > 0
    const x = cx + Math.cos(rad) * R * 0.7
    const y = cy + Math.sin(rad) * R * 0.7
    body += `<circle cx="${x}" cy="${y}" r="12" fill="${on ? '#14532d' : '#1e293b'}" stroke="${on ? '#22c55e' : '#334155'}"/>`
    body += `<text x="${x}" y="${y + 3}" text-anchor="middle" fill="${on ? '#86efac' : '#64748b'}" font-size="8" font-weight="700">${movs.join('·') || '·'}</text>`
    body += `<text x="${cx + Math.cos(rad) * R * 1.35}" y="${cy + Math.sin(rad) * R * 1.35}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="8">${escapeXml(ap.name.replace('进口', ''))}</text>`
  }
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
  const ah = Math.min(10, 6 + w * 0.4)
  const tipX = x2
  const tipY = y2
  const baseX = x2 - ux * ah
  const baseY = y2 - uy * ah
  const head = `${tipX},${tipY} ${baseX + px * (w * 0.9)},${baseY + py * (w * 0.9)} ${baseX - px * (w * 0.9)},${baseY - py * (w * 0.9)}`
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  return `<line x1="${x1}" y1="${y1}" x2="${baseX}" y2="${baseY}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
    <polygon points="${head}" fill="${color}"/>
    <text x="${midX + px * (w + 6)}" y="${midY + py * (w + 6)}" text-anchor="middle" fill="${CHART_COLORS.text}" font-size="10" font-weight="700">${escapeXml(label)}</text>`
}
