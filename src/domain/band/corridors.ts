/**
 * Multi green-band corridor helpers.
 */
import { newId } from '@/shared/id'
import type { BandCorridor, Project } from '../types'

export function defaultBandCorridor(name = '主干路绿波走廊'): BandCorridor {
  return {
    id: newId(),
    name,
    speedKmh: 40,
    method: 'classic',
    nodes: [
      { id: newId(), name: '路口A', distanceM: 0, greenRatio: 0.45, cycleSec: 90, offsetSec: 0 },
      { id: newId(), name: '路口B', distanceM: 480, greenRatio: 0.5, cycleSec: 90, offsetSec: 0 },
      { id: newId(), name: '路口C', distanceM: 980, greenRatio: 0.42, cycleSec: 90, offsetSec: 0 },
      { id: newId(), name: '路口D', distanceM: 1500, greenRatio: 0.48, cycleSec: 90, offsetSec: 0 },
    ],
  }
}

export function cloneBandCorridor(src: BandCorridor, name?: string): BandCorridor {
  return {
    id: newId(),
    name: name ?? `${src.name} 副本`,
    speedKmh: src.speedKmh,
    method: src.method,
    nodes: src.nodes.map((n) => ({
      ...n,
      id: newId(),
    })),
  }
}

/** Ensure project has bandCorridors[] and activeBandId; bandCorridor mirrors active. */
export function normalizeBandCorridors(project: Project): Project {
  let list = project.bandCorridors
  if (!list || !Array.isArray(list) || list.length === 0) {
    const one = project.bandCorridor ?? defaultBandCorridor()
    list = [one]
  }
  const seen = new Set<string>()
  list = list.filter((c) => {
    if (!c?.id || seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
  if (!list.length) list = [defaultBandCorridor()]

  let activeId = project.activeBandId
  if (!activeId || !list.some((c) => c.id === activeId)) {
    activeId = list[0].id
  }
  const active = list.find((c) => c.id === activeId) ?? list[0]
  project.bandCorridors = list
  project.activeBandId = active.id
  project.bandCorridor = active
  return project
}

export function activeBand(project: Project): BandCorridor {
  normalizeBandCorridors(project)
  return project.bandCorridor
}
