import { z } from 'zod'
import type { Project, ProjectFile } from './types'
import { normalizeBandCorridors } from './band/corridors'
// pedestrian defaults applied in parseRtp
import { normalizeNewlines } from '@/shared/math'

const turnSchema = z.object({ U: z.number(), L: z.number(), T: z.number(), R: z.number() })

const laneSchema = z.object({
  id: z.string(),
  widthM: z.number(),
  movements: z.array(z.enum(['U', 'L', 'T', 'R'])),
  satFlowPcu: z.number().optional(),
  variable: z.boolean().optional(),
})

const approachSchema = z.object({
  id: z.string(),
  name: z.string(),
  bearingDeg: z.number(),
  designSpeedKmh: z.number(),
  entryLanes: z.array(laneSchema),
  exitLanes: z.array(laneSchema),
  laneGroups: z.array(
    z.object({
      id: z.string(),
      laneIds: z.array(z.string()),
      movements: z.array(z.enum(['U', 'L', 'T', 'R'])),
    }),
  ),
  widen: z.object({
    entryWidenCount: z.number(),
    entryWidenWidthM: z.number(),
    entryWidenLengthM: z.number(),
    entryTaperM: z.number(),
    exitWidenCount: z.number(),
    exitWidenWidthM: z.number(),
    exitWidenLengthM: z.number(),
    exitTaperM: z.number(),
    innerOffsetM: z.number(),
  }),
  rightTurn: z.object({
    enabled: z.boolean(),
    style: z.enum(['solid', 'painted', 'none']),
    separateEntry: z.boolean(),
    separateExit: z.boolean(),
    widthM: z.number(),
    radiusM: z.number(),
    channelWidthM: z.number().optional().default(4.5),
    islandOffsetM: z.number().optional().default(0),
    safetyIsland: z
      .object({
        enabled: z.boolean(),
        surface: z.enum(['raised', 'painted', 'landscaped']),
        radiusM: z.number(),
        setbackM: z.number(),
        showYield: z.boolean(),
        label: z.string(),
      })
      .optional(),
  }),
  median: z.object({
    style: z.enum(['doubleYellow', 'singleYellow', 'barrier', 'fishBelly', 'yellowHatch', 'greenBelt']),
    widthM: z.number(),
  }),
  sidewalkWidthM: z.number(),
  bikeEnabled: z.boolean(),
  bikeWidthM: z.number(),
  auxRoad: z
    .object({
      enabled: z.boolean(),
      widthM: z.number(),
      offsetM: z.number().optional(),
      openNearM: z.number().optional(),
    })
    .optional(),
  leftWait: z.boolean(),
  throughWait: z.boolean(),
  borrowLeft: z.boolean(),
  redRightTurn: z.boolean(),
  redRightTurnRatio: z.number(),
  tiltEntryDeg: z.number(),
  tiltExitDeg: z.number(),
})

const phaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  greenSec: z.number(),
  yellowSec: z.number(),
  allRedSec: z.number(),
  kind: z.enum(['vehicle', 'pedestrian', 'mixed']).optional(),
  releases: z.record(z.array(z.enum(['U', 'L', 'T', 'R']))),
  isOverlap: z.boolean().optional(),
  pedestrian: z
    .array(
      z.object({
        approachId: z.string(),
        exclusive: z.boolean().optional(),
      }),
    )
    .optional(),
  pedWalkSec: z.number().optional(),
  pedFdwSec: z.number().optional(),
})

const signalSchema = z.object({
  id: z.string(),
  name: z.string(),
  cycleSec: z.number(),
  phases: z.array(phaseSchema),
  yellowDefault: z.number(),
  allRedDefault: z.number(),
  startLossSec: z.number(),
  unsignalized: z.boolean(),
})

const multimodalSchema = z.object({
  ped: z.number(),
  bike: z.number(),
  other: z.number().optional(),
})

const flowSchema = z.object({
  id: z.string(),
  name: z.string(),
  volumes: z.record(turnSchema),
  multimodal: z.record(multimodalSchema).optional(),
  heavyRatio: z.number(),
  phf: z.number(),
  pce: z.number(),
  defaultSatFlow: z.number(),
  style: z.object({
    colorScheme: z.enum(['blue', 'heat', 'mono']),
    minWidth: z.number(),
    maxWidth: z.number(),
  }),
  signalSchemes: z.array(signalSchema),
})

const channelSchema = z.object({
  id: z.string(),
  name: z.string(),
  intersectionType: z.enum(['cross', 't', 'y', 'skewed', 'roundabout', 'custom']),
  approaches: z.array(approachSchema),
  display: z.object({
    background: z.string(),
    northArrow: z.boolean(),
    paperSize: z.enum(['A3', 'A4', 'custom']),
  }),
  flowSchemes: z.array(flowSchema),
})

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  units: z.literal('metric'),
  channelizationSchemes: z.array(channelSchema),
  crossSections: z.array(
    z.object({
      approachId: z.string(),
      components: z.array(
        z.object({
          type: z.enum(['sidewalk', 'bike', 'vehicle', 'median', 'shoulder', 'green']),
          widthM: z.number(),
          label: z.string(),
          color: z.string(),
        }),
      ),
      sourceHash: z.string(),
      stale: z.boolean(),
    }),
  ),
  active: z.object({
    channelId: z.string().nullable(),
    flowId: z.string().nullable(),
    signalId: z.string().nullable(),
  }),
  meta: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    author: z.string().optional(),
  }),
  settings: z.object({
    maxSchemes: z.number(),
    targetVc: z.number(),
    basemap: z
      .object({
        enabled: z.boolean(),
        provider: z.enum(['osm', 'none']),
        latitude: z.number(),
        longitude: z.number(),
        metersPerUnit: z.number().optional(),
        opacity: z.number().optional(),
      })
      .optional(),
  }),
  bandCorridor: z
    .object({
      id: z.string(),
      name: z.string(),
      speedKmh: z.number(),
      method: z.enum(['classic', 'optimized-scan', 'one-way', 'two-way-equal', 'graphical', 'maxband-discrete']),
      nodes: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          distanceM: z.number(),
          greenRatio: z.number(),
          cycleSec: z.number(),
          lockedOffset: z.boolean().optional(),
          offsetSec: z.number(),
          lat: z.number().optional(),
          lon: z.number().optional(),
        }),
      ),
    })
    .optional(),
  bandCorridors: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        speedKmh: z.number(),
        method: z.enum(['classic', 'optimized-scan', 'one-way', 'two-way-equal', 'graphical', 'maxband-discrete']),
        nodes: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            distanceM: z.number(),
            greenRatio: z.number(),
            cycleSec: z.number(),
            lockedOffset: z.boolean().optional(),
            offsetSec: z.number(),
            lat: z.number().optional(),
            lon: z.number().optional(),
          }),
        ),
      }),
    )
    .optional(),
  activeBandId: z.string().optional(),
})

export const projectFileSchema = z.object({
  format: z.literal('crossdraw.rtp'),
  schemaVersion: z.number().int().positive(),
  appVersion: z.string(),
  project: projectSchema,
})


function defaultSafetyIsland() {
  return {
    enabled: true,
    surface: 'raised' as const,
    radiusM: 3.5,
    setbackM: 1.5,
    showYield: true,
    label: '安全岛',
  }
}

function normalizeRightTurn(rt: {
  enabled: boolean
  style: 'solid' | 'painted' | 'none'
  separateEntry: boolean
  separateExit: boolean
  widthM: number
  radiusM: number
  channelWidthM?: number
  islandOffsetM?: number
  safetyIsland?: {
    enabled: boolean
    surface: 'raised' | 'painted' | 'landscaped'
    radiusM: number
    setbackM: number
    showYield: boolean
    label: string
  }
}) {
  return {
    ...rt,
    channelWidthM: rt.channelWidthM ?? rt.widthM ?? 4.5,
    islandOffsetM: rt.islandOffsetM ?? 0,
    safetyIsland: rt.safetyIsland
      ? { ...defaultSafetyIsland(), ...rt.safetyIsland }
      : defaultSafetyIsland(),
  }
}

function normalizeProjectApproaches(project: ProjectFile['project']) {
  for (const ch of project.channelizationSchemes) {
    for (const ap of ch.approaches) {
      ap.rightTurn = normalizeRightTurn(ap.rightTurn as never) as typeof ap.rightTurn
    }
  }
}

function defaultBand() {
  return {
    id: 'band-default',
    name: '主干路绿波走廊',
    speedKmh: 40,
    method: 'classic' as const,
    nodes: [
      { id: 'n1', name: '路口A', distanceM: 0, greenRatio: 0.45, cycleSec: 90, offsetSec: 0 },
      { id: 'n2', name: '路口B', distanceM: 480, greenRatio: 0.5, cycleSec: 90, offsetSec: 0 },
      { id: 'n3', name: '路口C', distanceM: 980, greenRatio: 0.42, cycleSec: 90, offsetSec: 0 },
      { id: 'n4', name: '路口D', distanceM: 1500, greenRatio: 0.48, cycleSec: 90, offsetSec: 0 },
    ],
  }
}

export function parseRtp(text: string): ProjectFile {
  const raw = JSON.parse(normalizeNewlines(text))
  const parsed = projectFileSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Invalid RTP: ${parsed.error.issues.map((i) => i.message).join('; ')}`)
  }
  if (parsed.data.schemaVersion !== 1) {
    throw new Error(`Unsupported schemaVersion ${parsed.data.schemaVersion}`)
  }
  const file = parsed.data as ProjectFile
  if (!file.project.bandCorridor) {
    file.project.bandCorridor = defaultBand()
  }
  normalizeProjectApproaches(file.project)
  normalizeBandCorridors(file.project as Project)
  normalizeProjectPedestrian(file.project as Project)
  return file
}

export function serializeRtp(file: ProjectFile): string {
  return JSON.stringify(file, null, 2) + '\n'
}

export function wrapProject(project: Project, appVersion = '0.2.0'): ProjectFile {
  return {
    format: 'crossdraw.rtp',
    schemaVersion: 1,
    appVersion,
    project,
  }
}

function normalizeProjectPedestrian(project: Project) {
  for (const ch of project.channelizationSchemes) {
    for (const fl of ch.flowSchemes) {
      for (const sg of fl.signalSchemes) {
        for (const ph of sg.phases) {
          if (!ph.pedestrian) ph.pedestrian = []
        }
      }
    }
  }
}

