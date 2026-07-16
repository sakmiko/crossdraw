import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { Mesh, MeshPoly } from '@/domain/types'
import { useAppStore } from '@/state/store'

export type LayerKey = MeshPoly['layer']

export type LayerVisibility = Record<LayerKey, boolean>

export const DEFAULT_LAYERS: LayerVisibility = {
  FRAME: true,
  ROAD: true,
  MARKING: true,
  ISLAND: true,
  FLOW: true,
  ANNO: true,
}

export type CanvasHandle = {
  fitView: () => void
  zoomBy: (factor: number) => void
  zoomIn: () => void
  zoomOut: () => void
  getZoom: () => number
}

type Props = {
  mesh: Mesh
  selectedApproachId?: string | null
  height?: number
  layers?: LayerVisibility
}

export const CanvasView = forwardRef<CanvasHandle, Props>(function CanvasView(
  { mesh, selectedApproachId, height = 640, layers = DEFAULT_LAYERS },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const worldRef = useRef<Container | null>(null)
  const meshRef = useRef(mesh)
  const layersRef = useRef(layers)
  const selectedRef = useRef(selectedApproachId)
  const theme = useAppStore((s) => s.theme)

  meshRef.current = mesh
  layersRef.current = layers
  selectedRef.current = selectedApproachId

  const fitView = () => {
    const host = hostRef.current
    const world = worldRef.current
    if (!host || !world) return
    const b = meshRef.current.bbox
    const mw = Math.max(1, b.maxX - b.minX)
    const mh = Math.max(1, b.maxY - b.minY)
    const pad = 0.92
    const sx = (host.clientWidth * pad) / mw
    const sy = (host.clientHeight * pad) / mh
    const next = Math.min(4, Math.max(0.2, Math.min(sx, sy)))
    world.scale.set(next)
    world.x = host.clientWidth / 2 - ((b.minX + b.maxX) / 2) * next
    world.y = host.clientHeight / 2 - ((b.minY + b.maxY) / 2) * next
  }

  const zoomBy = (factor: number) => {
    const host = hostRef.current
    const world = worldRef.current
    if (!host || !world) return
    const scale = world.scale.x
    const next = Math.min(4, Math.max(0.15, scale * factor))
    const mx = host.clientWidth / 2
    const my = host.clientHeight / 2
    const wx = (mx - world.x) / scale
    const wy = (my - world.y) / scale
    world.scale.set(next)
    world.x = mx - wx * next
    world.y = my - wy * next
  }

  useImperativeHandle(
    ref,
    () => ({
      fitView,
      zoomBy,
      zoomIn: () => zoomBy(1.15),
      zoomOut: () => zoomBy(1 / 1.15),
      getZoom: () => worldRef.current?.scale.x ?? 1,
    }),
    [],
  )

  useEffect(() => {
    let destroyed = false
    const host = hostRef.current
    if (!host) return
    let cleanup: (() => void) | undefined

    const app = new Application()
    ;(async () => {
      await app.init({
        background: theme === 'light' ? '#d7dee8' : '#0a0e14',
        backgroundAlpha: 0.88,
        antialias: true,
        resizeTo: host,
        resolution: Math.min(window.devicePixelRatio || 1, 3),
        autoDensity: true,
      })
      if (destroyed) {
        app.destroy(true)
        return
      }
      host.innerHTML = ''
      host.appendChild(app.canvas)
      const world = new Container()
      app.stage.addChild(world)
      appRef.current = app
      worldRef.current = world

      let dragging = false
      let lastX = 0
      let lastY = 0
      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const scale = world.scale.x
        const next = Math.min(4, Math.max(0.15, scale * (e.deltaY > 0 ? 0.9 : 1.1)))
        const rect = app.canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const wx = (mx - world.x) / scale
        const wy = (my - world.y) / scale
        world.scale.set(next)
        world.x = mx - wx * next
        world.y = my - wy * next
      }
      const onDown = (e: PointerEvent) => {
        if (e.button === 1 || e.button === 0) {
          dragging = true
          lastX = e.clientX
          lastY = e.clientY
        }
      }
      const onMove = (e: PointerEvent) => {
        if (!dragging) return
        world.x += e.clientX - lastX
        world.y += e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY
      }
      const onUp = () => {
        dragging = false
      }
      app.canvas.addEventListener('wheel', onWheel, { passive: false })
      app.canvas.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)

      drawMesh(world, meshRef.current, selectedRef.current, layersRef.current)
      // fit
      const b = meshRef.current.bbox
      const mw = Math.max(1, b.maxX - b.minX)
      const mh = Math.max(1, b.maxY - b.minY)
      const pad = 0.92
      const sx = (host.clientWidth * pad) / mw
      const sy = (host.clientHeight * pad) / mh
      const next = Math.min(4, Math.max(0.2, Math.min(sx, sy)))
      world.scale.set(next)
      world.x = host.clientWidth / 2 - ((b.minX + b.maxX) / 2) * next
      world.y = host.clientHeight / 2 - ((b.minY + b.maxY) / 2) * next

      cleanup = () => {
        app.canvas.removeEventListener('wheel', onWheel)
        app.canvas.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
    })()

    return () => {
      destroyed = true
      cleanup?.()
      appRef.current?.destroy(true)
      appRef.current = null
      worldRef.current = null
      if (host) host.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  useEffect(() => {
    const world = worldRef.current
    if (!world) return
    drawMesh(world, mesh, selectedApproachId, layers)
  }, [mesh, selectedApproachId, layers])

  return (
    <div
      ref={hostRef}
      id="canvas-root"
      className="canvas-host"
      style={{ width: '100%', height }}
      aria-label="交叉口画布"
    />
  )
})

function drawMesh(
  world: Container,
  mesh: Mesh,
  selectedApproachId?: string | null,
  layers: LayerVisibility = DEFAULT_LAYERS,
) {
  world.removeChildren()
  const g = new Graphics()
  world.addChild(g)

  for (const p of mesh.polygons) {
    if (layers[p.layer] === false) continue
    if (p.points.length < 3) continue
    const selected = selectedApproachId && p.meta?.approachId === selectedApproachId
    g.poly(p.points.flatMap(([x, y]) => [x, y]))
    g.fill({ color: p.fill ?? '#666', alpha: p.alpha ?? (selected ? 1 : 0.95) })
    if (p.stroke) {
      g.stroke({
        width: (p.strokeWidth ?? 0.3) * (selected ? 1.8 : 1),
        color: selected ? '#38bdf8' : p.stroke,
      })
    } else if (selected) {
      g.stroke({ width: 0.5, color: '#38bdf8' })
    }
  }

  for (const l of mesh.polylines) {
    if (layers[l.layer] === false) continue
    if (l.points.length < 2) continue
    g.moveTo(l.points[0][0], l.points[0][1])
    for (let i = 1; i < l.points.length; i++) g.lineTo(l.points[i][0], l.points[i][1])
    g.stroke({
      width: l.strokeWidth ?? 0.3,
      color: l.stroke ?? '#fff',
      alpha: l.alpha ?? 0.95,
    })
  }

  if (layers.ANNO !== false) {
    const style = new TextStyle({
      fill: '#e2e8f0',
      fontSize: 12,
      fontFamily: 'IBM Plex Sans, ui-sans-serif, system-ui, sans-serif',
      fontWeight: '600',
    })
    for (const lb of mesh.labels) {
      const t = new Text({ text: lb.text, style: style.clone() })
      t.style.fill = lb.color ?? '#e2e8f0'
      t.style.fontSize = (lb.size ?? 3.5) * 3.2
      t.anchor.set(lb.align === 'center' ? 0.5 : lb.align === 'right' ? 1 : 0, 0.5)
      t.x = lb.at[0]
      t.y = lb.at[1]
      world.addChild(t)
    }
  }
}

export async function meshToPngBlob(mesh: Mesh, scale = 2): Promise<Blob> {
  const app = new Application()
  const w = Math.ceil((mesh.bbox.maxX - mesh.bbox.minX + 40) * scale)
  const h = Math.ceil((mesh.bbox.maxY - mesh.bbox.minY + 40) * scale)
  await app.init({
    width: Math.max(200, w),
    height: Math.max(200, h),
    background: '#e8eef5',
    antialias: true,
  })
  const world = new Container()
  app.stage.addChild(world)
  world.scale.set(scale)
  world.x = -mesh.bbox.minX * scale + 20 * scale
  world.y = -mesh.bbox.minY * scale + 20 * scale
  drawMesh(world, mesh, null, DEFAULT_LAYERS)
  const blob = await new Promise<Blob>((resolve, reject) => {
    app.canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  app.destroy(true)
  return blob
}
