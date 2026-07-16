/**
 * Roundabout-oriented geometry helpers (engineering schematic).
 * Used by rebuild.drawRoundabout for multi-lane circulatory + yield/zebra.
 */
import type { Approach } from '../types'

export type RoundaboutLayout = {
  outerR: number
  innerR: number
  circulatoryWidth: number
  laneCount: number
  laneRadii: number[]
  entryThroatR: number
}

/** Derive circulatory radii from approach widths (data-linked). */
export function computeRoundaboutLayout(approaches: Approach[], core: number): RoundaboutLayout {
  const maxHalf = Math.max(
    10,
    ...approaches.map((a) => {
      const e = a.entryLanes.reduce((s, l) => s + l.widthM, 0)
      const x = a.exitLanes.reduce((s, l) => s + l.widthM, 0)
      return (e + x + a.median.widthM) / 2
    }),
  )
  // circulatory lanes: prefer 2 when any approach has ≥3 entry lanes
  const wide = approaches.some((a) => a.entryLanes.length >= 3)
  const laneCount = wide ? 2 : 1
  const laneW = 4.5
  const circulatoryWidth = laneCount * laneW
  const innerR = Math.max(8, Math.min(22, maxHalf * 0.55 + (wide ? 4 : 0)))
  const outerR = innerR + circulatoryWidth + 1.2
  const laneRadii: number[] = []
  for (let i = 0; i < laneCount; i++) {
    laneRadii.push(innerR + 0.6 + laneW * (i + 0.5))
  }
  return {
    outerR: Math.max(outerR, core + 6),
    innerR,
    circulatoryWidth,
    laneCount,
    laneRadii,
    entryThroatR: outerR + 2,
  }
}

export function roundaboutAnnotation(layout: RoundaboutLayout): string {
  return `环岛 · 内岛 r=${layout.innerR.toFixed(1)}m · 环道 ${layout.laneCount}×${(layout.circulatoryWidth / layout.laneCount).toFixed(1)}m`
}
