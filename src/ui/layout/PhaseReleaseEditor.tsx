/**
 * RoadGee-style movement release chips (U/L/T/R + ped) for signal phase editor.
 * Click toggles releases; icons are rounded stroke glyphs.
 */
import type { ReactNode } from 'react'
import type { Approach, Movement, Phase } from '@/domain/types'

const MOV_LABEL: Record<Movement, string> = {
  U: '掉头',
  L: '左转',
  T: '直行',
  R: '右转',
}

/** Minimal movement arrow glyph (24 viewBox). */
function MovGlyph({ m, size = 16 }: { m: Movement; size?: number }) {
  const common = {
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  let d: ReactNode
  if (m === 'T') {
    d = (
      <>
        <path d="M12 19 V6" {...common} />
        <path d="M8 10 L12 5 L16 10" {...common} />
      </>
    )
  } else if (m === 'L') {
    d = (
      <>
        <path d="M16 18 V11 Q16 7 12 7 H7" {...common} />
        <path d="M10 4 L6 7 L10 10" {...common} />
      </>
    )
  } else if (m === 'R') {
    d = (
      <>
        <path d="M8 18 V11 Q8 7 12 7 H17" {...common} />
        <path d="M14 4 L18 7 L14 10" {...common} />
      </>
    )
  } else {
    // U-turn
    d = (
      <>
        <path d="M9 18 V10 Q9 5 14 5 Q19 5 19 10 V14" {...common} />
        <path d="M16 11 L19 15 L22 11" {...common} />
      </>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="cd-icon mov-glyph" aria-hidden>
      {d}
    </svg>
  )
}

function PedGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="cd-icon mov-glyph" aria-hidden>
      <circle cx="12" cy="6" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 9 v4 M9 22 l3-9 3 9 M8 13 h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type PhaseReleaseEditorProps = {
  phase: Phase
  approaches: Approach[]
  onToggleRelease: (phaseId: string, approachId: string, m: Movement) => void
  onTogglePedestrian: (phaseId: string, approachId: string) => void
  onSetPedExclusive?: (phaseId: string, approachId: string, exclusive: boolean) => void
  /** show U-turn chip */
  includeU?: boolean
}

export function PhaseReleaseEditor({
  phase,
  approaches,
  onToggleRelease,
  onTogglePedestrian,
  onSetPedExclusive,
  includeU = true,
}: PhaseReleaseEditorProps) {
  const movs: Movement[] = includeU ? ['U', 'L', 'T', 'R'] : ['L', 'T', 'R']

  return (
    <div className="release-editor">
      <div className="release-editor-head">放行 · 机动车 / 行人</div>
      {approaches.map((ap) => {
        const pedOn = (phase.pedestrian ?? []).some((p) => p.approachId === ap.id)
        const pedEx = !!(phase.pedestrian ?? []).find((p) => p.approachId === ap.id)?.exclusive
        return (
          <div key={ap.id} className="release-row">
            <div className="release-ap-name" title={ap.name}>
              {ap.name.replace('进口', '') || ap.name}
            </div>
            <div className="release-chips">
              <span className="release-group-label">机动车</span>
              {movs.map((m) => {
                const on = (phase.releases[ap.id] ?? []).includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    className={`release-chip ${on ? 'on' : 'off'}`}
                    title={`${ap.name} ${MOV_LABEL[m]}`}
                    aria-pressed={on}
                    onClick={() => onToggleRelease(phase.id, ap.id, m)}
                  >
                    <MovGlyph m={m} size={15} />
                    <span className="release-chip-txt">{m}</span>
                  </button>
                )
              })}
              <span className="release-group-label">行人</span>
              <button
                type="button"
                className={`release-chip ped ${pedOn ? 'on' : 'off'}`}
                title={`${ap.name} 人行横道`}
                aria-pressed={pedOn}
                onClick={() => onTogglePedestrian(phase.id, ap.id)}
              >
                <PedGlyph size={15} />
                <span className="release-chip-txt">行人</span>
              </button>
              {pedOn && onSetPedExclusive && (
                <label className="release-ex" title="独占行人：人车冲突升为禁止">
                  <input
                    type="checkbox"
                    checked={pedEx}
                    onChange={(e) => onSetPedExclusive(phase.id, ap.id, e.target.checked)}
                  />
                  独占
                </label>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
