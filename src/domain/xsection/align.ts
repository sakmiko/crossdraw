/**
 * Cross-section alignment: total width from components must match rebuild inputs.
 */
import type { Approach, CrossSection } from '../types'
import { buildCrossSection } from './build'

export function sectionTotalWidth(xs: CrossSection): number {
  return xs.components.reduce((s, c) => s + c.widthM, 0)
}

export function expectedSectionWidth(ap: Approach): number {
  const entry = ap.entryLanes.reduce((s, l) => s + l.widthM, 0)
  const exit = ap.exitLanes.reduce((s, l) => s + l.widthM, 0)
  const bike = ap.bikeEnabled ? ap.bikeWidthM : 0
  // sidewalk both sides in buildCrossSection
  return entry + exit + Math.max(0.3, ap.median.widthM) + ap.sidewalkWidthM * 2 + bike
}

export function sectionAlignsWithApproach(ap: Approach, eps = 1e-6): {
  ok: boolean
  built: number
  expected: number
  delta: number
} {
  const xs = buildCrossSection(ap)
  const built = sectionTotalWidth(xs)
  const expected = expectedSectionWidth(ap)
  const delta = Math.abs(built - expected)
  return { ok: delta <= eps, built, expected, delta }
}
