/**
 * RoadGee-style intersection flow / OD diagram (export + live panel).
 * Colored curved movement ribbons + approach totals; NO watermark.
 * Values must come from flowAlign / analysis — never decorative fudge.
 */
import type { Approach, FlowScheme } from '@/domain/types'
import { buildFlowAlignment, type FlowDisplayMode } from '@/domain/flow/flowAlign'
import { escapeXml, fmtNum } from './chartStandards'

export type RoadGeeFlowStyle = {
  thickness: number
  length1: number
  font1: number
  length2: number
  font2: number
  spacing: number
  font3: number
  scheme: 1 | 2 | 3
}

export const DEFAULT_ROADGEE_FLOW_STYLE: RoadGeeFlowStyle = {
  thickness: 1,
  length1: 50,
  font1: 14,
  length2: 50,
  font2: 14,
  spacing: 40,
  font3: 17,
  scheme: 1,
}

/** Per-approach palette (RoadGee scheme1-like). */
const SCHEMES: Record<number, string[]> = {
  1: ['#e11d48', '#16a34a', '#eab308', '#2563eb'],
  2: ['#dc2626', '#059669', '#ca8a04', '#1d4ed8'],
  3: ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6'],
}

function polar(cx: number, cy: number, r: number, bearingDeg: number) {
  // SVG: 0° = east, screen y down; domain bearing 0 = north
  const rad = ((bearingDeg - 90) * Math.PI) / 180
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r, rad }
}

function arrowHead(x: number, y: number, angle: number, size: number, fill: string): string {
  const a = angle
  const x1 = x + Math.cos(a + 2.6) * size
  const y1 = y + Math.sin(a + 2.6) * size
  const x2 = x + Math.cos(a - 2.6) * size
  const y2 = y + Math.sin(a - 2.6) * size
  return `<polygon points="${x},${y} ${x1},${y1} ${x2},${y2}" fill="${fill}"/>`
}

/**
 * Build RoadGee-like multi-color flow ribbon diagram.
 * Through = straight into core; L/R = quadratic curves to adjacent legs.
 */
export function roadgeeFlowDiagramSvg(
  approaches: Approach[],
  flow: FlowScheme,
  opts: {
    size?: number
    mode?: FlowDisplayMode
    style?: Partial<RoadGeeFlowStyle>
  } = {},
): string {
  const size = opts.size ?? 520
  const mode = opts.mode ?? 'natural'
  const st = { ...DEFAULT_ROADGEE_FLOW_STYLE, ...opts.style }
  const align = buildFlowAlignment(approaches, flow, mode)
  const colors = SCHEMES[st.scheme] ?? SCHEMES[1]
  const cx = size / 2
  const cy = size / 2 + 8
  const R = size * 0.34
  const coreR = size * 0.1
  const tw = Math.max(0.6, st.thickness)

  let g = ''
  // quiet canvas — no watermark
  g += `<rect width="${size}" height="${size}" fill="#fafafa"/>`
  g += `<text x="14" y="22" fill="#0f172a" font-size="13" font-weight="700" font-family="system-ui,sans-serif">流量流向</text>`
  g += `<text x="14" y="38" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">${escapeXml(align.unit)} · 与表同源 · 改表即改图</text>`

  // intersection hub
  g += `<circle cx="${cx}" cy="${cy}" r="${coreR}" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>`

  // approach stubs (light carriageway)
  for (const ap of approaches) {
    const o = polar(cx, cy, R * 1.05, ap.bearingDeg)
    const i = polar(cx, cy, coreR + 4, ap.bearingDeg)
    g += `<line x1="${o.x}" y1="${o.y}" x2="${i.x}" y2="${i.y}" stroke="#cbd5e1" stroke-width="${18 * tw}" stroke-linecap="round" opacity="0.55"/>`
  }

  // movement ribbons per approach color
  approaches.forEach((ap, ai) => {
    const row = align.rows.find((r) => r.approachId === ap.id)
    if (!row) return
    const col = colors[ai % colors.length]
    const entry = polar(cx, cy, R * 0.92, ap.bearingDeg)
    const near = polar(cx, cy, coreR + 10, ap.bearingDeg)
    const mid = polar(cx, cy, R * 0.55, ap.bearingDeg)
    const maxV = Math.max(1, ...align.rows.flatMap((r) => [r.chartL, r.chartT, r.chartR]))
    const w = (v: number) => Math.max(2.5, (v / maxV) * 14 * tw + 2)

    // Through
    if (row.chartT > 0) {
      const exitAp = approaches[(ai + 2) % approaches.length] ?? ap
      const out = polar(cx, cy, R * 0.88, exitAp.bearingDeg)
      const c1 = polar(cx, cy, coreR * 0.2, ap.bearingDeg)
      g += `<path d="M ${entry.x} ${entry.y} Q ${c1.x} ${c1.y} ${out.x} ${out.y}" fill="none" stroke="${col}" stroke-width="${w(row.chartT)}" stroke-linecap="round" opacity="0.9"/>`
      const ang = Math.atan2(out.y - c1.y, out.x - c1.x)
      g += arrowHead(out.x, out.y, ang, 9 * tw, col)
    }
    // Left (to previous approach in bearing order)
    if (row.chartL > 0) {
      const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
      const idx = sorted.findIndex((a) => a.id === ap.id)
      const leftAp = sorted[(idx - 1 + sorted.length) % sorted.length]
      const out = polar(cx, cy, R * 0.82, leftAp.bearingDeg)
      const ctrl = polar(cx, cy, R * 0.22, (ap.bearingDeg + leftAp.bearingDeg) / 2)
      g += `<path d="M ${entry.x} ${entry.y} Q ${ctrl.x} ${ctrl.y} ${out.x} ${out.y}" fill="none" stroke="${col}" stroke-width="${w(row.chartL)}" stroke-linecap="round" opacity="0.85"/>`
      const ang = Math.atan2(out.y - ctrl.y, out.x - ctrl.x)
      g += arrowHead(out.x, out.y, ang, 8 * tw, col)
    }
    // Right
    if (row.chartR > 0) {
      const sorted = [...approaches].sort((a, b) => a.bearingDeg - b.bearingDeg)
      const idx = sorted.findIndex((a) => a.id === ap.id)
      const rightAp = sorted[(idx + 1) % sorted.length]
      const out = polar(cx, cy, R * 0.82, rightAp.bearingDeg)
      const ctrl = polar(cx, cy, R * 0.22, (ap.bearingDeg + rightAp.bearingDeg) / 2)
      g += `<path d="M ${entry.x} ${entry.y} Q ${ctrl.x} ${ctrl.y} ${out.x} ${out.y}" fill="none" stroke="${col}" stroke-width="${w(row.chartR)}" stroke-linecap="round" opacity="0.85"/>`
      const ang = Math.atan2(out.y - ctrl.y, out.x - ctrl.x)
      g += arrowHead(out.x, out.y, ang, 8 * tw, col)
    }

    // labels: approach total + splits (live numbers)
    const lab = polar(cx, cy, R * 1.18, ap.bearingDeg)
    const sum = row.chartL + row.chartT + row.chartR
    const boxW = 48 + st.font3
    g += `<rect x="${lab.x - boxW / 2}" y="${lab.y - st.font3 - 4}" width="${boxW}" height="${st.font3 + 10}" rx="4" fill="#fff" stroke="${col}" stroke-width="1.5"/>`
    g += `<text x="${lab.x}" y="${lab.y + 2}" text-anchor="middle" fill="#0f172a" font-size="${st.font3}" font-weight="800" font-family="system-ui,sans-serif">${fmtNum(sum, 'int')}</text>`
    g += `<text x="${lab.x}" y="${lab.y + st.font3 + 10}" text-anchor="middle" fill="#334155" font-size="${st.font1}" font-family="system-ui,sans-serif">${escapeXml(ap.name.replace('进口', '') || ap.name)}</text>`

    // split chips near mid
    const splits = [
      ['L', row.chartL],
      ['T', row.chartT],
      ['R', row.chartR],
    ] as const
    splits.forEach((s, si) => {
      if (s[1] <= 0) return
      const off = (si - 1) * (st.spacing * 0.35)
      const px = -Math.sin(mid.rad) * off
      const py = Math.cos(mid.rad) * off
      const sx = mid.x + px
      const sy = mid.y + py
      g += `<rect x="${sx - 18}" y="${sy - 9}" width="36" height="16" rx="3" fill="#fef9c3" stroke="#ca8a04" stroke-width="0.8"/>`
      g += `<text x="${sx}" y="${sy + 4}" text-anchor="middle" fill="#0f172a" font-size="${st.font2}" font-weight="700" font-family="system-ui,sans-serif">${fmtNum(s[1], 'int')}</text>`
    })

    void near
    void entry
  })

  // color legend chips
  approaches.forEach((ap, ai) => {
    const col = colors[ai % colors.length]
    const x = 14 + ai * 72
    g += `<rect x="${x}" y="${size - 22}" width="10" height="10" rx="2" fill="${col}"/>`
    g += `<text x="${x + 14}" y="${size - 13}" fill="#475569" font-size="10" font-family="system-ui,sans-serif">${escapeXml(ap.name.replace('进口', ''))}</text>`
  })

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro chart-svg--roadgee">${g}</svg>`
}

export function roadgeeFlowStyleMarkdown(style: RoadGeeFlowStyle): string {
  return `粗细 ${style.thickness} · 字号 ${style.font1}/${style.font2}/${style.font3} · 间距 ${style.spacing} · 方案${style.scheme}`
}
