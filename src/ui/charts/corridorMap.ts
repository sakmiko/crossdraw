/**
 * Corridor map skeleton — schematic polyline of band nodes with optional WGS84 labels.
 * Professional engineering diagram (not a tile basemap).
 */
import type { BandCorridor } from '@/domain/types'
import { CHART_COLORS, escapeXml } from './chartStandards'

function hasGeo(c: BandCorridor): boolean {
  return c.nodes.some((n) => n.lat != null && n.lon != null)
}

export function corridorMapSvg(
  corridor: BandCorridor,
  opts: {
    width?: number
    height?: number
    activeId?: string
    bandwidthRatio?: number
  } = {},
): string {
  const width = opts.width ?? 420
  const height = opts.height ?? 220
  const pad = 28
  const nodes = [...corridor.nodes].sort((a, b) => a.distanceM - b.distanceM)
  if (nodes.length < 1) {
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><text x="12" y="24" fill="#94a3b8">无走廊节点</text></svg>`
  }

  // Project: prefer lat/lon if present, else 1D station along X
  const useGeo = hasGeo(corridor)
  let pts: { x: number; y: number; n: (typeof nodes)[0] }[] = []

  if (useGeo) {
    const lats = nodes.map((n) => n.lat ?? 0)
    const lons = nodes.map((n) => n.lon ?? 0)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const dLat = Math.max(1e-6, maxLat - minLat)
    const dLon = Math.max(1e-6, maxLon - minLon)
    // aspect-correct-ish in panel
    const plotW = width - pad * 2
    const plotH = height - pad * 2 - 20
    pts = nodes.map((n) => {
      const lon = n.lon ?? minLon
      const lat = n.lat ?? minLat
      const x = pad + ((lon - minLon) / dLon) * plotW
      const y = pad + 18 + (1 - (lat - minLat) / dLat) * plotH
      return { x, y, n }
    })
  } else {
    const maxD = Math.max(1, nodes[nodes.length - 1].distanceM)
    const plotW = width - pad * 2
    const midY = height * 0.52
    pts = nodes.map((n) => ({
      x: pad + (n.distanceM / maxD) * plotW,
      y: midY,
      n,
    }))
  }

  let g = ''
  g += `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${CHART_COLORS.bg}" stroke="${CHART_COLORS.grid}"/>`
  g += `<text x="14" y="18" fill="${CHART_COLORS.axis}" font-size="12" font-weight="700" font-family="system-ui,sans-serif">走廊选点示意 · ${escapeXml(corridor.name)}</text>`
  g += `<text x="14" y="32" fill="${CHART_COLORS.muted}" font-size="9.5" font-family="system-ui,sans-serif">${useGeo ? 'WGS84 节点投影（示意，非测绘底图）' : '桩号一维展开 · 可在节点表填写 lat/lon 升级为平面示意'} · ${corridor.speedKmh} km/h · ${escapeXml(String(corridor.method))}</text>`

  // soft path halo
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  g += `<path d="${pathD}" fill="none" stroke="#0ea5e9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.15"/>`
  g += `<path d="${pathD}" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`

  // distance ticks along polyline
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    const len = Math.max(0, b.n.distanceM - a.n.distanceM)
    g += `<text x="${mx}" y="${my - 8}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="8.5" font-family="system-ui,sans-serif">${len.toFixed(0)} m</text>`
  }

  pts.forEach((p, i) => {
    const active = opts.activeId ? p.n.id === opts.activeId : i === 0
    const r = active ? 7 : 5.5
    g += `<circle cx="${p.x}" cy="${p.y}" r="${r + 3}" fill="rgba(56,189,248,0.12)"/>`
    g += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${active ? '#0ea5e9' : '#1e293b'}" stroke="#e2e8f0" stroke-width="1.5"/>`
    g += `<text x="${p.x}" y="${p.y + 3}" text-anchor="middle" fill="#f8fafc" font-size="8" font-weight="700" font-family="system-ui,sans-serif">${i + 1}</text>`
    const labelY = p.y + (useGeo ? (i % 2 === 0 ? -14 : 18) : -14)
    g += `<text x="${p.x}" y="${labelY}" text-anchor="middle" fill="${CHART_COLORS.axis}" font-size="10" font-weight="600" font-family="system-ui,sans-serif">${escapeXml(p.n.name)}</text>`
    if (p.n.lat != null && p.n.lon != null) {
      g += `<text x="${p.x}" y="${labelY + 11}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="7.5" font-family="ui-monospace,monospace">${p.n.lat.toFixed(4)}, ${p.n.lon.toFixed(4)}</text>`
    } else {
      g += `<text x="${p.x}" y="${labelY + 11}" text-anchor="middle" fill="${CHART_COLORS.muted}" font-size="7.5" font-family="system-ui,sans-serif">K+${p.n.distanceM.toFixed(0)}</text>`
    }
  })

  if (opts.bandwidthRatio != null) {
    g += `<text x="${width - 14}" y="${height - 10}" text-anchor="end" fill="#34d399" font-size="10" font-weight="600" font-family="system-ui,sans-serif">带宽比 ${(opts.bandwidthRatio * 100).toFixed(1)}%</text>`
  }

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg chart-svg--pro">${g}</svg>`
}
