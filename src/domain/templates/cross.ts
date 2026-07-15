import { newId } from '@/shared/id'
import type { Approach, ChannelizationScheme, FlowScheme, Lane, Project, SignalScheme, TurnVolumes } from '../types'

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
    },
    median: { style: 'greenBelt', widthM: 2 },
    sidewalkWidthM: 3,
    bikeEnabled: true,
    bikeWidthM: 2.5,
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
    greenSec: 28,
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
    volumes[a.id] = { U: 20, L: 180, T: 620, R: 150 }
  }
  return {
    id: newId(),
    name: '高峰小时',
    volumes,
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
    display: { background: '#e8eef5', northArrow: true, paperSize: 'A3' },
    flowSchemes: [defaultFlow(approaches)],
  }
  const now = new Date().toISOString()
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
    settings: { maxSchemes: 10, targetVc: 0.85 },
    bandCorridor: {
      id: newId(),
      name: '主干路绿波走廊',
      speedKmh: 40,
      method: 'classic',
      nodes: [
        { id: newId(), name: '路口A', distanceM: 0, greenRatio: 0.45, cycleSec: 90, offsetSec: 0 },
        { id: newId(), name: '路口B', distanceM: 480, greenRatio: 0.5, cycleSec: 90, offsetSec: 0 },
        { id: newId(), name: '路口C', distanceM: 980, greenRatio: 0.42, cycleSec: 90, offsetSec: 0 },
        { id: newId(), name: '路口D', distanceM: 1500, greenRatio: 0.48, cycleSec: 90, offsetSec: 0 },
      ],
    },
  }
}

export function createEmptyProject(): Project {
  return createCrossTemplate('未命名项目')
}
