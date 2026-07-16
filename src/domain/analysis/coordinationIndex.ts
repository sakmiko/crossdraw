/**
 * Coordination / progression quality indices for a band corridor.
 */
import type { BandCorridor, BandResult } from '../types'
import { measureCorridor } from './corridor'

export type CoordinationIndex = {
  bandwidthRatio: number
  twoWayBalance: number
  /** 0–100 score combining ratio and balance */
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  notes: string[]
}

export function gradeFromScore(score: number): CoordinationIndex['grade'] {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  if (score >= 25) return 'E'
  return 'F'
}

export function computeCoordinationIndex(corridor: BandCorridor, result?: BandResult): CoordinationIndex {
  const r = result ?? measureCorridor(corridor)
  const br = r.bandwidthRatio
  const fwd = r.forwardBandwidthSec ?? r.bandwidthSec
  const bwd = r.backwardBandwidthSec ?? 0
  const sum = fwd + bwd || 1
  const balance = 1 - Math.abs(fwd - bwd) / sum
  const score = Math.max(0, Math.min(100, br * 100 * 0.7 + balance * 100 * 0.3))
  const notes = [
    `带宽比 ${(br * 100).toFixed(1)}%`,
    `上下行均衡 ${(balance * 100).toFixed(0)}%`,
    '协调指数为工程合成指标，非国标分级',
  ]
  return { bandwidthRatio: br, twoWayBalance: balance, score, grade: gradeFromScore(score), notes }
}
