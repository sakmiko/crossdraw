/**
 * Interactive time–space diagram for arterial green-band (绿波时距图).
 * Style aligned with traffic engineering textbooks / coordination diagrams:
 * distance on X, cycle time on Y, green windows as bars, trajectories for bands.
 * Hover shows node/link parameters (speed, offset, λ, segment length).
 */
import { useMemo, useRef, useState, type MouseEvent } from 'react'
import type { BandCorridor, BandResult } from '@/domain/types'
import { useAppStore } from '@/state/store'

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

  const W = 520
  const H = 320
  const pad = { t: 36, r: 20, b: 44, l: 52 }
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
    // hit nodes
    for (const n of model.nodes) {
      const x = xOf(n.distanceM)
      if (Math.abs(mx - x) < 14 && my >= pad.t && my <= pad.t + innerH) {
        setHover({
          kind: 'node',
          title: n.name,
          lines: [
            `桩号 ${n.distanceM.toFixed(0)} m`,
            `绿信比 λ=${n.greenRatio.toFixed(2)}`,
            `周期 C=${n.cycleSec} s`,
            `相位差 o=${n.offsetSec.toFixed(1)} s`,
            `绿灯窗 ${n.greenSec.toFixed(1)} s`,
            `方法 ${METHOD_LABEL[corridor.method] ?? corridor.method}`,
          ],
          x: e.clientX,
          y: e.clientY,
        })
        return
      }
    }
    // hit segments
    for (let i = 0; i < model.segments.length; i++) {
      const seg = model.segments[i]
      const x0 = xOf(seg.fromD)
      const x1 = xOf(seg.toD)
      if (mx >= Math.min(x0, x1) && mx <= Math.max(x0, x1) && my >= pad.t && my <= pad.t + innerH) {
        setHover({
          kind: 'segment',
          title: `${seg.fromName} → ${seg.toName}`,
          lines: [
            `路段长度 ${seg.lengthM.toFixed(0)} m`,
            `设计带速 ${corridor.speedKmh} km/h`,
            `行程时间 ${seg.travelSec.toFixed(1)} s`,
            `上行带宽估 ${model.forwardSec.toFixed(1)} s`,
            `下行带宽估 ${model.backwardSec.toFixed(1)} s`,
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
        `带宽 ${model.bandSec.toFixed(1)} s`,
        `半周期距离 a≈${model.halfA.toFixed(0)} m`,
        `标准带速 ${model.stdV.toFixed(1)} km/h`,
      ],
      x: e.clientX,
      y: e.clientY,
    })
  }

  const ticks = 5
  const timeTicks = Array.from({ length: ticks + 1 }, (_, i) => (model.C * i) / ticks)

  return (
    <div className="chart-card ts-wrap" ref={wrapRef} style={{ position: 'relative' }}>
      <div className="chart-title">
        <span>交互时距图</span>
        <small>悬停查看参数 · 路段距离可编辑</small>
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
        <text x="12" y="18" fill={colors.axis} fontSize="10">
          干道协调时距图 · {METHOD_LABEL[corridor.method] ?? corridor.method} · v=
          {corridor.speedKmh}km/h · C={model.C}s
        </text>

        {/* grid */}
        {timeTicks.map((t, i) => {
          const y = yOf(t)
          return (
            <g key={`t${i}`}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke={colors.grid} strokeWidth={1} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fill={colors.axis} fontSize="9">
                {Math.round(t)}
              </text>
            </g>
          )
        })}

        {/* nodes + green bars (draw 2 cycles stacked visually via modulo only one cycle) */}
        {model.nodes.map((n) => {
          const x = xOf(n.distanceM)
          const g0 = ((n.offsetSec % model.C) + model.C) % model.C
          const g1 = Math.min(model.C, g0 + n.greenSec)
          const y0 = yOf(g0)
          const y1 = yOf(g1)
          const top = Math.min(y0, y1)
          const h = Math.max(4, Math.abs(y0 - y1))
          return (
            <g key={n.id}>
              <line x1={x} y1={pad.t} x2={x} y2={pad.t + innerH} stroke={colors.grid} strokeWidth={1.2} />
              <rect x={x - 10} y={top} width={20} height={h} fill={colors.green} opacity={0.88} rx={2} />
              {/* wrap green if crosses cycle — draw residual at bottom */}
              {g0 + n.greenSec > model.C && (
                <rect
                  x={x - 10}
                  y={yOf(model.C)}
                  width={20}
                  height={Math.max(4, Math.abs(yOf(model.C) - yOf((g0 + n.greenSec) % model.C)))}
                  fill={colors.green}
                  opacity={0.55}
                  rx={2}
                />
              )}
              <circle cx={x} cy={pad.t + innerH + 6} r={3.5} fill={colors.node} />
              <text x={x} y={H - 14} textAnchor="middle" fill={colors.axis} fontSize="10" fontWeight={600}>
                {n.name}
              </text>
              <text x={x} y={H - 3} textAnchor="middle" fill={colors.axis} fontSize="8">
                {n.distanceM.toFixed(0)}m
              </text>
            </g>
          )
        })}

        {/* forward polyline through offsets + travel */}
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
          opacity={corridor.method === 'one-way' ? 0.25 : 1}
          points={model.bwdPath.map((p) => `${xOf(p.d)},${yOf(p.t)}`).join(' ')}
        />

        <text x={W - pad.r} y={pad.t + 12} textAnchor="end" fill={colors.fwd} fontSize="9">
          → 上行
        </text>
        <text x={W - pad.r} y={pad.t + 24} textAnchor="end" fill={colors.bwd} fontSize="9">
          ← 下行
        </text>
        <text x={pad.l} y={H - 2} fill={colors.axis} fontSize="8">
          横轴：累计距离（m）· 纵轴：周期内时间（s）· 绿条：有效绿窗
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
          <div className="label">上行带宽</div>
          <div className="value">
            {model.forwardSec.toFixed(1)}
            <small style={{ fontSize: 11 }}> s</small>
          </div>
        </div>
        <div className="metric">
          <div className="label">下行带宽</div>
          <div className="value">
            {model.backwardSec.toFixed(1)}
            <small style={{ fontSize: 11 }}> s</small>
          </div>
        </div>
        <div className="metric">
          <div className="label">半周期 a</div>
          <div className="value">
            {model.halfA.toFixed(0)}
            <small style={{ fontSize: 11 }}> m</small>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildModel(corridor: BandCorridor, result?: BandResult | null) {
  const nodes = [...corridor.nodes].sort((a, b) => a.distanceM - b.distanceM)
  const C = nodes[0]?.cycleSec || 90
  const v = (corridor.speedKmh * 1000) / 3600
  const maxD = Math.max(...nodes.map((n) => n.distanceM), 1)
  const enriched = nodes.map((n) => ({
    ...n,
    greenSec: Math.max(1, n.greenRatio * (n.cycleSec || C)),
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
  // paths
  const fwdPath: { d: number; t: number }[] = []
  let t = ((enriched[0]?.offsetSec ?? 0) % C + C) % C
  for (let i = 0; i < enriched.length; i++) {
    if (i === 0) {
      fwdPath.push({ d: enriched[i].distanceM, t })
    } else {
      const travel = (enriched[i].distanceM - enriched[i - 1].distanceM) / Math.max(0.1, v)
      t = (t + travel) % C
      fwdPath.push({ d: enriched[i].distanceM, t })
    }
  }
  const bwdPath: { d: number; t: number }[] = []
  const last = enriched[enriched.length - 1]
  t = ((last?.offsetSec ?? 0) % C + C) % C
  for (let i = enriched.length - 1; i >= 0; i--) {
    if (i === enriched.length - 1) {
      bwdPath.push({ d: enriched[i].distanceM, t })
    } else {
      const travel = (enriched[i + 1].distanceM - enriched[i].distanceM) / Math.max(0.1, v)
      t = (t + travel) % C
      bwdPath.push({ d: enriched[i].distanceM, t })
    }
  }

  return {
    nodes: enriched,
    segments,
    maxD,
    C,
    fwdPath,
    bwdPath,
    ratio: result?.bandwidthRatio ?? 0,
    bandSec: result?.bandwidthSec ?? 0,
    forwardSec: result?.forwardBandwidthSec ?? result?.bandwidthSec ?? 0,
    backwardSec: result?.backwardBandwidthSec ?? 0,
    halfA: result?.halfCycleDistanceM ?? (v * C) / 2,
    stdV: result?.standardSpeedKmh ?? corridor.speedKmh,
  }
}
