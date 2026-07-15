import { newId } from '@/shared/id'
import type { Issue, Project } from '../types'

const DEFAULT_LANE = 3.5

export function validateProject(project: Project): Issue[] {
  const issues: Issue[] = []
  for (const ch of project.channelizationSchemes) {
    for (const ap of ch.approaches) {
      if (ap.entryLanes.length < 1) {
        issues.push({
          id: newId(),
          level: 'block',
          code: 'LANE_COUNT_INVALID',
          message: `${ap.name} 进口车道数无效`,
          path: `/channelizationSchemes/${ch.id}/approaches/${ap.id}/entryLanes`,
        })
      }
      ap.entryLanes.forEach((ln, i) => {
        if (ln.widthM <= 0) {
          issues.push({
            id: newId(),
            level: 'block',
            code: 'WIDTH_NON_POSITIVE',
            message: `${ap.name} 第${i + 1}车道宽度必须 > 0`,
            path: `/channelizationSchemes/${ch.id}/approaches/${ap.id}/entryLanes/${i}/widthM`,
          })
        } else if (Math.abs(ln.widthM - DEFAULT_LANE) > 0.25) {
          issues.push({
            id: newId(),
            level: 'warn',
            code: 'WIDTH_OFF_DEFAULT',
            message: `${ap.name} 车道宽 ${ln.widthM}m 偏离默认 ${DEFAULT_LANE}m`,
            path: `/channelizationSchemes/${ch.id}/approaches/${ap.id}/entryLanes/${i}/widthM`,
            standardRef: 'CJJ 37-2012 表5.3.2（推荐）',
          })
        }
      })
    }
    for (const fl of ch.flowSchemes) {
      for (const sg of fl.signalSchemes) {
        if (!sg.unsignalized && sg.cycleSec <= 0) {
          issues.push({
            id: newId(),
            level: 'block',
            code: 'CYCLE_NON_POSITIVE',
            message: `信号方案「${sg.name}」周期必须 > 0`,
            path: `/signalSchemes/${sg.id}/cycleSec`,
          })
        }
        if (!sg.unsignalized && sg.phases.length === 0) {
          issues.push({
            id: newId(),
            level: 'warn',
            code: 'EMPTY_PHASES',
            message: `信号方案「${sg.name}」无相位`,
            path: `/signalSchemes/${sg.id}/phases`,
          })
        }
      }
    }
  }
  return issues
}

export function summarizeIssues(issues: Issue[]): { block: number; warn: number } {
  return {
    block: issues.filter((i) => i.level === 'block').length,
    warn: issues.filter((i) => i.level === 'warn').length,
  }
}
