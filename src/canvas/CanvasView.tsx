import { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { Mesh } from '@/domain/types'

type Props = {
  mesh: Mesh
  selectedApproachId?: string | null
  height?: number
}

export function CanvasView({ mesh, selectedApproachId, height = 640 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const worldRef = useRef<Container | null>(null)

  useEffect(() => {
    let destroyed = false
    const host = hostRef.current
    if (!host) return

    const app = new Application()
    ;(async () => {
      await app.init({
        background: '#0b1220',
        antialias: true,
        resizeTo: host,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
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

      // pan/zoom
      let dragging = false
      let lastX = 0
      let lastY = 0
      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const scale = world.scale.x
        const next = Math.min(4, Math.max(0.15, scale * (e.deltaY > 0 ? 0.9 : 1.1)))
        world.scale.set(next)
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

      // initial center
      world.x = host.clientWidth / 2
      world.y = host.clientHeight / 2
      world.scale.set(2.2)

      drawMesh(world, mesh, selectedApproachId)

      return () => {
        app.canvas.removeEventListener('wheel', onWheel)
        app.canvas.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
    })()

    return () => {
      destroyed = true
      appRef.current?.destroy(true)
      appRef.current = null
      worldRef.current = null
      if (host) host.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const world = worldRef.current
    if (!world) return
    drawMesh(world, mesh, selectedApproachId)
  }, [mesh, selectedApproachId])

  return (
    <div
      ref={hostRef}
      id="canvas-root"
      style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px #1e293b' }}
    />
  )
}

function drawMesh(world: Container, mesh: Mesh, selectedApproachId?: string | null) {
  world.removeChildren()
  const g = new Graphics()
  world.addChild(g)

  for (const p of mesh.polygons) {
    if (p.points.length < 3) continue
    const selected =
      selectedApproachId && p.meta?.approachId === selectedApproachId
    g.poly(p.points.flatMap(([x, y]) => [x, y]))
    g.fill({ color: p.fill ?? '#666', alpha: p.alpha ?? (selected ? 1 : 0.95) })
    if (p.stroke) {
      g.stroke({ width: (p.strokeWidth ?? 0.3) * (selected ? 1.8 : 1), color: selected ? '#38bdf8' : p.stroke })
    } else if (selected) {
      g.stroke({ width: 0.5, color: '#38bdf8' })
    }
  }

  for (const l of mesh.polylines) {
    if (l.points.length < 2) continue
    g.moveTo(l.points[0][0], l.points[0][1])
    for (let i = 1; i < l.points.length; i++) g.lineTo(l.points[i][0], l.points[i][1])
    g.stroke({
      width: l.strokeWidth ?? 0.3,
      color: l.stroke ?? '#fff',
      alpha: 0.95,
    })
  }

  const style = new TextStyle({
    fill: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: '600',
  })
  for (const lb of mesh.labels) {
    const t = new Text({ text: lb.text, style: style.clone() })
    t.style.fill = lb.color ?? '#e2e8f0'
    t.style.fontSize = (lb.size ?? 3.5) * 3.2
    t.anchor.set(lb.align === 'center' ? 0.5 : 0, 0.5)
    t.x = lb.at[0]
    t.y = lb.at[1]
    world.addChild(t)
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
  drawMesh(world, mesh, null)
  const blob = await new Promise<Blob>((resolve, reject) => {
    app.canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  app.destroy(true)
  return blob
}
