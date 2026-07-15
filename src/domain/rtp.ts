import { z } from 'zod'
import type { Project, ProjectFile } from './types'
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
  }),
  median: z.object({
    style: z.enum(['doubleYellow', 'singleYellow', 'barrier', 'fishBelly', 'yellowHatch', 'greenBelt']),
    widthM: z.number(),
  }),
  sidewalkWidthM: z.number(),
  bikeEnabled: z.boolean(),
  bikeWidthM: z.number(),
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
  releases: z.record(z.array(z.enum(['U', 'L', 'T', 'R']))),
  isOverlap: z.boolean().optional(),
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

const flowSchema = z.object({
  id: z.string(),
  name: z.string(),
  volumes: z.record(turnSchema),
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
  }),
  bandCorridor: z
    .object({
      id: z.string(),
      name: z.string(),
      speedKmh: z.number(),
      method: z.enum(['classic', 'optimized-scan', 'one-way', 'two-way-equal', 'graphical']),
      nodes: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          distanceM: z.number(),
          greenRatio: z.number(),
          cycleSec: z.number(),
          lockedOffset: z.boolean().optional(),
          offsetSec: z.number(),
        }),
      ),
    })
    .optional(),
})

export const projectFileSchema = z.object({
  format: z.literal('crossdraw.rtp'),
  schemaVersion: z.number().int().positive(),
  appVersion: z.string(),
  project: projectSchema,
})

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
