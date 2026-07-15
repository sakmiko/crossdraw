import type { Mesh } from '@/domain/types'

export function meshToDxf(mesh: Mesh): string {
  const lines: string[] = []
  const o = (code: number, value: string | number) => {
    lines.push(String(code), String(value))
  }

  const layerColor: Record<string, number> = {
    ROAD: 8,
    MARKING: 7,
    ISLAND: 3,
    ANNO: 2,
    FLOW: 4,
    FRAME: 5,
  }

  o(0, 'SECTION')
  o(2, 'HEADER')
  o(9, '$ACADVER')
  o(1, 'AC1015')
  o(9, '$INSUNITS')
  o(70, 6) // meters
  o(0, 'ENDSEC')

  o(0, 'SECTION')
  o(2, 'TABLES')
  o(0, 'TABLE')
  o(2, 'LTYPE')
  o(70, 2)
  o(0, 'LTYPE')
  o(2, 'CONTINUOUS')
  o(70, 0)
  o(3, 'Solid line')
  o(72, 65)
  o(73, 0)
  o(40, 0)
  o(0, 'LTYPE')
  o(2, 'DASHED')
  o(70, 0)
  o(3, 'Dashed __ __')
  o(72, 65)
  o(73, 2)
  o(40, 0.75)
  o(49, 0.5)
  o(74, 0)
  o(49, -0.25)
  o(74, 0)
  o(0, 'ENDTAB')

  o(0, 'TABLE')
  o(2, 'LAYER')
  o(70, 6)
  for (const name of ['ROAD', 'MARKING', 'ISLAND', 'ANNO', 'FLOW', 'FRAME']) {
    o(0, 'LAYER')
    o(2, name)
    o(70, 0)
    o(62, layerColor[name] ?? 7)
    o(6, 'CONTINUOUS')
  }
  o(0, 'ENDTAB')

  o(0, 'TABLE')
  o(2, 'STYLE')
  o(70, 1)
  o(0, 'STYLE')
  o(2, 'STANDARD')
  o(70, 0)
  o(40, 0)
  o(41, 1)
  o(50, 0)
  o(71, 0)
  o(42, 2.5)
  o(3, 'txt')
  o(4, '')
  o(0, 'ENDTAB')
  o(0, 'ENDSEC')

  o(0, 'SECTION')
  o(2, 'ENTITIES')

  for (const p of mesh.polygons) {
    if (p.points.length < 2) continue
    o(0, 'LWPOLYLINE')
    o(8, p.layer)
    o(90, p.points.length)
    o(70, 1) // closed
    o(62, layerColor[p.layer] ?? 7)
    for (const [x, y] of p.points) {
      o(10, round6(x))
      o(20, round6(-y))
    }
  }

  for (const l of mesh.polylines) {
    if (l.points.length < 2) continue
    o(0, 'LWPOLYLINE')
    o(8, l.layer)
    o(90, l.points.length)
    o(70, 0)
    o(62, layerColor[l.layer] ?? 7)
    o(6, l.dashed ? 'DASHED' : 'CONTINUOUS')
    if (l.strokeWidth) {
      o(43, Math.max(0.05, l.strokeWidth))
    }
    for (const [x, y] of l.points) {
      o(10, round6(x))
      o(20, round6(-y))
    }
  }

  for (const lb of mesh.labels) {
    o(0, 'TEXT')
    o(8, 'ANNO')
    o(10, round6(lb.at[0]))
    o(20, round6(-lb.at[1]))
    o(30, 0)
    o(40, Math.max(1.5, lb.size ?? 2.5))
    o(1, sanitize(lb.text))
    o(7, 'STANDARD')
    if (lb.align === 'center') {
      o(72, 1)
      o(11, round6(lb.at[0]))
      o(21, round6(-lb.at[1]))
      o(31, 0)
    }
  }

  o(0, 'ENDSEC')
  o(0, 'EOF')
  return lines.join('\n') + '\n'
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

function sanitize(s: string): string {
  return s.replace(/[\r\n]/g, ' ')
}
