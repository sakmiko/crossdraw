/**
 * Interactive signal timing board — phase faces + G/Y/AR bars on cycle C.
 * Drag green segment right edge to edit greenSec (homology with phase table).
 * Engineering schematic — not a full NEMA controller.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Approach, Phase, SignalScheme } from '@/domain/types'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'
import { roadgeePhaseFaceSvg } from '@/ui/charts/roadgeeSignalBoard'

export type InteractiveSignalBoardProps = {
  approaches: Approach[]
  signal: SignalScheme
  width?: number
  faceSize?: number
  focusPhaseId?: string | null
  onFocusPhase?: (id: string) => void
  onUpdatePhaseTiming?: (
    phaseId: string,
    patch: Partial<{ greenSec: number; yellowSec: number; allRedSec: number }>,
  ) => void
}

function fmt(n: number) {
  return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : '—'
}

export function InteractiveSignalBoard({
  approaches,
  signal,
  width: widthProp,
  faceSize: faceSizeProp,
  focusPhaseId,
  onFocusPhase,
  onUpdatePhaseTiming,
}: InteractiveSignalBoardProps) {
  const al = useMemo(() => buildSignalTimingAlignment(signal), [signal])
  const main = useMemo(() => signal.phases.filter((p) => !p.isOverlap), [signal.phases])
  const C = Math.max(1, al.cycleSec)
  const n = Math.max(1, main.length)
  const faceSize = faceSizeProp ?? Math.min(112, Math.max(72, Math.floor((widthProp ?? 900) / 8)))
  const width = widthProp ?? Math.max(520, n * (faceSize + 20) + 48)
  const barRowH = 30
  const left = 92
  const padR = 16
  const scale = (width - left - padR) / C

  const dragRef = useRef<{
    phaseId: string
    startX: number
    startG: number
  } | null>(null)
  const [dragG, setDragG] = useState<Record<string, number>>({})

  const greenOf = useCallback(
    (ph: Phase) => (dragG[ph.id] != null ? dragG[ph.id] : ph.greenSec),
    [dragG],
  )

  const onPointerDown = (e: React.PointerEvent, ph: Phase) => {
    if (!onUpdatePhaseTiming) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current = { phaseId: ph.id, startX: e.clientX, startG: greenOf(ph) }
    onFocusPhase?.(ph.id)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dSec = dx / scale
    const next = Math.max(1, Math.min(C - 1, Math.round((d.startG + dSec) * 2) / 2))
    setDragG((m) => ({ ...m, [d.phaseId]: next }))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    const g = dragG[d.phaseId]
    if (g != null && onUpdatePhaseTiming) {
      onUpdatePhaseTiming(d.phaseId, { greenSec: g })
    }
    setDragG((m) => {
      const n = { ...m }
      delete n[d.phaseId]
      return n
    })
    try {
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  let cursor = 0
  const rows = main.map((ph, i) => {
    const gSec = greenOf(ph)
    const ySec = ph.yellowSec
    const arSec = ph.allRedSec
    const x0 = left + cursor * scale
    const gW = Math.max(4, gSec * scale)
    const yW = Math.max(0, ySec * scale)
    const arW = Math.max(0, arSec * scale)
    const y = 8 + i * barRowH
    const lambda = C > 0 ? gSec / C : 0
    const active = focusPhaseId === ph.id
    cursor += gSec + ySec + arSec
    return { ph, i, x0, gW, yW, arW, y, lambda, active, gSec }
  })

  const barAreaH = n * barRowH + 28
  const faceRowH = faceSize + 36
  const totalH = 40 + faceRowH + barAreaH

  return (
    <div
      className="interactive-signal-board"
      style={{ width: '100%', maxWidth: width, userSelect: 'none' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="isb-head">
        <b>有信号控制 · 相位灯态</b>
        <span className="muted">
          C={fmt(C)}s · {al.closed ? '闭合' : '未闭合'} · 拖绿条右缘改 G
        </span>
      </div>

      <div className="isb-faces" style={{ gap: 16 }}>
        {main.map((ph, i) => {
          const face = roadgeePhaseFaceSvg(approaches, ph, { size: faceSize })
          const gSec = greenOf(ph)
          const active = focusPhaseId === ph.id
          return (
            <button
              key={ph.id}
              type="button"
              className={`isb-face ${active ? 'is-active' : ''}`}
              onClick={() => onFocusPhase?.(ph.id)}
              title={`选中相位 ${ph.name}`}
            >
              <div
                className="isb-face-svg"
                style={{ width: faceSize, height: faceSize }}
                dangerouslySetInnerHTML={{ __html: face }}
              />
              <div className="isb-face-cap">
                第{i + 1}相位 · {fmt(gSec)}s
              </div>
              <div className="isb-face-sub muted">{ph.name.slice(0, 12)}</div>
            </button>
          )
        })}
      </div>

      <svg
        className="isb-bars chart-svg chart-svg--pro"
        viewBox={`0 0 ${width} ${barAreaH + 20}`}
        width="100%"
        role="img"
        aria-label="配时条 可拖拽绿信比"
      >
        <line x1={left} y1={4} x2={width - padR} y2={4} stroke="var(--border-strong)" />
        {Array.from({ length: Math.floor(C / (C <= 60 ? 10 : 20)) + 1 }, (_, k) => {
          const t = k * (C <= 60 ? 10 : 20)
          if (t > C + 0.01) return null
          const x = left + t * scale
          return (
            <g key={t}>
              <line x1={x} y1={0} x2={x} y2={8} stroke="var(--muted)" />
              <text x={x} y={18} textAnchor="middle" fill="var(--muted)" fontSize={9}>
                {fmt(t)}
              </text>
            </g>
          )
        })}
        {rows.map(({ ph, i, x0, gW, yW, arW, y, lambda, active, gSec }) => (
          <g key={ph.id}>
            <text x={8} y={y + 18} fill="var(--text-secondary)" fontSize={10}>
              第{i + 1} λ:{lambda.toFixed(2)}
            </text>
            <rect
              x={left}
              y={y + 6}
              width={C * scale}
              height={16}
              fill="var(--block-soft)"
              opacity={0.85}
              rx={2}
            />
            <rect
              x={x0}
              y={y + 6}
              width={gW}
              height={16}
              fill="var(--ok)"
              rx={2}
              opacity={active ? 1 : 0.92}
              style={{ cursor: onUpdatePhaseTiming ? 'ew-resize' : 'default' }}
              onPointerDown={(e) => onPointerDown(e as unknown as React.PointerEvent, ph)}
            />
            {gW > 16 ? (
              <text
                x={x0 + gW / 2}
                y={y + 18}
                textAnchor="middle"
                fill="#052e16"
                fontSize={10}
                fontWeight={700}
                pointerEvents="none"
              >
                {fmt(gSec)}
              </text>
            ) : null}
            <rect x={x0 + gW} y={y + 6} width={Math.max(1, yW)} height={16} fill="var(--warn)" rx={1} />
            {arW > 0.5 ? (
              <rect
                x={x0 + gW + yW}
                y={y + 6}
                width={arW}
                height={16}
                fill="var(--block)"
                rx={1}
              />
            ) : null}
            {/* drag handle */}
            {onUpdatePhaseTiming ? (
              <rect
                x={x0 + gW - 4}
                y={y + 4}
                width={8}
                height={20}
                fill="var(--accent)"
                opacity={0.85}
                rx={2}
                style={{ cursor: 'ew-resize' }}
                onPointerDown={(e) => onPointerDown(e as unknown as React.PointerEvent, ph)}
              />
            ) : null}
          </g>
        ))}
      </svg>
      <p className="isb-foot muted">绿=G · 黄=Y · 红底=周期 · 拖绿条改 G · 与相位表同源</p>
    </div>
  )
}
