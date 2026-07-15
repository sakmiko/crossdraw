import type { Approach, CrossSection, CrossSectionComponent } from '../types'

export function approachHash(ap: Approach): string {
  return JSON.stringify({
    e: ap.entryLanes.map((l) => l.widthM),
    x: ap.exitLanes.map((l) => l.widthM),
    m: ap.median,
    s: ap.sidewalkWidthM,
    b: ap.bikeEnabled ? ap.bikeWidthM : 0,
  })
}

export function buildCrossSection(ap: Approach): CrossSection {
  const components: CrossSectionComponent[] = []
  if (ap.sidewalkWidthM > 0) {
    components.push({
      type: 'sidewalk',
      widthM: ap.sidewalkWidthM,
      label: '人行道',
      color: '#d6d3d1',
    })
  }
  if (ap.bikeEnabled) {
    components.push({
      type: 'bike',
      widthM: ap.bikeWidthM,
      label: '非机动车道',
      color: '#6ee7b7',
    })
  }
  ap.entryLanes.forEach((ln, i) => {
    components.push({
      type: 'vehicle',
      widthM: ln.widthM,
      label: `进口车道${i + 1}`,
      color: i % 2 === 0 ? '#6b7280' : '#4b5563',
    })
  })
  components.push({
    type: 'median',
    widthM: Math.max(0.3, ap.median.widthM),
    label: '中分带',
    color: ap.median.style === 'greenBelt' ? '#86efac' : '#fbbf24',
  })
  ap.exitLanes.forEach((ln, i) => {
    components.push({
      type: 'vehicle',
      widthM: ln.widthM,
      label: `出口车道${i + 1}`,
      color: i % 2 === 0 ? '#78716c' : '#57534e',
    })
  })
  if (ap.sidewalkWidthM > 0) {
    components.push({
      type: 'sidewalk',
      widthM: ap.sidewalkWidthM,
      label: '人行道',
      color: '#d6d3d1',
    })
  }
  return {
    approachId: ap.id,
    components,
    sourceHash: approachHash(ap),
    stale: false,
  }
}

export function markStaleIfNeeded(xs: CrossSection, ap: Approach): CrossSection {
  const h = approachHash(ap)
  if (h !== xs.sourceHash) return { ...xs, stale: true }
  return xs
}
