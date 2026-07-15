import type { Issue, Phase, Project } from '../types'
import { newId } from '@/shared/id'

/** Very simplified conflict: same approach L vs opposing T when concurrent — placeholder matrix on overlapping phases not modeled; check mutual exclusive releases weakly. */
export function detectPhaseConflicts(phases: Phase[]): Issue[] {
  const issues: Issue[] = []
  for (let i = 0; i < phases.length; i++) {
    for (let j = i + 1; j < phases.length; j++) {
      const a = phases[i]
      const b = phases[j]
      // if two phases both release through on opposite approaches — only warn if identical approach has L and T split poorly in same phase
      void a
      void b
    }
  }
  for (const ph of phases) {
    for (const [apId, movs] of Object.entries(ph.releases)) {
      if (movs.includes('L') && movs.includes('T') && movs.length === 2) {
        // permitted LT with through — often OK; skip
      }
      if (ph.greenSec <= 0) {
        issues.push({
          id: newId(),
          level: 'block',
          code: 'GREEN_NON_POSITIVE',
          message: `相位「${ph.name}」绿灯时间无效`,
          path: `/phases/${ph.id}/greenSec`,
        })
      }
      void apId
    }
  }
  return issues
}

export function detectProjectSignalIssues(project: Project): Issue[] {
  const out: Issue[] = []
  for (const ch of project.channelizationSchemes) {
    for (const fl of ch.flowSchemes) {
      for (const sg of fl.signalSchemes) {
        out.push(...detectPhaseConflicts(sg.phases))
      }
    }
  }
  return out
}
