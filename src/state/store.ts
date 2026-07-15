import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import { newId } from '@/shared/id'
import type {
  Approach,
  BandCorridor,
  EditorMode,
  IntersectionType,
  Movement,
  Phase,
  Project,
  TurnVolumes,
} from '@/domain/types'
import { createCrossTemplate, createTemplateByType } from '@/domain/templates/cross'
import { applyOffsetsToCorridor, optimizeCorridor, setSegmentLength } from '@/domain/analysis/corridor'
import { wrapProject, serializeRtp } from '@/domain/rtp'
import { saveDraft } from '@/io/autosave'

export type UiTheme = 'dark' | 'light'

export type AppState = {
  project: Project
  mode: EditorMode
  selectedApproachId: string | null
  dirty: boolean
  lastMeshKey: string
  theme: UiTheme
  setTheme: (t: UiTheme) => void
  setMode: (m: EditorMode) => void
  selectApproach: (id: string | null) => void
  loadProject: (p: Project) => void
  resetTemplate: () => void
  updateApproach: (approachId: string, patch: Partial<Approach>) => void
  setLaneCount: (approachId: string, count: number) => void
  setLaneWidth: (approachId: string, laneIndex: number, widthM: number) => void
  setLaneMovements: (approachId: string, laneIndex: number, movements: Movement[]) => void
  setVolume: (approachId: string, volumes: Partial<TurnVolumes>) => void
  setFlowParams: (patch: { heavyRatio?: number; phf?: number; defaultSatFlow?: number }) => void
  setCycle: (cycleSec: number) => void
  updatePhaseGreen: (phaseId: string, greenSec: number) => void
  updatePhaseTiming: (
    phaseId: string,
    patch: { greenSec?: number; yellowSec?: number; allRedSec?: number; name?: string; isOverlap?: boolean },
  ) => void
  togglePhaseRelease: (phaseId: string, approachId: string, movement: Movement) => void
  addPhase: () => void
  addOverlapPhase: () => void
  setProjectName: (name: string) => void
  markClean: () => void
  touch: () => void
  getActiveChannel: () => Project['channelizationSchemes'][0] | null
  getActiveFlow: () => Project['channelizationSchemes'][0]['flowSchemes'][0] | null
  getActiveSignal: () =>
    | Project['channelizationSchemes'][0]['flowSchemes'][0]['signalSchemes'][0]
    | null
  duplicateChannel: () => void
  applyWebster: (greens: { phaseId: string; greenSec: number }[], cycle: number) => void
  setActiveChannel: (id: string) => void
  setActiveFlow: (id: string) => void
  setActiveSignal: (id: string) => void
  addFlowScheme: () => void
  addSignalScheme: () => void
  deleteChannel: (id: string) => void
  renameChannel: (id: string, name: string) => void
  loadTemplate: (kind: IntersectionType | 'cross' | 't') => void
  applyOptimizedTiming: (phases: Phase[], cycle: number) => void
  updateBand: (patch: Partial<BandCorridor>) => void
  updateBandNode: (nodeId: string, patch: Partial<BandCorridor['nodes'][0]>) => void
  addBandNode: () => void
  removeBandNode: (nodeId: string) => void
  optimizeBand: () => void
  setBandSegmentLength: (toNodeId: string, lengthM: number) => void
  updateBasemap: (patch: Partial<NonNullable<Project["settings"]["basemap"]>>) => void
}

function activeChannel(p: Project) {
  return p.channelizationSchemes.find((c) => c.id === p.active.channelId) ?? p.channelizationSchemes[0] ?? null
}

function activeFlow(p: Project) {
  const ch = activeChannel(p)
  if (!ch) return null
  return ch.flowSchemes.find((f) => f.id === p.active.flowId) ?? ch.flowSchemes[0] ?? null
}

function activeSignal(p: Project) {
  const fl = activeFlow(p)
  if (!fl) return null
  return fl.signalSchemes.find((s) => s.id === p.active.signalId) ?? fl.signalSchemes[0] ?? null
}

export const useAppStore = create<AppState>()(
  temporal(
    immer((set, get) => ({
      project: createCrossTemplate(),
      mode: 'channel',
      selectedApproachId: null,
      dirty: false,
      lastMeshKey: '',
      theme: (typeof localStorage !== 'undefined' && localStorage.getItem('crossdraw-theme') === 'light' ? 'light' : 'dark') as UiTheme,
      setTheme: (th) =>
        set((s) => {
          s.theme = th
          try {
            localStorage.setItem('crossdraw-theme', th)
            document.documentElement.setAttribute('data-theme', th)
          } catch {}
        }),
      setMode: (m) => set((s) => { s.mode = m }),
      selectApproach: (id) => set((s) => { s.selectedApproachId = id }),
      loadProject: (p) =>
        set((s) => {
          s.project = p
          s.dirty = false
          s.selectedApproachId = p.channelizationSchemes[0]?.approaches[0]?.id ?? null
        }),
      resetTemplate: () =>
        set((s) => {
          s.project = createCrossTemplate()
          s.dirty = true
          s.selectedApproachId = s.project.channelizationSchemes[0]?.approaches[0]?.id ?? null
        }),
      updateApproach: (approachId, patch) =>
        set((s) => {
          const ch = activeChannel(s.project)
          if (!ch) return
          const ap = ch.approaches.find((a) => a.id === approachId)
          if (!ap) return
          Object.assign(ap, patch)
          s.project.meta.updatedAt = new Date().toISOString()
          s.dirty = true
        }),
      setLaneCount: (approachId, count) =>
        set((s) => {
          const ch = activeChannel(s.project)
          const ap = ch?.approaches.find((a) => a.id === approachId)
          if (!ap) return
          const n = Math.max(1, Math.min(8, Math.floor(count)))
          while (ap.entryLanes.length < n) {
            ap.entryLanes.push({
              id: newId(),
              widthM: 3.5,
              movements: ap.entryLanes.length === 0 ? ['L'] : ap.entryLanes.length === n - 1 ? ['R'] : ['T'],
            })
          }
          while (ap.entryLanes.length > n) ap.entryLanes.pop()
          ap.laneGroups = ap.entryLanes.map((ln) => ({
            id: newId(),
            laneIds: [ln.id],
            movements: [...ln.movements],
          }))
          s.dirty = true
          s.project.meta.updatedAt = new Date().toISOString()
        }),
      setLaneWidth: (approachId, laneIndex, widthM) =>
        set((s) => {
          const ch = activeChannel(s.project)
          const ap = ch?.approaches.find((a) => a.id === approachId)
          const ln = ap?.entryLanes[laneIndex]
          if (!ln) return
          ln.widthM = Math.max(2.5, Math.min(4.5, widthM))
          s.dirty = true
        }),
      setLaneMovements: (approachId, laneIndex, movements) =>
        set((s) => {
          const ch = activeChannel(s.project)
          const ap = ch?.approaches.find((a) => a.id === approachId)
          const ln = ap?.entryLanes[laneIndex]
          if (!ln) return
          ln.movements = movements.length ? movements : ['T']
          s.dirty = true
        }),
      setVolume: (approachId, volumes) =>
        set((s) => {
          const fl = activeFlow(s.project)
          if (!fl) return
          fl.volumes[approachId] = { ...(fl.volumes[approachId] ?? { U: 0, L: 0, T: 0, R: 0 }), ...volumes }
          s.dirty = true
        }),
      setFlowParams: (patch) =>
        set((s) => {
          const fl = activeFlow(s.project)
          if (!fl) return
          if (patch.heavyRatio !== undefined) fl.heavyRatio = patch.heavyRatio
          if (patch.phf !== undefined) fl.phf = patch.phf
          if (patch.defaultSatFlow !== undefined) fl.defaultSatFlow = patch.defaultSatFlow
          s.dirty = true
        }),
      setCycle: (cycleSec) =>
        set((s) => {
          const sg = activeSignal(s.project)
          if (!sg) return
          sg.cycleSec = cycleSec
          s.dirty = true
        }),
      updatePhaseGreen: (phaseId, greenSec) =>
        set((s) => {
          const sg = activeSignal(s.project)
          const ph = sg?.phases.find((p) => p.id === phaseId)
          if (!ph) return
          ph.greenSec = greenSec
          s.dirty = true
        }),
      updatePhaseTiming: (phaseId, patch) =>
        set((s) => {
          const sg = activeSignal(s.project)
          const ph = sg?.phases.find((p) => p.id === phaseId)
          if (!ph) return
          if (patch.greenSec !== undefined) ph.greenSec = patch.greenSec
          if (patch.yellowSec !== undefined) ph.yellowSec = patch.yellowSec
          if (patch.allRedSec !== undefined) ph.allRedSec = patch.allRedSec
          if (patch.name !== undefined) ph.name = patch.name
          if (patch.isOverlap !== undefined) ph.isOverlap = patch.isOverlap
          s.dirty = true
        }),
      togglePhaseRelease: (phaseId, approachId, movement) =>
        set((s) => {
          const sg = activeSignal(s.project)
          const ph = sg?.phases.find((p) => p.id === phaseId)
          if (!ph) return
          const cur = new Set(ph.releases[approachId] ?? [])
          if (cur.has(movement)) cur.delete(movement)
          else cur.add(movement)
          const arr = Array.from(cur) as Movement[]
          if (arr.length) ph.releases[approachId] = arr
          else delete ph.releases[approachId]
          s.dirty = true
        }),
      addPhase: () =>
        set((s) => {
          const sg = activeSignal(s.project)
          if (!sg) return
          sg.phases.push({
            id: newId(),
            name: `相位${sg.phases.length + 1}`,
            greenSec: 20,
            yellowSec: 3,
            allRedSec: 2,
            releases: {},
            isOverlap: false,
          })
          s.dirty = true
        }),
      addOverlapPhase: () =>
        set((s) => {
          const sg = activeSignal(s.project)
          if (!sg) return
          sg.phases.push({
            id: newId(),
            name: `搭接${sg.phases.filter((p) => p.isOverlap).length + 1}`,
            greenSec: 12,
            yellowSec: 0,
            allRedSec: 0,
            releases: {},
            isOverlap: true,
          })
          s.dirty = true
        }),
      setProjectName: (name) =>
        set((s) => {
          s.project.name = name
          s.dirty = true
        }),
      markClean: () => set((s) => { s.dirty = false }),
      touch: () =>
        set((s) => {
          s.project.meta.updatedAt = new Date().toISOString()
        }),
      getActiveChannel: () => activeChannel(get().project),
      getActiveFlow: () => activeFlow(get().project),
      getActiveSignal: () => activeSignal(get().project),
      duplicateChannel: () =>
        set((s) => {
          const ch = activeChannel(s.project)
          if (!ch) return
          if (s.project.channelizationSchemes.length >= s.project.settings.maxSchemes) return
          const copy = structuredClone(ch)
          copy.id = newId()
          copy.name = ch.name + ' 副本'
          copy.flowSchemes.forEach((f) => {
            f.id = newId()
            f.signalSchemes.forEach((sg) => {
              sg.id = newId()
              sg.phases.forEach((ph) => {
                ph.id = newId()
              })
            })
          })
          s.project.channelizationSchemes.push(copy)
          s.project.active.channelId = copy.id
          s.dirty = true
        }),
      applyWebster: (greens, cycle) =>
        set((s) => {
          const sg = activeSignal(s.project)
          if (!sg) return
          sg.cycleSec = cycle
          for (const g of greens) {
            const ph = sg.phases.find((p) => p.id === g.phaseId)
            if (ph) ph.greenSec = g.greenSec
          }
          s.dirty = true
        }),
      setActiveChannel: (id) =>
        set((s) => {
          s.project.active.channelId = id
          const ch = s.project.channelizationSchemes.find((c) => c.id === id)
          if (ch) {
            s.project.active.flowId = ch.flowSchemes[0]?.id ?? null
            s.project.active.signalId = ch.flowSchemes[0]?.signalSchemes[0]?.id ?? null
            s.selectedApproachId = ch.approaches[0]?.id ?? null
          }
        }),
      setActiveFlow: (id) =>
        set((s) => {
          s.project.active.flowId = id
          const fl = activeFlow({ ...s.project, active: { ...s.project.active, flowId: id } })
          s.project.active.signalId = fl?.signalSchemes[0]?.id ?? null
        }),
      setActiveSignal: (id) => set((s) => { s.project.active.signalId = id }),
      addFlowScheme: () =>
        set((s) => {
          const ch = activeChannel(s.project)
          if (!ch) return
          if (ch.flowSchemes.length >= s.project.settings.maxSchemes) return
          const base = ch.flowSchemes[0]
          const copy = structuredClone(base)
          copy.id = newId()
          copy.name = `流量方案 ${ch.flowSchemes.length + 1}`
          copy.signalSchemes.forEach((sg) => {
            sg.id = newId()
            sg.phases.forEach((ph) => { ph.id = newId() })
          })
          ch.flowSchemes.push(copy)
          s.project.active.flowId = copy.id
          s.project.active.signalId = copy.signalSchemes[0]?.id ?? null
          s.dirty = true
        }),
      addSignalScheme: () =>
        set((s) => {
          const fl = activeFlow(s.project)
          if (!fl) return
          if (fl.signalSchemes.length >= s.project.settings.maxSchemes) return
          const base = fl.signalSchemes[0]
          const copy = structuredClone(base)
          copy.id = newId()
          copy.name = `信号方案 ${fl.signalSchemes.length + 1}`
          copy.phases.forEach((ph) => { ph.id = newId() })
          fl.signalSchemes.push(copy)
          s.project.active.signalId = copy.id
          s.dirty = true
        }),
      deleteChannel: (id) =>
        set((s) => {
          if (s.project.channelizationSchemes.length <= 1) return
          s.project.channelizationSchemes = s.project.channelizationSchemes.filter((c) => c.id !== id)
          if (s.project.active.channelId === id) {
            const ch = s.project.channelizationSchemes[0]
            s.project.active.channelId = ch.id
            s.project.active.flowId = ch.flowSchemes[0]?.id ?? null
            s.project.active.signalId = ch.flowSchemes[0]?.signalSchemes[0]?.id ?? null
          }
          s.dirty = true
        }),
      renameChannel: (id, name) =>
        set((s) => {
          const ch = s.project.channelizationSchemes.find((c) => c.id === id)
          if (ch) ch.name = name
          s.dirty = true
        }),
      loadTemplate: (kind) =>
        set((s) => {
          const p = createTemplateByType(kind as IntersectionType)
          s.project = p
          s.dirty = true
          s.selectedApproachId = p.channelizationSchemes[0]?.approaches[0]?.id ?? null
        }),
      applyOptimizedTiming: (phases, cycle) =>
        set((s) => {
          const sg = activeSignal(s.project)
          if (!sg) return
          sg.cycleSec = cycle
          sg.phases = phases.map((ph) => ({ ...ph }))
          s.dirty = true
        }),
      updateBand: (patch) =>
        set((s) => {
          Object.assign(s.project.bandCorridor, patch)
          s.dirty = true
        }),
      updateBandNode: (nodeId, patch) =>
        set((s) => {
          const n = s.project.bandCorridor.nodes.find((x) => x.id === nodeId)
          if (!n) return
          Object.assign(n, patch)
          s.dirty = true
        }),
      addBandNode: () =>
        set((s) => {
          const nodes = s.project.bandCorridor.nodes
          const last = nodes[nodes.length - 1]
          nodes.push({
            id: newId(),
            name: `路口${String.fromCharCode(65 + nodes.length)}`,
            distanceM: (last?.distanceM ?? 0) + 450,
            greenRatio: 0.45,
            cycleSec: last?.cycleSec ?? 90,
            offsetSec: 0,
          })
          s.dirty = true
        }),
      removeBandNode: (nodeId) =>
        set((s) => {
          if (s.project.bandCorridor.nodes.length <= 2) return
          s.project.bandCorridor.nodes = s.project.bandCorridor.nodes.filter((n) => n.id !== nodeId)
          s.dirty = true
        }),
      optimizeBand: () =>
        set((s) => {
          const result = optimizeCorridor(s.project.bandCorridor)
          s.project.bandCorridor = applyOffsetsToCorridor(s.project.bandCorridor, result)
          s.dirty = true
        }),
      setBandSegmentLength: (toNodeId, lengthM) =>
        set((s) => {
          s.project.bandCorridor = setSegmentLength(s.project.bandCorridor, toNodeId, lengthM)
          s.dirty = true
        }),
      updateBasemap: (patch) =>
        set((s) => {
          const cur = s.project.settings.basemap ?? {
            enabled: false,
            provider: 'osm' as const,
            latitude: 36.0611,
            longitude: 103.8343,
            metersPerUnit: 1,
            opacity: 0.55,
          }
          s.project.settings.basemap = { ...cur, ...patch }
          s.dirty = true
        }),
    })),
    {
      partialize: (s) => ({ project: s.project }),
      limit: 100,
    },
  ),
)

export function persistAutosave() {
  const p = useAppStore.getState().project
  const file = wrapProject(p)
  saveDraft(serializeRtp(file))
}

export const undo = () => useAppStore.temporal.getState().undo()
export const redo = () => useAppStore.temporal.getState().redo()
