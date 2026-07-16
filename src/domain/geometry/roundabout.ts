/**
 * Roundabout layout — engineering schematic (not full FHWA/CJJ library).
 * Continuous circular island + annular circulatory + teardrop splitters.
 */
import type { Approach } from '../types'

export type RoundaboutLayout = {
  /** Outer edge of circulatory asphalt (ICD/2 approx) */
  outerR: number
  /** Central island curb radius (excluding truck apron) */
  islandR: number
  /** Truck apron outer radius (mountable, around island) */
  apronOuterR: number
  /** Alias for island curb — used by legacy callers as innerR */
  innerR: number
  circulatoryWidth: number
  laneCount: number
  /** Mid-radius of each circulatory lane (for dashed lane lines) */
  laneRadii: number[]
  entryThroatR: number
  /** Inscribed circle diameter (2 * outerR) */
  icdM: number
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
  // 2 circulatory lanes when any approach has ≥3 entry lanes
  const wide = approaches.some((a) => a.entryLanes.length >= 3)
  const laneCount = wide ? 2 : 1
  const laneW = 4.6
  const circulatoryWidth = laneCount * laneW
  const apronW = 2.0
  // Central landscaped island (circular). Scale gently with approach half-width.
  const islandR = Math.max(10, Math.min(26, maxHalf * 0.62 + (wide ? 5 : 2)))
  const apronOuterR = islandR + apronW
  // outer edge of circulating asphalt
  let outerR = apronOuterR + circulatoryWidth + 0.8
  outerR = Math.max(outerR, core + 10, islandR + 12)
  const laneRadii: number[] = []
  for (let i = 0; i < laneCount; i++) {
    laneRadii.push(apronOuterR + 0.4 + laneW * (i + 0.5))
  }
  return {
    outerR,
    islandR,
    apronOuterR,
    innerR: islandR,
    circulatoryWidth,
    laneCount,
    laneRadii,
    entryThroatR: outerR + 3,
    icdM: outerR * 2,
  }
}

export function roundaboutAnnotation(layout: RoundaboutLayout): string {
  const lw = layout.circulatoryWidth / layout.laneCount
  return `环岛 · 内岛 r=${layout.islandR.toFixed(1)}m · 环道 ${layout.laneCount}×${lw.toFixed(1)}m · ICD≈${layout.icdM.toFixed(0)}m`
}
