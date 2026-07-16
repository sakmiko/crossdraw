import { newId } from '@/shared/id'
import { createFiveLegTemplate } from './fiveLeg'
export { createFiveLegTemplate }
import type { Approach, ChannelizationScheme, FlowScheme, IntersectionType, Lane, Project, SignalScheme, TurnVolumes } from '../types'

function lane(widthM: number, movements: Lane['movements']): Lane {
  return { id: newId(), widthM, movements }
}

function emptyVolumes(): TurnVolumes {
  return { U: 0, L: 0, T: 0, R: 0 }
}

function makeApproach(name: string, bearingDeg: number): Approach {
  return {
    id: newId(),
    name,
    bearingDeg,
    designSpeedKmh: 50,
    entryLanes: [
      lane(3.5, ['L']),
      lane(3.5, ['T']),
      lane(3.5, ['R']),
    ],
    exitLanes: [lane(3.5, ['T']), lane(3.5, ['T'])],
    laneGroups: [], // filled below after lanes created
    widen: {
      entryWidenCount: 1,
      entryWidenWidthM: 3.5,
      entryWidenLengthM: 70,
      entryTaperM: 30,
      exitWidenCount: 0,
      exitWidenWidthM: 3.5,
      exitWidenLengthM: 50,
      exitTaperM: 25,
      innerOffsetM: 0,
    },
    rightTurn: {
      enabled: true,
      style: 'solid',
      separateEntry: true,
      separateExit: true,
      widthM: 4.5,
      radiusM: 15,
      channelWidthM: 4.5,
      islandOffsetM: 0,
      safetyIsland: {
        enabled: true,
        surface: 'raised',
        radiusM: 3.5,
        setbackM: 1.5,
        showYield: true,
        label: '安全岛',
      },
    },
    median: { style: 'greenBelt', widthM: 2 },
    sidewalkWidthM: 3,
    bikeEnabled: true,
    bikeWidthM: 2.5,
    auxRoad: { enabled: false, widthM: 5.5, offsetM: 1.0, openNearM: 18 },
    leftWait: false,
    throughWait: false,
    borrowLeft: false,
    redRightTurn: false,
    redRightTurnRatio: 0.25,
    tiltEntryDeg: 0,
    tiltExitDeg: 0,
  }
}

function withLaneGroups(ap: Approach): Approach {
  ap.laneGroups = ap.entryLanes.map((ln) => ({
    id: newId(),
    laneIds: [ln.id],
    movements: [...ln.movements],
  }))
  return ap
}


function defaultSignal(approaches: Approach[]): SignalScheme {
  const ns = approaches.filter((a) => a.bearingDeg % 180 === 0)
  const ew = approaches.filter((a) => a.bearingDeg % 180 !== 0)
  const phase = (name: string, list: Approach[], mov: Array<'L' | 'T' | 'R'>): SignalScheme['phases'][0] => ({
    id: newId(),
    name,
    greenSec: 18,
    yellowSec: 3,
    allRedSec: 2,
    releases: Object.fromEntries(list.map((a) => [a.id, mov])),
  })
  return {
    id: newId(),
    name: '两相位',
    cycleSec: 90,
    phases: [
      phase('南北直行+右转', ns, ['T', 'R']),
      phase('南北左转', ns, ['L']),
      phase('东西直行+右转', ew, ['T', 'R']),
      phase('东西左转', ew, ['L']),
    ],
    yellowDefault: 3,
    allRedDefault: 2,
    startLossSec: 3,
    unsignalized: false,
  }
}

function defaultFlow(approaches: Approach[]): FlowScheme {
  const volumes: Record<string, TurnVolumes> = {}
  for (const a of approaches) {
    // balanced demo volumes (not overloaded)
    volumes[a.id] = { U: 10, L: 120, T: 380, R: 100 }
  }
  const multimodal: Record<string, { ped: number; bike: number }> = {}
  for (const a of approaches) {
    multimodal[a.id] = { ped: 180, bike: 90 }
  }
  return {
    id: newId(),
    name: '高峰小时',
    volumes,
    multimodal,
    heavyRatio: 0.08,
    phf: 0.95,
    pce: 2,
    defaultSatFlow: 1750,
    style: { colorScheme: 'blue', minWidth: 1.5, maxWidth: 14 },
    signalSchemes: [defaultSignal(approaches)],
  }
}

export function createCrossTemplate(name = '标准十字交叉口'): Project {
  const approaches = [
    withLaneGroups(makeApproach('北进口', 0)),
    withLaneGroups(makeApproach('东进口', 90)),
    withLaneGroups(makeApproach('南进口', 180)),
    withLaneGroups(makeApproach('西进口', 270)),
  ]
  const channel: ChannelizationScheme = {
    id: newId(),
    name: '渠化方案 A',
    intersectionType: 'cross',
    approaches,
    display: { background: '#e2e8f0', northArrow: true, paperSize: 'A3' },
    flowSchemes: [defaultFlow(approaches)],
  }
  const now = new Date().toISOString()
  const band = {
    id: newId(),
    name: '主干路绿波走廊',
    speedKmh: 40,
    method: 'classic' as const,
    nodes: [
      { id: newId(), name: '路口A', distanceM: 0, greenRatio: 0.45, cycleSec: 90, offsetSec: 0, lat: 36.0611, lon: 103.8343 },
      { id: newId(), name: '路口B', distanceM: 480, greenRatio: 0.5, cycleSec: 90, offsetSec: 0, lat: 36.0650, lon: 103.8380 },
      { id: newId(), name: '路口C', distanceM: 980, greenRatio: 0.42, cycleSec: 90, offsetSec: 0, lat: 36.0690, lon: 103.8420 },
      { id: newId(), name: '路口D', distanceM: 1500, greenRatio: 0.48, cycleSec: 90, offsetSec: 0 },
    ],
  }
  return {
    id: newId(),
    name,
    units: 'metric',
    channelizationSchemes: [channel],
    crossSections: [],
    active: {
      channelId: channel.id,
      flowId: channel.flowSchemes[0]?.id ?? null,
      signalId: channel.flowSchemes[0]?.signalSchemes[0]?.id ?? null,
    },
    meta: { createdAt: now, updatedAt: now },
    settings: {
      maxSchemes: 10,
      targetVc: 0.85,
      basemap: {
        enabled: false,
        provider: 'osm',
        // Lanzhou approx default for demos
        latitude: 36.0611,
        longitude: 103.8343,
        metersPerUnit: 1,
        opacity: 0.55,
      },
    },
    bandCorridors: [band],
    activeBandId: band.id,
    bandCorridor: band,
  }
}

export function createEmptyProject(): Project {
  return createCrossTemplate('未命名项目')
}


export function createTTemplate(name = 'T型交叉口'): Project {
  const p = createCrossTemplate(name)
  const ch = p.channelizationSchemes[0]
  ch.intersectionType = 't'
  ch.name = '渠化方案 T'
  // drop west approach (270°) for classic T
  ch.approaches = ch.approaches.filter((a) => a.bearingDeg !== 270)
  // rebuild signal releases only for remaining
  const fl = ch.flowSchemes[0]
  const ids = new Set(ch.approaches.map((a) => a.id))
  for (const id of Object.keys(fl.volumes)) {
    if (!ids.has(id)) delete fl.volumes[id]
  }
  const sg = fl.signalSchemes[0]
  for (const ph of sg.phases) {
    for (const id of Object.keys(ph.releases)) {
      if (!ids.has(id)) delete ph.releases[id]
    }
  }
  p.bandCorridor.nodes = p.bandCorridor.nodes.slice(0, 2)
  p.bandCorridors = [p.bandCorridor]
  p.activeBandId = p.bandCorridor.id
  return p
}

export function createYTemplate(name = 'Y型交叉口'): Project {
  const p = createCrossTemplate(name)
  const ch = p.channelizationSchemes[0]
  ch.intersectionType = 'y'
  ch.name = '渠化方案 Y'
  // three legs — classic Y: stem + two forks (angles show acute/obtuse corners)
  const legs = [
    { name: '主线北', bearing: 0 },
    { name: '分叉东南', bearing: 135 },
    { name: '分叉西南', bearing: 225 },
  ]
  const old = ch.approaches
  ch.approaches = legs.map((l, i) => {
    const base = old[i] ?? old[0]
    const ap = {
      ...JSON.parse(JSON.stringify(base)),
      id: base.id,
      name: l.name,
      bearingDeg: l.bearing,
    }
    // slightly wider forks for CAD readability; enable free-right on stem
    if (i === 0) {
      ap.rightTurn = { ...ap.rightTurn, enabled: true, style: 'island', radiusM: 12, widthM: 3.5 }
      ap.widen = { ...ap.widen, entryWidenLanes: 1, entryWidenLengthM: 45, entryTaperM: 25 }
    } else {
      ap.median = { ...ap.median, widthM: Math.max(1.5, ap.median.widthM * 0.7) }
    }
    return ap
  })
  // reassign volumes keys; drop orphan approach volumes
  const fl = ch.flowSchemes[0]
  const vols: Record<string, TurnVolumes> = {}
  for (const a of ch.approaches) {
    a.median.widthM = Math.max(a.median.widthM, 4.5)
    a.rightTurn.enabled = false
    a.widen.entryWidenLengthM = 45
    a.widen.exitWidenLengthM = Math.max(a.widen.exitWidenLengthM ?? 0, 30)
  }
  const sg = ch.flowSchemes[0].signalSchemes[0]
  sg.unsignalized = true
  sg.name = '无信号（环岛让行）'
  sg.phases = []
  sg.cycleSec = 0
  return p
}

export function createSkewedTemplate(name = '斜交交叉口'): Project {
  const p = createCrossTemplate(name)
  const ch = p.channelizationSchemes[0]
  ch.intersectionType = 'skewed'
  ch.name = '渠化方案 斜交'
  const bearings = [0, 70, 180, 250]
  ch.approaches.forEach((a, i) => {
    a.bearingDeg = bearings[i] ?? a.bearingDeg
    a.name = ['北偏', '东偏', '南偏', '西偏'][i] + '进口'
  })
  return p
}

export function createRoundaboutTemplate(name = '环形交叉口'): Project {
  const p = createCrossTemplate(name)
  const ch = p.channelizationSchemes[0]
  ch.intersectionType = 'roundabout'
  ch.name = '渠化方案 环形'
  for (const a of ch.approaches) {
    a.median.widthM = Math.max(a.median.widthM, 4.5)
    a.rightTurn.enabled = false
    a.widen.entryWidenLengthM = 45
    a.widen.exitWidenLengthM = Math.max(a.widen.exitWidenLengthM ?? 0, 30)
  }
  const sg = ch.flowSchemes[0].signalSchemes[0]
  sg.unsignalized = true
  sg.name = '无信号（环岛让行）'
  sg.phases = []
  sg.cycleSec = 0
  return p
}

export function createTemplateByType(kind: IntersectionType | 'cross' | 't' | 'five', name?: string): Project {
  switch (kind) {
    case 't':
      return createTTemplate(name)
    case 'y':
      return createYTemplate(name)
    case 'skewed':
      return createSkewedTemplate(name)
    case 'roundabout':
      return createRoundaboutTemplate(name)
    case 'five':
      return createFiveLegTemplate(name)
    default:
      return createCrossTemplate(name)
  }
}
