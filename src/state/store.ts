import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import { newId } from '@/shared/id'
import type { Approach, EditorMode, Project, TurnVolumes } from '@/domain/types'
import { createCrossTemplate } from '@/domain/templates/cross'
import { wrapProject, serializeRtp } from '@/domain/rtp'
import { saveDraft } from '@/io/autosave'

export type AppState = {
  project: Project
  mode: EditorMode
  selectedApproachId: string | null
  dirty: boolean
  lastMeshKey: string
  setMode: (m: EditorMode) => void
  selectApproach: (id: string | null) => void
  loadProject: (p: Project) => void
  resetTemplate: () => void
  updateApproach: (approachId: string, patch: Partial<Approach>) => void
  setLaneCount: (approachId: string, count: number) => void
  setVolume: (approachId: string, volumes: Partial<TurnVolumes>) => void
  setFlowParams: (patch: { heavyRatio?: number; phf?: number; defaultSatFlow?: number }) => void
  setCycle: (cycleSec: number) => void
  updatePhaseGreen: (phaseId: string, greenSec: number) => void
  addPhase: () => void
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
          s.dirty = true
          s.project.meta.updatedAt = new Date().toISOString()
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
          // regenerate nested ids lightly
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
