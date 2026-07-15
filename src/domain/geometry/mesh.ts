import type { Mesh, MeshLabel, MeshLine, MeshPoly } from '../types'
import { round } from '@/shared/math'

export function emptyMesh(): Mesh {
  return {
    polygons: [],
    polylines: [],
    labels: [],
    bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  }
}

export function recomputeBBox(mesh: Mesh): Mesh {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const consider = (x: number, y: number) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  for (const p of mesh.polygons) for (const [x, y] of p.points) consider(x, y)
  for (const l of mesh.polylines) for (const [x, y] of l.points) consider(x, y)
  for (const lb of mesh.labels) consider(lb.at[0], lb.at[1])
  if (!Number.isFinite(minX)) {
    mesh.bbox = { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  } else {
    mesh.bbox = {
      minX: round(minX),
      minY: round(minY),
      maxX: round(maxX),
      maxY: round(maxY),
    }
  }
  return mesh
}

export function pushPoly(mesh: Mesh, poly: MeshPoly) {
  mesh.polygons.push({
    ...poly,
    points: poly.points.map(([x, y]) => [round(x), round(y)] as [number, number]),
  })
}

export function pushLine(mesh: Mesh, line: MeshLine) {
  mesh.polylines.push({
    ...line,
    points: line.points.map(([x, y]) => [round(x), round(y)] as [number, number]),
  })
}

export function pushLabel(mesh: Mesh, label: MeshLabel) {
  mesh.labels.push({
    ...label,
    at: [round(label.at[0]), round(label.at[1])],
  })
}

export function rectPoly(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  rotRad: number,
): [number, number][] {
  const corners: [number, number][] = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ]
  const c = Math.cos(rotRad)
  const s = Math.sin(rotRad)
  return corners.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c])
}
