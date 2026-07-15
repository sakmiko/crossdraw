import { newId } from '@/shared/id'
import type { Approach, Issue, Movement, Phase, Project } from '../types'
import { detectPedVehicleConflicts } from './pedVehicleConflict'

/** Standard 4-leg conflict pairs for concurrent green (simplified but production-usable). */
const HARD_CONFLICTS: Array<[Movement, Movement]> = [
  ['T', 'T'], // opposing through handled via approach opposition
  ['L', 'T'],
  ['L', 'L'],
  ['T', 'L'],
]

function isOpposing(b1: number, b2: number): boolean {
  const d = Math.abs(((b1 - b2) % 360 + 360) % 360)
  return d > 150 && d < 210
}

function isAdjacent(b1: number, b2: number): boolean {
  const d = Math.min(Math.abs(b1 - b2) % 360, 360 - (Math.abs(b1 - b2) % 360))
  return d > 60 && d < 120
}

export function detectPhaseConflicts(phases: Phase[], approaches: Approach[] = []): Issue[] {
  const issues: Issue[] = []
  const byId = new Map(approaches.map((a) => [a.id, a]))

  for (const ph of phases) {
    if (ph.greenSec <= 0) {
      issues.push({
        id: newId(),
        level: 'block',
        code: 'GREEN_NON_POSITIVE',
        message: `相位「${ph.name}」绿灯时间无效`,
        path: `/phases/${ph.id}/greenSec`,
      })
    }

    const entries: { ap: Approach; mov: Movement }[] = []
    for (const [apId, movs] of Object.entries(ph.releases)) {
      const ap = byId.get(apId)
      if (!ap) continue
      for (const m of movs) entries.push({ ap, mov: m })
    }

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i]
        const b = entries[j]
        if (a.ap.id === b.ap.id) continue

        // opposing through both green
        if (isOpposing(a.ap.bearingDeg, b.ap.bearingDeg) && a.mov === 'T' && b.mov === 'T') {
          issues.push({
            id: newId(),
            level: 'block',
            code: 'CONFLICT_OPPOSING_THROUGH',
            message: `相位「${ph.name}」同时放行对向直行：${a.ap.name} 与 ${b.ap.name}`,
            path: `/phases/${ph.id}/releases`,
          })
        }

        // opposing left vs through
        if (isOpposing(a.ap.bearingDeg, b.ap.bearingDeg)) {
          if ((a.mov === 'L' && b.mov === 'T') || (a.mov === 'T' && b.mov === 'L')) {
            issues.push({
              id: newId(),
              level: 'warn',
              code: 'CONFLICT_LEFT_THROUGH',
              message: `相位「${ph.name}」存在左转与对向直行潜在冲突（${a.ap.name}/${b.ap.name}）`,
              path: `/phases/${ph.id}/releases`,
            })
          }
        }

        // adjacent left vs through (crossing)
        if (isAdjacent(a.ap.bearingDeg, b.ap.bearingDeg)) {
          if ((a.mov === 'L' && b.mov === 'T') || (a.mov === 'T' && b.mov === 'L') || (a.mov === 'L' && b.mov === 'L')) {
            issues.push({
              id: newId(),
              level: 'warn',
              code: 'CONFLICT_CROSSING',
              message: `相位「${ph.name}」相邻进口交叉冲突风险：${a.ap.name}(${a.mov}) vs ${b.ap.name}(${b.mov})`,
              path: `/phases/${ph.id}/releases`,
            })
          }
        }

        void HARD_CONFLICTS
      }
    }

    // pedestrian vs vehicle concurrent greens
    const ped = detectPedVehicleConflicts([ph], approaches)
    issues.push(...ped.issues)
  }

  // cycle vs sum of phases soft check
  return issues
}

export function detectProjectSignalIssues(project: Project): Issue[] {
  const out: Issue[] = []
  for (const ch of project.channelizationSchemes) {
    for (const fl of ch.flowSchemes) {
      for (const sg of fl.signalSchemes) {
        if (sg.unsignalized) continue
        const sumG = sg.phases.reduce((s, p) => s + p.greenSec + p.yellowSec + p.allRedSec, 0)
        if (sumG > sg.cycleSec + 1) {
          out.push({
            id: newId(),
            level: 'warn',
            code: 'PHASE_SUM_EXCEEDS_CYCLE',
            message: `信号「${sg.name}」相位时间之和 ${sumG}s 超过周期 ${sg.cycleSec}s`,
            path: `/signalSchemes/${sg.id}/cycleSec`,
          })
        }
        out.push(...detectPhaseConflicts(sg.phases, ch.approaches))
      }
    }
  }
  return out
}
