import type { Mesh } from '@/domain/types'

/** Minimal DXF R12-ish writer */
export function meshToDxf(mesh: Mesh): string {
  const lines: string[] = []
  const o = (code: number, value: string | number) => {
    lines.push(String(code), String(value))
  }
  o(0, 'SECTION')
  o(2, 'HEADER')
  o(9, '$ACADVER')
  o(1, 'AC1009')
  o(0, 'ENDSEC')
  o(0, 'SECTION')
  o(2, 'TABLES')
  o(0, 'TABLE')
  o(2, 'LAYER')
  for (const name of ['ROAD', 'MARKING', 'ISLAND', 'ANNO', 'FLOW', 'FRAME']) {
    o(0, 'LAYER')
    o(2, name)
    o(70, 0)
    o(62, 7)
    o(6, 'CONTINUOUS')
  }
  o(0, 'ENDTAB')
  o(0, 'ENDSEC')
  o(0, 'SECTION')
  o(2, 'ENTITIES')
  for (const p of mesh.polygons) {
    // LWPOLYLINE-like as POLYLINE
    o(0, 'POLYLINE')
    o(8, p.layer)
    o(66, 1)
    o(70, 1)
    for (const [x, y] of p.points) {
      o(0, 'VERTEX')
      o(8, p.layer)
      o(10, x)
      o(20, -y) // CAD Y up
      o(30, 0)
    }
    o(0, 'SEQEND')
  }
  for (const l of mesh.polylines) {
    o(0, 'POLYLINE')
    o(8, l.layer)
    o(66, 1)
    o(70, 0)
    for (const [x, y] of l.points) {
      o(0, 'VERTEX')
      o(8, l.layer)
      o(10, x)
      o(20, -y)
      o(30, 0)
    }
    o(0, 'SEQEND')
  }
  for (const lb of mesh.labels) {
    o(0, 'TEXT')
    o(8, 'ANNO')
    o(10, lb.at[0])
    o(20, -lb.at[1])
    o(30, 0)
    o(40, lb.size ?? 2.5)
    o(1, lb.text)
  }
  o(0, 'ENDSEC')
  o(0, 'EOF')
  return lines.join('\n') + '\n'
}
