/**
 * Lost time L ≈ n * ℓ + R (Webster-style).
 */
export function websterLostTime(opts: {
  mainPhaseCount: number
  lostPerPhaseSec?: number
  allRedTotalSec?: number
}): { L: number; notes: string[] } {
  const n = Math.max(1, opts.mainPhaseCount)
  const ell = opts.lostPerPhaseSec ?? 3
  const R = opts.allRedTotalSec ?? 0
  const L = n * ell + R
  return {
    L,
    notes: [`L = n×ℓ + R = ${n}×${ell} + ${R} = ${L}s`, 'Webster 损失时间示意'],
  }
}

export function websterOptimalCycle(Y: number, L: number): number {
  const y = Math.min(0.9, Math.max(0.05, Y))
  const C = (1.5 * L + 5) / (1 - y)
  return Math.max(40, Math.min(180, Math.round(C)))
}
