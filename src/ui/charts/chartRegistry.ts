/**
 * Chart registry — single place listing professional chart kinds,
 * data sources, panel mode, and export catalog ids.
 * Keeps App/export/docs from drifting.
 */
export type ChartKindId =
  | 'signal-timing'
  | 'ring-barrier'
  | 'control-matrix'
  | 'phase-face'
  | 'flow-bars'
  | 'flow-direction'
  | 'analysis-vc'
  | 'analysis-delay'
  | 'analysis-los'
  | 'analysis-radar'
  | 'band-timespace'
  | 'xsection-pro'
  | 'scheme-compare-timing'
  | 'analysis-board'
  | 'print-a4'
  | 'band-corridor-compare'
  | 'conflict-matrix'
  | 'conflict-points'
  | 'pedestrian-ring'
  | 'dual-ring'
  | 'multimodal-bars'

export type ChartRegistryEntry = {
  id: ChartKindId
  title: string
  /** domain / align module that owns truth */
  dataSource: string
  modes: string[]
  exportIds?: string[]
  notes?: string
}

export const CHART_REGISTRY: ChartRegistryEntry[] = [
  {
    id: 'signal-timing',
    title: '信号配时图',
    dataSource: 'signal/timingAlign + professionalDiagrams.signalTimingDiagramSvg',
    modes: ['signal'],
    exportIds: ['timing-svg', 'pro-pack'],
    notes: '轴=C；主相位 G/Y/AR',
  },
  {
    id: 'ring-barrier',
    title: '相位环栏条',
    dataSource: 'signal phases + svgCharts.ringBarrierSvg',
    modes: ['signal'],
    notes: '轴=C；搭接不计主环',
  },
  {
    id: 'control-matrix',
    title: '放行管控图',
    dataSource: 'signal/releaseAlign',
    modes: ['signal'],
    exportIds: ['control-svg'],
  },
  {
    id: 'phase-face',
    title: '相位灯态图',
    dataSource: 'phase.releases',
    modes: ['signal'],
  },
  {
    id: 'flow-bars',
    title: '转向流量柱图',
    dataSource: 'flow/flowAlign',
    modes: ['flow'],
  },
  {
    id: 'flow-direction',
    title: '流量流向箭头图',
    dataSource: 'flow/flowAlign',
    modes: ['flow', 'analysis'],
    exportIds: ['flow-dir-svg'],
  },
  {
    id: 'analysis-vc',
    title: '进口饱和度',
    dataSource: 'analysis.lanes (volume-weighted avgs)',
    modes: ['analysis'],
  },
  {
    id: 'analysis-delay',
    title: '延误明细',
    dataSource: 'analysis.lanes',
    modes: ['analysis'],
  },
  {
    id: 'analysis-los',
    title: '服务水平色带',
    dataSource: 'chartStandards.losByControlDelay + analysis.losFinal',
    modes: ['analysis'],
  },
  {
    id: 'analysis-radar',
    title: '运行指标雷达',
    dataSource: 'analysis summary',
    modes: ['analysis'],
  },
  {
    id: 'band-timespace',
    title: '绿波时距图',
    dataSource: 'analysis/band scoreOffsets + measureCorridor',
    modes: ['band'],
    exportIds: ['band-pack'],
  },
  {
    id: 'xsection-pro',
    title: '标准横断面',
    dataSource: 'xsection/build',
    modes: ['xsection'],
    exportIds: ['xsection-svg'],
  },
  {
    id: 'scheme-compare-timing',
    title: '并排配时比选',
    dataSource: 'schemeCompareDiagrams',
    modes: ['compare'],
    exportIds: ['compare-timing-svg'],
  },
  {
    id: 'analysis-board',
    title: '分析拼图报告',
    dataSource: 'io/analysisReportSvg',
    modes: ['analysis'],
    exportIds: ['analysis-board'],
  },
  {
    id: 'print-a4',
    title: 'A4 打印拼版',
    dataSource: 'io/printSheet',
    modes: ['analysis', 'signal', 'flow'],
    exportIds: ['print-a4'],
    notes: '2×2 面板拼入 A4',
  },
  {
    id: 'band-corridor-compare',
    title: '多走廊带宽对比',
    dataSource: 'bandCorridorCompare + measureCorridor',
    modes: ['band'],
    exportIds: ['band-multi-compare'],
  },
  {
    id: 'conflict-matrix',
    title: '转向冲突矩阵',
    dataSource: 'phaseConflictView + conflictMatrixSvg',
    modes: ['signal'],
    exportIds: ['conflict-matrix-svg'],
  },
  {
    id: 'conflict-points',
    title: '冲突点示意图',
    dataSource: 'conflictDiagram + classifyPair',
    modes: ['signal'],
    exportIds: ['conflict-matrix-svg'],
    notes: '路径几何示意，规则与矩阵同源',
  },
]

export function chartsForMode(mode: string): ChartRegistryEntry[] {
  return CHART_REGISTRY.filter((c) => c.modes.includes(mode))
}

export function chartByExportId(exportId: string): ChartRegistryEntry | undefined {
  return CHART_REGISTRY.find((c) => c.exportIds?.includes(exportId))
}

// v0.5.76 roadgee flow/plan: roadgeeFlowDiagramSvg, roadgeeAnalysisPlanSvg
