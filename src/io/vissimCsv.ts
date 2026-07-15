import type { Approach, FlowScheme, Movement, SignalScheme } from '@/domain/types'

/** Export intermediate tables that map cleanly into Vissim network construction. */
export function exportVissimCsvBundle(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): { links: string; routes: string; volumes: string; signal: string } {
  const links = [
    'link_id,approach,bearing_deg,entry_lanes,exit_lanes,lane_width_m,design_speed_kmh',
    ...approaches.map((a, i) => {
      const w = a.entryLanes[0]?.widthM ?? 3.5
      return [
        `L${i + 1}`,
        csv(a.name),
        a.bearingDeg,
        a.entryLanes.length,
        a.exitLanes.length,
        w,
        a.designSpeedKmh,
      ].join(',')
    }),
  ].join('\n')

  const routes = [
    'route_id,from_approach,movement,to_bearing_hint',
    ...approaches.flatMap((a, i) =>
      (['L', 'T', 'R'] as const).map((m) => {
        const delta = m === 'L' ? -90 : m === 'R' ? 90 : 180
        const to = (a.bearingDeg + delta + 360) % 360
        return [`R${i + 1}_${m}`, csv(a.name), m, to].join(',')
      }),
    ),
  ].join('\n')

  const volumes = [
    'approach,movement,natural_veh,heavy_ratio,phf,default_sat_flow',
    ...approaches.flatMap((a) => {
      const v = flow.volumes[a.id] ?? { U: 0, L: 0, T: 0, R: 0 }
      return (['L', 'T', 'R'] as const).map((m) =>
        [csv(a.name), m, v[m], flow.heavyRatio, flow.phf, flow.defaultSatFlow].join(','),
      )
    }),
  ].join('\n')

  const signalRows = [
    'phase_id,phase_name,green_s,yellow_s,allred_s,approach,movements,is_overlap,cycle_s',
    ...signal.phases.flatMap((ph) =>
      Object.entries(ph.releases).map(([apId, movs]) => {
        const ap = approaches.find((a) => a.id === apId)
        const list = movs as Movement[]
        return [
          ph.id,
          csv(ph.name),
          ph.greenSec,
          ph.yellowSec,
          ph.allRedSec,
          csv(ap?.name ?? apId),
          list.join('|'),
          ph.isOverlap ? 1 : 0,
          signal.cycleSec,
        ].join(',')
      }),
    ),
  ].join('\n')

  return {
    links: links + '\n',
    routes: routes + '\n',
    volumes: volumes + '\n',
    signal: signalRows + '\n',
  }
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
