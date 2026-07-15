/**
 * Lightweight OSM basemap under the Pixi canvas.
 * Not a full GIS stack: uses a single static map tile/image centered on project lat/lng
 * (OpenStreetMap static-style via tile endpoint mosaic would be heavy; we use a simple
 * "staticmap" proxy-free approach: multiple tiles composed around center).
 *
 * For v0.5.13: 3x3 tile mosaic at fixed zoom, positioned under canvas with opacity.
 * Intersection geometry remains in local meters — basemap is contextual backdrop only.
 */
import { useEffect, useMemo, useState } from 'react'

const Z = 17
const TILE = 256

function lon2tile(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z))
}
function lat2tile(lat: number, z: number) {
  const r = (lat * Math.PI) / 180
  return Math.floor(
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z),
  )
}

export function BasemapLayer({
  enabled,
  latitude,
  longitude,
  opacity = 0.55,
  height = 640,
}: {
  enabled: boolean
  latitude: number
  longitude: number
  opacity?: number
  height?: number
}) {
  const [failed, setFailed] = useState(false)
  const tiles = useMemo(() => {
    const cx = lon2tile(longitude, Z)
    const cy = lat2tile(latitude, Z)
    const out: { x: number; y: number; url: string; col: number; row: number }[] = []
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        const x = cx + col
        const y = cy + row
        // OSM tile usage policy: identify app via URL path only; for production use your own tile server
        out.push({
          x,
          y,
          col: col + 1,
          row: row + 1,
          url: `https://tile.openstreetmap.org/${Z}/${x}/${y}.png`,
        })
      }
    }
    return out
  }, [latitude, longitude])

  useEffect(() => {
    setFailed(false)
  }, [latitude, longitude, enabled])

  if (!enabled) return null

  return (
    <div
      className="basemap-layer"
      style={{
        position: 'absolute',
        inset: 0,
        height,
        overflow: 'hidden',
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
        background: '#1a2332',
      }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: TILE * 3,
          height: TILE * 3,
          transform: 'translate(-50%, -50%)',
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${TILE}px)`,
          gridTemplateRows: `repeat(3, ${TILE}px)`,
        }}
      >
        {tiles.map((t) => (
          <img
            key={`${t.x}-${t.y}`}
            src={t.url}
            alt=""
            width={TILE}
            height={TILE}
            style={{ display: 'block', filter: 'grayscale(0.15) contrast(0.95)' }}
            onError={() => setFailed(true)}
            referrerPolicy="no-referrer"
          />
        ))}
      </div>
      <div className="basemap-badge">
        {failed ? '底图加载失败（网络/瓦片策略）' : `OSM 底图示意 · z${Z} · ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
        <span> · 非测绘级 · © OpenStreetMap</span>
      </div>
    </div>
  )
}
