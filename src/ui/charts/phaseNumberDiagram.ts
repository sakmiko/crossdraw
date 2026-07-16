/**
 * Professional dual-ring / NEMA-style phase number diagram (static SVG).
 */
import type { SignalScheme } from '@/domain/types'
import { buildDualRingStages, isDualRingEnabled } from '@/domain/signal/dualRing'
import { CHART_COLORS, escapeXml } from '@/ui/charts/chartStandards'

export function dualRingPhaseNumberSvg(signal: SignalScheme, width = 420): string {
  const h = 160
  if (!isDualRingEnabled(signal)) {
    return `<svg viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg" class="chart-svg"><text x="16" y="40" fill="${CHART_COLORS.muted}" font-size="12">未启用双环</text></svg>`
  }
  const stages = buildDualRingStages(signal)
  let g = `<rect width="100%" height="100%" rx="8" fill="${CHART_COLORS.bg}" stroke="${CHART_COLORS.grid}"/>`
  g += `<text x="14" y="20" fill="${CHART_COLORS.axis}" font-size="12" font-weight="700">双环相位序</text>`
  const colW = Math.min(90, (width - 40) / Math.max(1, stages.length))
  stages.forEach((st, i) => {
    const x = 20 + i * colW
    g += `<rect x="${x}" y="36" width="${colW - 8}" height="100" rx="6" fill="rgba(14,165,233,0.08)" stroke="${CHART_COLORS.grid}"/>`
    g += `<text x="${x + (colW - 8) / 2}" y="52" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="10">B${st.barrierIndex}</text>`
    const r1 = st.ring1.map((p) => p.name.replace(/相位|南北|东西/g, '').slice(0, 6)).join('/')
    const r2 = st.ring2.map((p) => p.name.replace(/相位|南北|东西/g, '').slice(0, 6)).join('/')
    g += `<text x="${x + (colW - 8) / 2}" y="80" text-anchor="middle" fill="#34d399" font-size="10" font-weight="600">R1</text>`
    g += `<text x="${x + (colW - 8) / 2}" y="96" text-anchor="middle" fill="${CHART_COLORS.axis}" font-size="9">${escapeXml(r1 || '—')}</text>`
    g += `<text x="${x + (colW - 8) / 2}" y="118" text-anchor="middle" fill="#f472b6" font-size="10" font-weight="600">R2</text>`
    g += `<text x="${x + (colW - 8) / 2}" y="134" text-anchor="middle" fill="${CHART_COLORS.axis}" font-size="9">${escapeXml(r2 || '—')}</text>`
  })
  return `<svg viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">${g}</svg>`
}
