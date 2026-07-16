/**
 * Build standard engineering print panels for A4 composition.
 * Includes channel draft sheet (title/scale/north) as first panel when available.
 * Homology: same domain charts as workspaces / export center.
 */
import type {
  BandCorridor,
  ChannelizationScheme,
  FlowScheme,
  Mesh,
  Project,
  SignalScheme,
  AnalysisResult,
} from '@/domain/types'
import type { PrintPanel } from '@/io/printSheet'
import { buildChannelDraftSheet } from '@/io/channelDraftSheet'
import { meshToSvg } from '@/io/exportSvg'
import { signalTimingDiagramSvg } from '@/ui/charts/professionalDiagrams'
import { controlMatrixSvg } from '@/ui/charts/professionalDiagrams'
import { flowMovementDiagramSvg } from '@/ui/charts/professionalDiagrams'
import { conflictMatrixExportSvg } from '@/ui/charts/conflictExport'
import { buildAnalysisReportSvg } from '@/io/analysisReportSvg'
import { professionalTimeSpaceSvg } from '@/ui/charts/professionalTimeSpace'
import { measureCorridor } from '@/domain/analysis/corridor'

export type CollectPrintContext = {
  project: Project
  channel: ChannelizationScheme | null
  flow: FlowScheme | null
  signal: SignalScheme | null
  analysis: AnalysisResult | null
  mesh: Mesh | null
  focusPhaseId?: string | null
  /** prefer draft sheet over bare mesh */
  preferChannelDraft?: boolean
  /** preset: engineering = draft+flow+timing+control */
  preset?: 'engineering' | 'signal' | 'analysis' | 'auto'
}

export function collectEngineeringPrintPanels(ctx: CollectPrintContext): PrintPanel[] {
  const {
    project,
    channel,
    flow,
    signal,
    analysis,
    mesh,
    focusPhaseId,
    preferChannelDraft = true,
    preset = 'auto',
  } = ctx
  const panels: PrintPanel[] = []

  const want = (id: string) => {
    if (preset === 'auto' || preset === 'engineering') return true
    if (preset === 'signal') return ['timing', 'control', 'conflict', 'dual'].includes(id)
    if (preset === 'analysis') return ['draft', 'flow', 'board', 'timespace'].includes(id)
    return true
  }

  // 1) Channel plan with drafting chrome
  if (channel && want('draft')) {
    if (preferChannelDraft) {
      panels.push({
        id: 'draft',
        title: '渠化平面出图',
        svg: buildChannelDraftSheet(project, channel, mesh ?? undefined, {
          projectName: project.name,
          paper: 'A4-landscape',
        }),
      })
    } else if (mesh) {
      panels.push({
        id: 'mesh',
        title: '渠化平面',
        svg: meshToSvg(mesh, project.name),
      })
    }
  }

  // 2) Flow
  if (channel && flow && want('flow') && panels.length < 4) {
    panels.push({
      id: 'flow',
      title: '流量流向图',
      svg: flowMovementDiagramSvg(
        channel.approaches.map((ap) => {
          const v = flow.volumes[ap.id] ?? { L: 0, T: 0, R: 0, U: 0 }
          return { name: ap.name, bearingDeg: ap.bearingDeg, L: v.L, T: v.T, R: v.R }
        }),
      ),
    })
  }

  // 3) Timing
  if (signal && want('timing') && panels.length < 4) {
    panels.push({
      id: 'timing',
      title: '信号配时图',
      svg: signalTimingDiagramSvg(
        signal.phases.map((p) => ({
          name: p.name,
          greenSec: p.greenSec,
          yellowSec: p.yellowSec,
          allRedSec: p.allRedSec,
          isOverlap: p.isOverlap,
        })),
        signal.cycleSec || 90,
      ),
    })
  }

  // 4) Control matrix
  if (channel && signal && want('control') && panels.length < 4) {
    panels.push({
      id: 'control',
      title: '放行管控图',
      svg: controlMatrixSvg(
        channel.approaches.map((x) => x.name),
        signal.phases.map((p) => ({ name: p.name, releases: p.releases })),
        channel.approaches.map((x) => x.id),
      ),
    })
  }

  // fill: conflict
  if (channel && signal && want('conflict') && panels.length < 4) {
    panels.push({
      id: 'conflict',
      title: '冲突矩阵',
      svg: conflictMatrixExportSvg(
        channel.approaches,
        signal,
        focusPhaseId ?? signal.phases[0]?.id ?? null,
      ),
    })
  }

  // fill: analysis board
  if (analysis && channel && flow && signal && want('board') && panels.length < 4) {
    panels.push({
      id: 'board',
      title: '运行评价',
      svg: buildAnalysisReportSvg({
        projectName: project.name,
        channelName: channel.name,
        signalName: signal.name,
        approaches: channel.approaches,
        flow,
        signal,
        analysis,
        theme: 'light',
      }),
    })
  }

  // fill: timespace
  if (project.bandCorridor?.nodes?.length >= 2 && want('timespace') && panels.length < 4) {
    try {
      const band = measureCorridor(project.bandCorridor as BandCorridor)
      panels.push({
        id: 'timespace',
        title: '绿波时距图',
        svg: professionalTimeSpaceSvg(project.bandCorridor as BandCorridor, band, {
          width: 640,
          height: 400,
        }),
      })
    } catch {
      /* optional */
    }
  }

  return panels.slice(0, 4)
}

export function engineeringPrintManifest(
  projectName: string,
  panels: PrintPanel[],
): string {
  return [
    `# ${projectName} · A4 工程拼版清单`,
    '',
    ...panels.map((p, i) => `${i + 1}. **${p.title}** (\`${p.id}\`)`),
    '',
    '- 渠化出图含图框/比例尺/指北（导出稿）',
    '- 示意比例，非测绘出图；数据与编辑器同源',
  ].join('\n')
}
