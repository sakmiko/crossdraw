export type Units = 'metric'

export type IntersectionType = 'cross' | 't' | 'y' | 'skewed' | 'roundabout' | 'custom'

export type Movement = 'U' | 'L' | 'T' | 'R'

export type MedianStyle = 'doubleYellow' | 'singleYellow' | 'barrier' | 'fishBelly' | 'yellowHatch' | 'greenBelt'

export type ChannelizeStyle = 'solid' | 'painted' | 'none'

export type IssueLevel = 'ok' | 'warn' | 'block'

export type EditorMode = 'channel' | 'flow' | 'signal' | 'xsection' | 'analysis' | 'compare' | 'band'

export interface Issue {
  id: string
  level: IssueLevel
  code: string
  message: string
  path: string
  standardRef?: string
}

export interface Lane {
  id: string
  widthM: number
  movements: Movement[]
  satFlowPcu?: number
  variable?: boolean
}

export interface LaneGroup {
  id: string
  laneIds: string[]
  movements: Movement[]
}

export type IslandSurface = 'raised' | 'painted' | 'landscaped'

export interface SafetyIsland {
  /** pedestrian refuge / channel island at corner */
  enabled: boolean
  surface: IslandSurface
  /** inscribed radius of island body (m) */
  radiusM: number
  /** setback from stop-line / curb fillet (m) */
  setbackM: number
  showYield: boolean
  /** label on drawing */
  label: string
}

export interface RightTurnChannel {
  enabled: boolean
  style: ChannelizeStyle
  separateEntry: boolean
  separateExit: boolean
  widthM: number
  radiusM: number
  /** channel lane width for free-right (m) */
  channelWidthM: number
  /** island offset from curb toward corner pocket (m) */
  islandOffsetM: number
  safetyIsland: SafetyIsland
}

export interface Median {
  style: MedianStyle
  widthM: number
}

export interface WidenParams {
  entryWidenCount: number
  entryWidenWidthM: number
  entryWidenLengthM: number
  entryTaperM: number
  exitWidenCount: number
  exitWidenWidthM: number
  exitWidenLengthM: number
  exitTaperM: number
  innerOffsetM: number
}

export interface Approach {
  id: string
  name: string
  bearingDeg: number
  designSpeedKmh: number
  entryLanes: Lane[]
  exitLanes: Lane[]
  laneGroups: LaneGroup[]
  widen: WidenParams
  rightTurn: RightTurnChannel
  median: Median
  sidewalkWidthM: number
  bikeEnabled: boolean
  bikeWidthM: number
  leftWait: boolean
  throughWait: boolean
  borrowLeft: boolean
  redRightTurn: boolean
  redRightTurnRatio: number
  tiltEntryDeg: number
  tiltExitDeg: number
}

export interface DisplaySettings {
  background: string
  northArrow: boolean
  paperSize: 'A3' | 'A4' | 'custom'
}

export interface ChannelizationScheme {
  id: string
  name: string
  intersectionType: IntersectionType
  approaches: Approach[]
  display: DisplaySettings
  flowSchemes: FlowScheme[]
}

export interface TurnVolumes {
  U: number
  L: number
  T: number
  R: number
}

export interface FlowStyle {
  colorScheme: 'blue' | 'heat' | 'mono'
  minWidth: number
  maxWidth: number
}

/** Per-approach non-motor / pedestrian counts (engineering skeleton). */
export interface MultimodalVolumes {
  /** pedestrian midblock / approach face peds/h */
  ped: number
  /** bike / e-bike veh/h */
  bike: number
  /** optional other non-motor */
  other?: number
}

export interface FlowScheme {
  id: string
  name: string
  volumes: Record<string, TurnVolumes>
  /**
   * Optional multimodal volumes by approachId.
   * Motor vehicle analysis still uses `volumes`; these feed charts/notes.
   */
  multimodal?: Record<string, MultimodalVolumes>
  heavyRatio: number
  phf: number
  pce: number
  defaultSatFlow: number
  style: FlowStyle
  signalSchemes: SignalScheme[]
}

/** Pedestrian crossings released with a phase (by approach face / crosswalk). */
export type PedestrianCrossing = {
  /** approach id whose stop-line face has the crosswalk */
  approachId: string
  /** exclusive ped (no concurrent vehicle conflict on that face) */
  exclusive?: boolean
}

export interface Phase {
  id: string
  name: string
  greenSec: number
  yellowSec: number
  allRedSec: number
  /** approachId -> movements released */
  releases: Record<string, Movement[]>
  isOverlap?: boolean
  /**
   * Pedestrian walk intervals concurrent with this phase.
   * If omitted/empty: no dedicated ped indication (vehicle-only).
   */
  pedestrian?: PedestrianCrossing[]
  /** optional walk / FDW split inside greenSec (engineering note) */
  pedWalkSec?: number
  pedFdwSec?: number
}

export interface SignalScheme {
  id: string
  name: string
  cycleSec: number
  phases: Phase[]
  yellowDefault: number
  allRedDefault: number
  startLossSec: number
  /** total lost time L used by Webster (s); if omitted derived from phases */
  lostTimeSec?: number
  unsignalized: boolean
}

export interface CrossSectionComponent {
  type: 'sidewalk' | 'bike' | 'vehicle' | 'median' | 'shoulder' | 'green'
  widthM: number
  label: string
  color: string
}

export interface CrossSection {
  approachId: string
  components: CrossSectionComponent[]
  sourceHash: string
  stale: boolean
}

export interface ProjectMeta {
  createdAt: string
  updatedAt: string
  author?: string
}

export interface ActivePointers {
  channelId: string | null
  flowId: string | null
  signalId: string | null
}

export interface BandNodeEditable {
  id: string
  name: string
  distanceM: number
  greenRatio: number
  cycleSec: number
  lockedOffset?: boolean
  offsetSec: number
}

export interface BandCorridor {
  id: string
  name: string
  speedKmh: number
  /** classic=数解双向, optimized-scan=MAXBAND启发, one-way=单向, two-way-equal=双向等带, graphical=图解半周期 */
  method: 'classic' | 'optimized-scan' | 'one-way' | 'two-way-equal' | 'graphical'
  nodes: BandNodeEditable[]
}

export interface Project {
  id: string
  name: string
  units: Units
  channelizationSchemes: ChannelizationScheme[]
  crossSections: CrossSection[]
  active: ActivePointers
  meta: ProjectMeta
  settings: {
    maxSchemes: number
    targetVc: number
    /** optional site anchor for basemap (WGS84) */
    basemap?: {
      enabled: boolean
      provider: 'osm' | 'none'
      latitude: number
      longitude: number
      /** meters per canvas unit (approx) — used for scale bar only */
      metersPerUnit?: number
      opacity?: number
    }
  }
  /**
   * Multi-corridor green-band (绿波) support.
   * `bandCorridor` remains the active corridor (synced with bandCorridors[activeBandId]).
   */
  bandCorridors: BandCorridor[]
  activeBandId: string
  /** @deprecated use bandCorridors + activeBandId; kept as active mirror for compatibility */
  bandCorridor: BandCorridor
}

export interface ProjectFile {
  format: 'crossdraw.rtp'
  schemaVersion: number
  appVersion: string
  project: Project
}

export interface MeshPoly {
  layer: 'ROAD' | 'MARKING' | 'ISLAND' | 'ANNO' | 'FLOW' | 'FRAME'
  points: [number, number][]
  fill?: string
  stroke?: string
  strokeWidth?: number
  alpha?: number
  meta?: Record<string, unknown>
}

export interface MeshLine {
  layer: MeshPoly['layer']
  points: [number, number][]
  stroke?: string
  strokeWidth?: number
  dashed?: boolean
  alpha?: number
  meta?: Record<string, unknown>
}

export interface MeshLabel {
  text: string
  at: [number, number]
  color?: string
  size?: number
  align?: 'left' | 'center' | 'right'
  meta?: Record<string, unknown>
}

export interface Mesh {
  polygons: MeshPoly[]
  polylines: MeshLine[]
  labels: MeshLabel[]
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
}

export interface AnalysisLaneResult {
  approachId: string
  approachName: string
  movement: string
  volumePeak: number
  satFlow: number
  greenRatio: number
  capacity: number
  vc: number
  delaySec: number
  queueM: number
}

export interface AnalysisResult {
  lanes: AnalysisLaneResult[]
  avgVc: number
  avgDelay: number
  avgQueueM: number
  losByDelay: string
  losByVc: string
  losFinal: string
}

export interface WebsterInput {
  targetVc: number
  startLoss: number
  fixedCycle?: number
}

export interface WebsterResult {
  cycleSec: number
  Y: number
  phaseGreens: { phaseId: string; greenSec: number }[]
}

export interface BandIntersection {
  id: string
  name: string
  distanceM: number
  greenRatio: number
  offsetSec: number
}

export interface BandResult {
  method: string
  halfCycleDistanceM: number
  bandwidthRatio: number
  bandwidthSec: number
  offsets: { id: string; offsetSec: number }[]
  standardSpeedKmh: number
  /** forward progressive band estimate (s) */
  forwardBandwidthSec?: number
  /** backward progressive band estimate (s) */
  backwardBandwidthSec?: number
}
