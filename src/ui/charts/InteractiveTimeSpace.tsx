/**
 * Interactive time–space diagram for arterial green-band (绿波时距图).
 * Distance on X (m), cycle time on Y (s), green windows as bars, trajectories + half-band ribbons.
 * Hover shows node/link parameters. Tick marks use engineering timeTicks(C).
 */
import { useMemo, useRef, useState, type MouseEvent } from 'react'
import type { BandCorridor, BandResult } from '@/domain/types'
import { useAppStore } from '@/state/store'
import { fmtNum, timeTicks as engTimeTicks } from './chartStandards'

type Hover =
  | null
  | {
      kind: 'node' | 'segment' | 'band'
      title: string
      lines: string[]
      x: number
      y: number
    }

const METHOD_LABEL: Record<string, string> = {
  classic: '经典数解（双向）',
  'optimized-scan': '优化扫描（MAXBAND 启发）',
  'one-way': '单向协调',
  'two-way-equal': '双向等带宽',
  graphical: '图解法（半周期）',
}

const VIEW = { W: 560, H: 340, pad: { t: 40, r: 24, b: 48, l: 56 } }

export function InteractiveTimeSpace({
  corridor,
  result,
}: {
  corridor: BandCorridor
  result?: BandResult | null
}) {
  const theme = useAppStore((s) => s.theme)
  const dark = theme !== 'light'
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover>(null)

  const model = useMemo(() => buildModel(corridor, result), [corridor, result])
  const { W, H, pad } = VIEW
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const colors = dark
    ? {
        bg: '#0b1018',
        grid: '#1c2533',
        axis: '#7d8b9e',
        text: '#e6edf5',
        green: '#22c55e',
        fwd: '#38bdf8',
        bwd: '#f472b6',
        node: '#94a3b8',
        card: 'rgba(15,23,42,0.94)',
      }
    : {
        bg: '#f8fafc',
        grid: '#e2e8f0',
        axis: '#64748b',
        text: '#0f172a',
        green: '#16a34a',
        fwd: '#0284c7',
        bwd: '#db2777',
        node: '#475569',
        card: 'rgba(255,255,255,0.96)',
      }

  if (model.nodes.length < 2) {
    return <p className="hint">至少 2 个路口才能绘制时距图。请添加路口并输入路段距离。</p>
  }

  const xOf = (d: number) => pad.l + (d / model.maxD) * innerW
  const yOf = (t: number) => pad.t + (1 - t / model.C) * innerH

  function onMove(e: MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    const my = ((e.clientY - rect.top) / rect.height) * H
    for (const n of model.nodes) {
      const x = xOf(n.distanceM)
      if (Math.abs(mx - x) < 14 && my >= pad.t && my <= pad.t + innerH) {
        setHover({
          kind: 'node',
          title: n.name,
          lines: [
            `桩号 ${fmtNum(n.distanceM, 'int')} m`,
            `绿信比 λ=${fmtNum(n.greenRatio, 'vc')}`,
            `周期 C=${fmtNum(n.cycleSec, 'int')} s`,
            `相位差 o=${fmtNum(n.offsetSec, 'sec')} s`,
            `绿灯窗 g=${fmtNum(n.greenSec, 'sec')} s`,
            `方法 ${METHOD_LABEL[corridor.method] ?? corridor.method}`,
          ],
          x: e.clientX,
          y: e.clientY,
        })
        return
      }
    }
    for (const seg of model.segments) {
      const x0 = xOf(seg.fromD)
      const x1 = xOf(seg.toD)
      if (mx >= Math.min(x0, x1) && mx <= Math.max(x0, x1) && my >= pad.t && my <= pad.t + innerH) {
        setHover({
          kind: 'segment',
          title: `${seg.fromName} → ${seg.toName}`,
          lines: [
            `路段长度 ${fmtNum(seg.lengthM, 'int')} m`,
            `设计带速 ${fmtNum(corridor.speedKmh, 'flow')} km/h`,
            `行程时间 τ=${fmtNum(seg.travelSec, 'sec')} s`,
            `上行带宽 b↑=${fmtNum(model.forwardSec, 'sec')} s`,
            `下行带宽 b↓=${fmtNum(model.backwardSec, 'sec')} s`,
          ],
          x: e.clientX,
          y: e.clientY,
        })
        return
      }
    }
    setHover({
      kind: 'band',
      title: '走廊总览',
      lines: [
        `方法 ${METHOD_LABEL[corridor.method] ?? corridor.method}`,
        `带宽比 ${(model.ratio * 100).toFixed(1)}%`,
        `平均带宽 ${fmtNum(model.bandSec, 'sec')} s`,
        `半周期距离 a≈${fmtNum(model.halfA, 'int')} m`,
        `标准带速 ${fmtNum(model.stdV, 'flow')} km/h`,
      ],
      x: e.clientX,
      y: e.clientY,
    })
  }

  const ticks = engTimeTicks(model.C)
  const distTicks = distanceTicks(model.maxD)

  return (
    <div className="chart-card ts-wrap" ref={wrapRef} style={{ position: 'relative' }}>
      <div className="chart-title">
        <span>交互时距图</span>
        <small>纵轴=周期时间 s · 横轴=距离 m · 与带宽计算同源</small>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg ts-svg"
        role="img"
        aria-label="绿波时距图"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ width: '100%', height: 'auto', cursor: 'crosshair', borderRadius: 8 }}
      >
        <rect width={W} height={H} fill={colors.bg} rx="8" />
        <text x="12" y="16" fill={colors.axis} fontSize="11" fontWeight={700}>
          干道协调时距图
        </text>
        <text x="12" y="30" fill={colors.axis} fontSize="9">
          {METHOD_LABEL[corridor.method] ?? corridor.method} · v={fmtNum(corridor.speedKmh, 'flow')} km/h ·
          C={fmtNum(model.C, 'int')} s · b↑={fmtNum(model.forwardSec, 'sec')}s · b↓=
          {fmtNum(model.backwardSec, 'sec')}s
        </text>

        {ticks.map((t, i) => {
          const y = yOf(t)
          return (
            <g key={`t${i}`}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke={colors.grid} strokeWidth={1} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fill={colors.axis} fontSize="9">
                {fmtNum(t, 'int')}
              </text>
            </g>
          )
        })}
        <text x={8} y={pad.t + 8} fill={colors.axis} fontSize="9">
          t(s)
        </text>

        {distTicks.map((d, i) => {
          const x = xOf(d)
          return (
            <g key={`d${i}`}>
              <line
                x1={x}
                y1={pad.t}
                x2={x}
                y2={pad.t + innerH}
                stroke={colors.grid}
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.7}
              />
            </g>
          )
        })}

        {/* ribbons */}
        {model.fwdRibbonPts && (
          <polygon
            points={model.fwdRibbonPts.map((p) => `${xOf(p.d)},${yOf(wrap(p.t, model.C))}`).join(' ')}
            fill={colors.fwd}
            opacity={0.16}
          />
        )}
        {model.bwdRibbonPts && corridor.method !== 'one-way' && (
          <polygon
            points={model.bwdRibbonPts.map((p) => `${xOf(p.d)},${yOf(wrap(p.t, model.C))}`).join(' ')}
            fill={colors.bwd}
            opacity={0.14}
          />
        )}

        {model.nodes.map((n) => {
          const x = xOf(n.distanceM)
          const g0 = wrap(n.offsetSec, model.C)
          const segs = greenSegments(g0, n.greenSec, model.C)
          return (
            <g key={n.id}>
              <line x1={x} y1={pad.t} x2={x} y2={pad.t + innerH} stroke={colors.grid} strokeWidth={1.2} />
              {segs.map((seg, si) => {
                const y0 = yOf(seg[0])
                const y1 = yOf(seg[1])
                return (
                  <rect
                    key={si}
                    x={x - 10}
                    y={Math.min(y0, y1)}
                    width={20}
                    height={Math.max(3, Math.abs(y0 - y1))}
                    fill={colors.green}
                    opacity={0.9}
                    rx={2}
                  />
                )
              })}
              <circle cx={x} cy={pad.t + innerH + 6} r={3.5} fill={colors.node} />
              <text x={x} y={H - 20} textAnchor="middle" fill={colors.axis} fontSize="10" fontWeight={600}>
                {n.name}
              </text>
              <text x={x} y={H - 8} textAnchor="middle" fill={colors.axis} fontSize="8">
                {fmtNum(n.distanceM, 'int')}m · o={fmtNum(n.offsetSec, 'sec')}s · λ=
                {fmtNum(n.greenRatio, 'vc')}
              </text>
            </g>
          )
        })}

        <polyline
          fill="none"
          stroke={colors.fwd}
          strokeWidth={2.4}
          points={model.fwdPath.map((p) => `${xOf(p.d)},${yOf(p.t)}`).join(' ')}
        />
        <polyline
          fill="none"
          stroke={colors.bwd}
          strokeWidth={2.2}
          strokeDasharray={corridor.method === 'one-way' ? '0' : '6 3'}
          opacity={corridor.method === 'one-way' ? 0.2 : 1}
          points={model.bwdPath.map((p) => `${xOf(p.d)},${yOf(p.t)}`).join(' ')}
        />

        {model.nodes.map((n) => {
          const x = xOf(n.distanceM)
          const y = yOf(wrap(n.offsetSec, model.C))
          return (
            <text key={`o-${n.id}`} x={x + 12} y={y - 4} fill={colors.text} fontSize="9" fontWeight={600}>
              o={fmtNum(n.offsetSec, 'sec')}s
            </text>
          )
        })}

        <rect
          x={pad.l}
          y={pad.t + 4}
          width={188}
          height={48}
          rx={6}
          fill={colors.bg}
          opacity={0.9}
          stroke={colors.grid}
        />
        <text x={pad.l + 8} y={pad.t + 18} fill={colors.fwd} fontSize="10" fontWeight={700}>
          上行带宽 b↑ = {fmtNum(model.forwardSec, 'sec')} s
        </text>
        <text x={pad.l + 8} y={pad.t + 32} fill={colors.bwd} fontSize="10" fontWeight={700}>
          下行带宽 b↓ = {fmtNum(model.backwardSec, 'sec')} s
        </text>
        <text x={pad.l + 8} y={pad.t + 46} fill={colors.axis} fontSize="8">
          带宽比 {(model.ratio * 100).toFixed(1)}% · a={fmtNum(model.halfA, 'int')} m · v=
          {fmtNum(model.stdV, 'flow')} km/h
        </text>

        <text x={W - pad.r} y={pad.t + 14} textAnchor="end" fill={colors.fwd} fontSize="9">
          → 上行
        </text>
        <text x={W - pad.r} y={pad.t + 26} textAnchor="end" fill={colors.bwd} fontSize="9">
          ← 下行
        </text>
        <text x={pad.l} y={H - 2} fill={colors.axis} fontSize="8">
          刻度：时间 {ticks[1] - ticks[0] || 0}s 步长 · 带宽与 scoreOffsets 同源 · 色带=半带宽示意
        </text>
      </svg>

      {hover && (
        <div
          className="ts-tooltip"
          style={{
            position: 'fixed',
            left: Math.min(window.innerWidth - 220, hover.x + 12),
            top: Math.max(8, hover.y - 12),
            zIndex: 50,
            background: colors.card,
            color: colors.text,
            border: `1px solid ${colors.grid}`,
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
            lineHeight: 1.45,
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            maxWidth: 220,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{hover.title}</div>
          {hover.lines.map((l) => (
            <div key={l} style={{ opacity: 0.9 }}>
              {l}
            </div>
          ))}
        </div>
      )}

      <div className="metric-grid" style={{ marginTop: 10 }}>
        <div className="metric">
          <div className="label">带宽比</div>
          <div className="value">{(model.ratio * 100).toFixed(1)}%</div>
        </div>
        <div className="metric">
          <div className="label">上行 b↑</div>
          <div className="value">
            {fmtNum(model.forwardSec, 'sec')}
            <small style={{ fontSize: 11 }}> s</small>
          </div>
        </div>
        <div className="metric">
          <div className="label">下行 b↓</div>
          <div className="value">
            {fmtNum(model.backwardSec, 'sec')}
            <small style={{ fontSize: 11 }}> s</small>
          </div>
        </div>
        <div className="metric">
          <div className="label">半周期 a</div>
          <div className="value">
            {fmtNum(model.halfA, 'int')}
            <small style={{ fontSize: 11 }}> m</small>
          </div>
        </div>
      </div>
    </div>
  )
}

function wrap(t: number, C: number): number {
  return ((t % C) + C) % C
}

/** Green as 1–2 half-open segments on [0,C) */
function greenSegments(start: number, len: number, C: number): [number, number][] {
  if (len <= 0) return []
  if (len >= C) return [[0, C]]
  const s = wrap(start, C)
  if (s + len <= C) return [[s, s + len]]
  return [
    [s, C],
    [0, s + len - C],
  ]
}

function distanceTicks(maxD: number): number[] {
  if (maxD <= 0) return [0]
  const raw = maxD / 4
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))))
  const n = raw / pow
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
  const ticks: number[] = []
  for (let d = 0; d <= maxD + 1e-6; d += step) ticks.push(Math.round(d * 10) / 10)
  if (ticks[ticks.length - 1] !== maxD) ticks.push(maxD)
  return ticks
}

function buildModel(corridor: BandCorridor, result?: BandResult | null) {
  const nodes = [...corridor.nodes].sort((a, b) => a.distanceM - b.distanceM)
  const C = nodes[0]?.cycleSec || 90
  const v = (corridor.speedKmh * 1000) / 3600
  const maxD = Math.max(...nodes.map((n) => n.distanceM), 1)
  const enriched = nodes.map((n) => ({
    ...n,
    cycleSec: n.cycleSec || C,
    greenSec: Math.max(0, n.greenRatio * (n.cycleSec || C)),
  }))
  const segments = []
  for (let i = 1; i < enriched.length; i++) {
    const lengthM = enriched[i].distanceM - enriched[i - 1].distanceM
    segments.push({
      fromName: enriched[i - 1].name,
      toName: enriched[i].name,
      fromD: enriched[i - 1].distanceM,
      toD: enriched[i].distanceM,
      lengthM,
      travelSec: lengthM / Math.max(0.1, v),
    })
  }

  // Trajectory at green start (leading edge of band); ribbon = ± half bandwidth
  const fwdPath: { d: number; t: number }[] = []
  let t = wrap(enriched[0]?.offsetSec ?? 0, C)
  for (let i = 0; i < enriched.length; i++) {
    if (i > 0) {
      const travel = (enriched[i].distanceM - enriched[i - 1].distanceM) / Math.max(0.1, v)
      t = wrap(t + travel, C)
    }
    fwdPath.push({ d: enriched[i].distanceM, t })
  }
  const bwdPath: { d: number; t: number }[] = []
  t = wrap(enriched[enriched.length - 1]?.offsetSec ?? 0, C)
  for (let i = enriched.length - 1; i >= 0; i--) {
    if (i < enriched.length - 1) {
      const travel = (enriched[i + 1].distanceM - enriched[i].distanceM) / Math.max(0.1, v)
      t = wrap(t + travel, C)
    }
    bwdPath.push({ d: enriched[i].distanceM, t })
  }

  const forwardSec = result?.forwardBandwidthSec ?? result?.bandwidthSec ?? 0
  const backwardSec = result?.backwardBandwidthSec ?? 0
  const halfFwd = Math.max(0, forwardSec / 2)
  const halfBwd = Math.max(0, backwardSec / 2)

  function ribbonPts(path: { d: number; t: number }[], half: number): { d: number; t: number }[] | null {
    if (path.length < 2 || half <= 0) return null
    const top = path.map((p) => ({ d: p.d, t: p.t - half }))
    const bot = path
      .slice()
      .reverse()
      .map((p) => ({ d: p.d, t: p.t + half }))
    return [...top, ...bot]
  }

  return {
    nodes: enriched,
    segments,
    maxD,
    C,
    fwdPath,
    bwdPath,
    fwdRibbonPts: ribbonPts(fwdPath, halfFwd),
    bwdRibbonPts: ribbonPts(bwdPath, halfBwd),
    ratio: result?.bandwidthRatio ?? 0,
    bandSec: result?.bandwidthSec ?? 0,
    forwardSec,
    backwardSec,
    halfA: result?.halfCycleDistanceM ?? (v * C) / 2,
    stdV: result?.standardSpeedKmh ?? corridor.speedKmh,
  }
}

/** Static SVG string for export — same geometry constants as interactive view. */
export function buildTimeSpaceExportSvg(
  corridor: BandCorridor,
  result?: BandResult | null,
  theme: 'dark' | 'light' = 'dark',
): string {
  const model = buildModel(corridor, result)
  const dark = theme !== 'light'
  const bg = dark ? '#0b1018' : '#f8fafc'
  const grid = dark ? '#1c2533' : '#e2e8f0'
  const axis = dark ? '#7d8b9e' : '#64748b'
  const green = dark ? '#22c55e' : '#16a34a'
  const fwd = dark ? '#38bdf8' : '#0284c7'
  const bwd = dark ? '#f472b6' : '#db2777'
  const { W, H, pad } = VIEW
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  if (model.nodes.length < 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" text-anchor="middle" fill="${axis}">至少 2 个路口</text></svg>`
  }
  const xOf = (d: number) => pad.l + (d / model.maxD) * innerW
  const yOf = (tt: number) => pad.t + (1 - tt / model.C) * innerH
  let body = `<rect width="100%" height="100%" fill="${bg}"/>`
  body += `<text x="16" y="18" fill="${axis}" font-size="11" font-weight="700">干道绿波时距图</text>`
  body += `<text x="16" y="32" fill="${axis}" font-size="9">${METHOD_LABEL[corridor.method] ?? corridor.method} · v=${fmtNum(corridor.speedKmh, 'flow')}km/h · C=${fmtNum(model.C, 'int')}s · b↑=${fmtNum(model.forwardSec, 'sec')}s · b↓=${fmtNum(model.backwardSec, 'sec')}s</text>`
  for (const tt of engTimeTicks(model.C)) {
    const y = yOf(tt)
    body += `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="${grid}"/>`
    body += `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="${axis}" font-size="9">${fmtNum(tt, 'int')}</text>`
  }
  if (model.fwdRibbonPts) {
    body += `<polygon points="${model.fwdRibbonPts.map((p) => `${xOf(p.d)},${yOf(wrap(p.t, model.C))}`).join(' ')}" fill="${fwd}" opacity="0.15"/>`
  }
  if (model.bwdRibbonPts && corridor.method !== 'one-way') {
    body += `<polygon points="${model.bwdRibbonPts.map((p) => `${xOf(p.d)},${yOf(wrap(p.t, model.C))}`).join(' ')}" fill="${bwd}" opacity="0.12"/>`
  }
  for (const n of model.nodes) {
    const x = xOf(n.distanceM)
    body += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + innerH}" stroke="${grid}"/>`
    const g0 = wrap(n.offsetSec, model.C)
    for (const seg of greenSegments(g0, n.greenSec, model.C)) {
      const y0 = yOf(seg[0])
      const y1 = yOf(seg[1])
      body += `<rect x="${x - 10}" y="${Math.min(y0, y1)}" width="20" height="${Math.max(3, Math.abs(y0 - y1))}" fill="${green}" opacity="0.9" rx="2"/>`
    }
    body += `<text x="${x}" y="${H - 20}" text-anchor="middle" fill="${axis}" font-size="10">${escapeXml(n.name)}</text>`
    body += `<text x="${x}" y="${H - 8}" text-anchor="middle" fill="${axis}" font-size="8">${fmtNum(n.distanceM, 'int')}m · o=${fmtNum(n.offsetSec, 'sec')}s</text>`
  }
  body += `<polyline fill="none" stroke="${fwd}" stroke-width="2.4" points="${model.fwdPath.map((p) => `${xOf(p.d)},${yOf(p.t)}`).join(' ')}"/>`
  if (corridor.method !== 'one-way') {
    body += `<polyline fill="none" stroke="${bwd}" stroke-width="2.2" stroke-dasharray="6 3" points="${model.bwdPath.map((p) => `${xOf(p.d)},${yOf(p.t)}`).join(' ')}"/>`
  }
  body += `<text x="${pad.l}" y="${pad.t + 14}" fill="${fwd}" font-size="11" font-weight="700">上行 b↑=${fmtNum(model.forwardSec, 'sec')}s · 带宽比 ${(model.ratio * 100).toFixed(1)}%</text>`
  body += `<text x="${pad.l}" y="${pad.t + 28}" fill="${bwd}" font-size="11" font-weight="700">下行 b↓=${fmtNum(model.backwardSec, 'sec')}s · 带速 ${fmtNum(model.stdV, 'flow')}km/h · a=${fmtNum(model.halfA, 'int')}m</text>`
  body += `<text x="${pad.l}" y="${H - 2}" fill="${axis}" font-size="8">时距图与带宽计算同源 · Crossdraw 导出</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="chart-svg">${body}</svg>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
