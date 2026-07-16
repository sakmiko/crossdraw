/**
 * Five-leg intersection template — bearings every 72°.
 */
import { newId } from "@/shared/id"
import type { Project } from "../types"
import { createCrossTemplate } from "./cross"

export function createFiveLegTemplate(name = "五路交叉口"): Project {
  const p = createCrossTemplate(name)
  const ch = p.channelizationSchemes[0]
  ch.name = "渠化方案 五路"
  // keep intersectionType as cross (schema); geometry uses 5 approaches
  const base = ch.approaches[0]
  const bearings = [0, 72, 144, 216, 288]
  const labels = ["北", "东北", "东南", "西南", "西北"]
  ch.approaches = bearings.map((b, i) => ({
    ...JSON.parse(JSON.stringify(base)),
    id: newId(),
    name: `${labels[i]}进口`,
    bearingDeg: b,
    entryLanes: base.entryLanes.slice(0, 3).map((l) => ({ ...l, id: newId() })),
    exitLanes: base.exitLanes.slice(0, 2).map((l) => ({ ...l, id: newId() })),
  }))
  for (const a of ch.approaches) {
    a.widen = { ...a.widen, entryWidenLengthM: 50 }
  }
  const fl = ch.flowSchemes[0]
  const vols: typeof fl.volumes = {}
  for (const a of ch.approaches) {
    vols[a.id] = { U: 5, L: 100, T: 280, R: 90 }
  }
  fl.volumes = vols
  const sg = fl.signalSchemes[0]
  sg.name = "五相位示意"
  sg.cycleSec = 100
  sg.phases = ch.approaches.map((a, i) => ({
    id: newId(),
    name: `第${i + 1}相位`,
    greenSec: 14,
    yellowSec: 3,
    allRedSec: 1,
    isOverlap: false,
    releases: { [a.id]: ["L", "T"] as ("L" | "T" | "R" | "U")[] },
  }))
  p.name = name
  p.meta = { ...p.meta, updatedAt: new Date().toISOString() }
  return p
}
