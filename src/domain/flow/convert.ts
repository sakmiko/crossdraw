import type { Approach, FlowScheme, TurnVolumes } from '../types'

export interface PeakVolumes {
  approachId: string
  natural: TurnVolumes
  pcu: TurnVolumes
  peak: TurnVolumes
  totalPeak: number
}

export function convertVolumes(flow: FlowScheme, approachIds: string[]): PeakVolumes[] {
  const heavy = flow.heavyRatio
  const pce = flow.pce
  const phf = flow.phf <= 0 ? 1 : flow.phf
  const factor = 1 + heavy * (pce - 1)

  return approachIds.map((id) => {
    const natural = flow.volumes[id] ?? { U: 0, L: 0, T: 0, R: 0 }
    const pcu: TurnVolumes = {
      U: natural.U * (heavy === 0 ? 1 : factor),
      L: natural.L * (heavy === 0 ? 1 : factor),
      T: natural.T * (heavy === 0 ? 1 : factor),
      R: natural.R * (heavy === 0 ? 1 : factor),
    }
    const peak: TurnVolumes = {
      U: pcu.U / phf,
      L: pcu.L / phf,
      T: pcu.T / phf,
      R: pcu.R / phf,
    }
    return {
      approachId: id,
      natural,
      pcu,
      peak,
      totalPeak: peak.U + peak.L + peak.T + peak.R,
    }
  })
}

export function buildFlowMesh(
  approaches: Approach[],
  flow: FlowScheme,
): { arrows: { approachId: string; movement: keyof TurnVolumes; width: number; volume: number }[] } {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const maxV = Math.max(1, ...peaks.flatMap((p) => [p.peak.U, p.peak.L, p.peak.T, p.peak.R]))
  const arrows: { approachId: string; movement: keyof TurnVolumes; width: number; volume: number }[] = []
  for (const p of peaks) {
    for (const m of ['U', 'L', 'T', 'R'] as const) {
      const v = p.peak[m]
      if (v <= 0) continue
      const width =
        flow.style.minWidth +
        ((flow.style.maxWidth - flow.style.minWidth) * v) / maxV
      arrows.push({ approachId: p.approachId, movement: m, width, volume: v })
    }
  }
  return { arrows }
}
