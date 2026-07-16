/**
 * VISSIM-oriented structured interchange (.inpx-adjacent XML).
 * Not a licensed PTV binary; produces an open XML + CSV pack that maps 1:1
 * to network construction objects (links, connectors, SC, signal groups).
 */
import type { Approach, FlowScheme, Movement, SignalScheme } from '@/domain/types'
import { exportVissimCsvBundle } from './vissimCsv'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bearingToCardinal(b: number): string {
  const x = ((b % 360) + 360) % 360
  if (x < 45 || x >= 315) return 'N'
  if (x < 135) return 'E'
  if (x < 225) return 'S'
  return 'W'
}

export type VissimInpxPack = {
  /** Open interchange XML (UTF-8) — import aid, not proprietary .inpx blob */
  xml: string
  readme: string
  bundle: ReturnType<typeof exportVissimCsvBundle>
  /** Machine-readable summary for tooling */
  json: string
}

/**
 * Build a comprehensive VISSIM import package from channel/flow/signal.
 * Geometry: each approach → inbound + outbound link; turn connectors by movement.
 */
export function buildVissimInpxPack(
  projectName: string,
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): VissimInpxPack {
  const bundle = exportVissimCsvBundle(approaches, flow, signal)
  const now = new Date().toISOString()

  const linkNodes: {
    id: string
    name: string
    kind: 'in' | 'out'
    approachId: string
    lanes: number
    widthM: number
    speed: number
    bearing: number
  }[] = []

  approaches.forEach((a, i) => {
    const w = a.entryLanes.reduce((s, l) => s + l.widthM, 0) / Math.max(1, a.entryLanes.length)
    linkNodes.push({
      id: `LINK_IN_${i + 1}`,
      name: `${a.name}-进口`,
      kind: 'in',
      approachId: a.id,
      lanes: a.entryLanes.length,
      widthM: w || 3.5,
      speed: a.designSpeedKmh,
      bearing: a.bearingDeg,
    })
    linkNodes.push({
      id: `LINK_OUT_${i + 1}`,
      name: `${a.name}-出口`,
      kind: 'out',
      approachId: a.id,
      lanes: a.exitLanes.length,
      widthM: (a.exitLanes[0]?.widthM ?? 3.5),
      speed: a.designSpeedKmh,
      bearing: (a.bearingDeg + 180) % 360,
    })
  })

  type Conn = {
    id: string
    from: string
    to: string
    mov: Movement
    volume: number
  }
  const conns: Conn[] = []
  approaches.forEach((a, i) => {
    const from = `LINK_IN_${i + 1}`
    const v = flow.volumes[a.id] ?? { U: 0, L: 0, T: 0, R: 0 }
    ;(['L', 'T', 'R'] as const).forEach((m) => {
      const delta = m === 'L' ? -90 : m === 'R' ? 90 : 180
      const targetBearing = (a.bearingDeg + delta + 360) % 360
      // find approach whose outbound faces ~ targetBearing (approach bearing = inbound)
      let bestJ = 0
      let bestDiff = 999
      approaches.forEach((b, j) => {
        const outB = (b.bearingDeg + 180) % 360
        const d = Math.min(Math.abs(outB - targetBearing), 360 - Math.abs(outB - targetBearing))
        if (d < bestDiff) {
          bestDiff = d
          bestJ = j
        }
      })
      conns.push({
        id: `CONN_${i + 1}_${m}`,
        from,
        to: `LINK_OUT_${bestJ + 1}`,
        mov: m,
        volume: v[m] ?? 0,
      })
    })
  })

  // Signal groups: one per approach-movement released in any phase
  const sgKeys = new Set<string>()
  for (const ph of signal.phases) {
    for (const [apId, movs] of Object.entries(ph.releases)) {
      for (const m of movs as Movement[]) sgKeys.add(`${apId}|${m}`)
    }
  }
  const signalGroups = Array.from(sgKeys).map((k, idx) => {
    const [apId, mov] = k.split('|')
    const ap = approaches.find((a) => a.id === apId)
    return { no: idx + 1, name: `${ap?.name ?? apId}-${mov}`, apId, mov }
  })

  // SC program rows
  let t = 0
  const programRows: { phase: string; start: number; end: number; groups: string }[] = []
  for (const ph of signal.phases) {
    if (ph.isOverlap) continue
    const g = ph.greenSec + ph.yellowSec + ph.allRedSec
    const groups = Object.entries(ph.releases)
      .flatMap(([apId, movs]) => (movs as Movement[]).map((m) => {
        const sg = signalGroups.find((s) => s.apId === apId && s.mov === m)
        return sg ? `SG${sg.no}` : ''
      }))
      .filter(Boolean)
      .join(',')
    programRows.push({
      phase: ph.name,
      start: t,
      end: t + ph.greenSec,
      groups,
    })
    t += g
  }

  const xmlParts: string[] = []
  xmlParts.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  xmlParts.push(`<!-- Crossdraw VISSIM interchange (open). Not a proprietary PTV .inpx binary. -->`)
  xmlParts.push(`<CrossdrawVissimInterchange version="1.0" project="${esc(projectName)}" generated="${esc(now)}">`)
  xmlParts.push(`  <Network units="metric" description="${esc(projectName)} intersection network">`)
  xmlParts.push(`    <Links>`)
  for (const L of linkNodes) {
    xmlParts.push(
      `      <Link id="${esc(L.id)}" name="${esc(L.name)}" kind="${L.kind}" approachId="${esc(L.approachId)}" lanes="${L.lanes}" laneWidthM="${L.widthM.toFixed(2)}" speedKmh="${L.speed}" bearingDeg="${L.bearing}" cardinal="${bearingToCardinal(L.bearing)}" lengthM="120"/>`,
    )
  }
  xmlParts.push(`    </Links>`)
  xmlParts.push(`    <Connectors>`)
  for (const c of conns) {
    xmlParts.push(
      `      <Connector id="${esc(c.id)}" fromLink="${esc(c.from)}" toLink="${esc(c.to)}" movement="${c.mov}" volumeVehH="${c.volume}"/>`,
    )
  }
  xmlParts.push(`    </Connectors>`)
  xmlParts.push(`  </Network>`)
  xmlParts.push(`  <VehicleComposition heavyRatio="${flow.heavyRatio}" phf="${flow.phf}" pce="${flow.pce}" defaultSatFlow="${flow.defaultSatFlow}"/>`)
  xmlParts.push(`  <SignalControl name="${esc(signal.name)}" cycleSec="${signal.cycleSec}" type="FixedTime">`)
  xmlParts.push(`    <SignalGroups>`)
  for (const sg of signalGroups) {
    xmlParts.push(`      <SignalGroup no="${sg.no}" name="${esc(sg.name)}" approachId="${esc(sg.apId)}" movement="${sg.mov}"/>`)
  }
  xmlParts.push(`    </SignalGroups>`)
  xmlParts.push(`    <Program cycle="${signal.cycleSec}">`)
  for (const row of programRows) {
    xmlParts.push(
      `      <Interval phase="${esc(row.phase)}" greenStart="${row.start}" greenEnd="${row.end}" groups="${esc(row.groups)}"/>`,
    )
  }
  // pedestrian faces
  for (const ph of signal.phases) {
    for (const ped of ph.pedestrian ?? []) {
      const ap = approaches.find((a) => a.id === ped.approachId)
      xmlParts.push(
        `      <PedInterval phase="${esc(ph.name)}" approach="${esc(ap?.name ?? ped.approachId)}" exclusive="${ped.exclusive ? 1 : 0}" walkSec="${ph.pedWalkSec ?? Math.round(ph.greenSec * 0.6)}" fdwSec="${ph.pedFdwSec ?? Math.round(ph.greenSec * 0.4)}"/>`,
      )
    }
  }
  xmlParts.push(`    </Program>`)
  xmlParts.push(`  </SignalControl>`)
  xmlParts.push(`  <Notes>`)
  xmlParts.push(`    <Note>Open interchange for engineering transfer. Import via CSV tables or map XML fields to Vissim COM/API.</Note>`)
  xmlParts.push(`    <Note>Does not claim bit-identical PTV .inpx compatibility across Vissim versions.</Note>`)
  xmlParts.push(`  </Notes>`)
  xmlParts.push(`</CrossdrawVissimInterchange>`)

  const summary = {
    format: 'CrossdrawVissimInterchange/1.0',
    projectName,
    generated: now,
    links: linkNodes.length,
    connectors: conns.length,
    signalGroups: signalGroups.length,
    cycleSec: signal.cycleSec,
    phases: signal.phases.length,
  }

  const readme = `# ${projectName} — VISSIM 结构化导入包（Crossdraw v0.5.65）

## 文件
| 文件 | 说明 |
|------|------|
| \`*.inpx.xml\` | **开放交换 XML**（Link/Connector/SC/SG/行人间隔） |
| \`*-vissim-*.csv\` | links / routes / volumes / signal 四表 |
| \`*-vissim-summary.json\` | 机器可读摘要 |

## 与真 .inpx 的关系
- 本包是 **工程可映射的结构化交换格式**，覆盖路网、转向连接器、信号灯组与配时程序。
- **不是** PTV 私有二进制/完整工程文件；不同 Vissim 版本 .inpx schema 不公开统一。
- 推荐路径：CSV → 手工/COM 建网；或用 XML 字段对照二次开发导入。

## 映射建议
1. \`Link kind=in/out\` → Vissim Link（进口/出口臂）
2. \`Connector\` → Connector（按 movement L/T/R）
3. \`SignalGroup\` + \`Program/Interval\` → Signal Controller 配时
4. \`PedInterval\` → 行人灯组（若使用）
5. volumes CSV → Vehicle Inputs / Routing Decisions

生成时间：${now}
`

  return {
    xml: xmlParts.join('\n') + '\n',
    readme,
    bundle,
    json: JSON.stringify(summary, null, 2) + '\n',
  }
}
