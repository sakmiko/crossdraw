/**
 * Unified export center catalog — hierarchical checklist of deliverables.
 * Each item knows when it is available and how to run.
 */
export type ExportCategory = 'drawing' | 'signal' | 'analysis' | 'band' | 'data' | 'package'

export type ExportItemId =
  | 'mesh-png'
  | 'mesh-svg'
  | 'mesh-dxf'
  | 'project-rtp'
  | 'timing-svg'
  | 'control-svg'
  | 'flow-dir-svg'
  | 'timespace-simple-svg'
  | 'analysis-board'
  | 'analysis-csv'
  | 'analysis-xls'
  | 'analysis-json'
  | 'analysis-md'
  | 'vissim-csv'
  | 'vissim-inpx'
  | 'multi-page-report'
  | 'ped-ring-svg'
  | 'compare-csv'
  | 'compare-json'
  | 'compare-timing-svg'
  | 'xsection-svg'
  | 'band-pack'
  | 'band-multi-compare'
  | 'pro-pack'
  | 'print-a4'
  | 'conflict-matrix-svg'
  | 'roadgee-flow-svg'
  | 'roadgee-plan-los'
  | 'roadgee-plan-delay'
  | 'roadgee-plan-queue'
  | 'roadgee-plan-vc'
  | 'roadgee-signal-board'
  | 'maxband-report-svg'
  | 'maxband-report-md'
  | 'maxband-report-csv'

export type ExportItem = {
  id: ExportItemId
  category: ExportCategory
  title: string
  format: string
  description: string
  /** modes where this export is most relevant */
  modes?: string[]
  requires: Array<'channel' | 'flow' | 'signal' | 'analysis' | 'selected' | 'band' | 'timingClosed' | 'flowAligned' | 'analysisOk'>
}

export const EXPORT_CATALOG: ExportItem[] = [
  {
    id: 'maxband-report-svg',
    category: 'band',
    title: 'MAXBAND 相位差报告图',
    format: 'SVG',
    description: '路口相位差茎叶图 + 上下行带宽 · 离散搜索结果 · 非 MIP',
    modes: ['band'],
    requires: ['band'],
  },
  {
    id: 'maxband-report-md',
    category: 'band',
    title: 'MAXBAND 报告 Markdown',
    format: 'MD',
    description: '相位差表 + 带宽 KPI',
    modes: ['band'],
    requires: ['band'],
  },
  {
    id: 'maxband-report-csv',
    category: 'band',
    title: 'MAXBAND 节点表 CSV',
    format: 'CSV',
    description: 'name,distance,offset,λ,C,locked',
    modes: ['band'],
    requires: ['band'],
  },

  {
    id: 'roadgee-signal-board',
    category: 'signal',
    title: '相位灯态配时图',
    format: 'SVG',
    description: '多相位十字灯态 + G/Y 配时条 · 与相位表同源 · 无水印',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },

  {
    id: 'roadgee-flow-svg',
    category: 'drawing',
    title: '流量流向图（RoadGee 式）',
    format: 'SVG',
    description: '彩色转向飘带 + 进口合计 · 与流量表同源 · 无水印',
    modes: ['flow'],
    requires: ['channel', 'flow', 'flowAligned'],
  },
  {
    id: 'roadgee-plan-los',
    category: 'analysis',
    title: '服务水平平面图',
    format: 'SVG',
    description: '进口转向 LOS 色块 + 中心综合 · 与分析同源',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal', 'analysis'],
  },
  {
    id: 'roadgee-plan-delay',
    category: 'analysis',
    title: '延误时间平面图',
    format: 'SVG',
    description: 's/pcu · 与分析表同源',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal', 'analysis'],
  },
  {
    id: 'roadgee-plan-queue',
    category: 'analysis',
    title: '排队长度平面图',
    format: 'SVG',
    description: 'm · 与分析表同源',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal', 'analysis'],
  },
  {
    id: 'roadgee-plan-vc',
    category: 'analysis',
    title: '饱和度平面图',
    format: 'SVG',
    description: 'v/c · 与分析表同源',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal', 'analysis'],
  },

  {
    id: 'project-rtp',
    category: 'data',
    title: '工程文件',
    format: '.rtp',
    description: '完整项目 JSON，可再打开编辑',
    requires: [],
  },
  {
    id: 'mesh-png',
    category: 'drawing',
    title: '渠化平面图 PNG',
    format: 'PNG',
    description: '画布栅格导出，适合汇报插图',
    modes: ['channel', 'flow'],
    requires: ['channel'],
  },
  {
    id: 'mesh-svg',
    category: 'drawing',
    title: '渠化平面图 SVG',
    format: 'SVG',
    description: '矢量平面图，可二次编辑',
    modes: ['channel'],
    requires: ['channel'],
  },
  {
    id: 'mesh-dxf',
    category: 'drawing',
    title: '渠化平面图 DXF',
    format: 'DXF',
    description: 'CAD 中间交换',
    modes: ['channel'],
    requires: ['channel'],
  },
  {
    id: 'xsection-svg',
    category: 'drawing',
    title: '标准横断面图',
    format: 'SVG',
    description: '当前进口标准断面 + 尺寸链',
    modes: ['xsection'],
    requires: ['channel', 'selected'],
  },
  {
    id: 'timing-svg',
    category: 'signal',
    title: '信号配时图',
    format: 'SVG',
    description: '绿/黄/红相位条 · 需周期闭合',
    modes: ['signal'],
    requires: ['signal', 'timingClosed'],
  },
  {
    id: 'control-svg',
    category: 'signal',
    title: '放行管控图',
    format: 'SVG',
    description: '相位 × 进口放行矩阵',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },
  {
    id: 'flow-dir-svg',
    category: 'signal',
    title: '流量流向图',
    format: 'SVG',
    description: '线宽∝流量的 L/T/R 箭头图',
    modes: ['flow', 'analysis'],
    requires: ['flow', 'flowAligned'],
  },
  {
    id: 'print-a4',
    category: 'package',
    title: 'A4 打印拼版',
    format: 'SVG/HTML',
    description: '最多 4 图 A4 矢量拼版预览与导出',
    modes: ['analysis', 'signal', 'flow'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'pro-pack',
    category: 'package',
    title: '专业图件包',
    format: '多 SVG',
    description: '配时 + 管控 + 流向 + 时距（若有走廊）',
    modes: ['analysis', 'signal'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'analysis-board',
    category: 'analysis',
    title: '分析报告拼图',
    format: 'SVG+MD',
    description: 'KPI / 流向 / 雷达 / 延误 / 相位灯态 / 表',
    modes: ['analysis'],
    requires: ['analysis', 'analysisOk'],
  },
  {
    id: 'analysis-csv',
    category: 'analysis',
    title: '评价明细 CSV',
    format: 'CSV',
    description: '车道组 v/c 延误排队',
    modes: ['analysis'],
    requires: ['analysis', 'analysisOk'],
  },
  {
    id: 'analysis-xls',
    category: 'analysis',
    title: '评价表 Excel(HTML)',
    format: 'XLS',
    description: '可用 Excel 打开的 HTML 表',
    modes: ['analysis'],
    requires: ['analysis'],
  },
  {
    id: 'analysis-json',
    category: 'data',
    title: '分析结果 JSON',
    format: 'JSON',
    description: '结构化评价结果',
    modes: ['analysis'],
    requires: ['analysis'],
  },
  {
    id: 'vissim-csv',
    category: 'data',
    title: 'Vissim 中间表',
    format: 'CSV×4',
    description: 'links / routes / volumes / signal',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'compare-csv',
    category: 'analysis',
    title: '方案比选 CSV',
    format: 'CSV',
    description: '渠化×流量×信号组合指标',
    modes: ['compare', 'analysis'],
    requires: ['channel'],
  },
  {
    id: 'compare-json',
    category: 'analysis',
    title: '方案比选 JSON',
    format: 'JSON',
    description: '比选行数据',
    modes: ['compare'],
    requires: ['channel'],
  },
  {
    id: 'compare-timing-svg',
    category: 'package',
    title: '并排配时图包',
    format: 'SVG×3',
    description: '并排配时 + 延误 + v/c',
    modes: ['compare'],
    requires: ['channel'],
  },
  {
    id: 'conflict-matrix-svg',
    category: 'signal',
    title: '冲突矩阵图',
    format: 'SVG+MD',
    description: '冲突矩阵 + 冲突点示意图 + 全相位审查简报',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },
  {
    id: 'vissim-inpx',
    category: 'data',
    title: 'Vissim 开放交换包',
    format: 'XML+CSV+JSON',
    description: 'CrossdrawVissimInterchange XML + 四表 CSV + 摘要（非 PTV 私有二进制）',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'multi-page-report',
    category: 'package',
    title: '多页工程报告',
    format: 'HTML/PDF',
    description: '5 页 A4 工程报告（浏览器打印/另存 PDF）',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal', 'analysis'],
  },
  {
    id: 'ped-ring-svg',
    category: 'signal',
    title: '行人过街环图',
    format: 'SVG',
    description: '进口面 Walk/FDW 环图 · 可聚焦当前相位',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },
  {
    id: 'band-pack',
    category: 'band',
    title: '绿波时距/简报',
    format: 'SVG+JSON+MD',
    description: '当前走廊时距图、数据、Markdown 简报',
    modes: ['band'],
    requires: ['band'],
  },
  {
    id: 'band-multi-compare',
    category: 'band',
    title: '多走廊对比包',
    format: 'SVG+JSON+MD',
    description: '全部走廊 KPI 柱图 + 对比表 + 各走廊摘要',
    modes: ['band'],
    requires: ['band'],
  },
]

export const CATEGORY_LABEL: Record<ExportCategory, string> = {
  drawing: '图面出图',
  signal: '信号与流量图',
  analysis: '评价与比选',
  band: '绿波走廊',
  data: '数据交换',
  package: '打包导出',
}

export type ExportContext = {
  hasChannel: boolean
  hasFlow: boolean
  hasSignal: boolean
  hasAnalysis: boolean
  hasSelected: boolean
  hasBand: boolean
  /** signal main phases Σ ≈ C */
  timingClosed?: boolean
  /** flow table/chart homology */
  flowAligned?: boolean
  /** analysis volume-weighted integrity */
  analysisOk?: boolean
}

export function isExportAvailable(item: ExportItem, ctx: ExportContext): boolean {
  return item.requires.every((r) => {
    if (r === 'channel') return ctx.hasChannel
    if (r === 'flow') return ctx.hasFlow
    if (r === 'signal') return ctx.hasSignal
    if (r === 'analysis') return ctx.hasAnalysis
    if (r === 'selected') return ctx.hasSelected
    if (r === 'band') return ctx.hasBand
    if (r === 'timingClosed') return ctx.timingClosed !== false
    if (r === 'flowAligned') return ctx.flowAligned !== false
    if (r === 'analysisOk') return ctx.analysisOk !== false
    return true
  })
}

export function exportIntegrityNotes(ctx: ExportContext): string[] {
  const notes: string[] = []
  if (ctx.hasSignal && ctx.timingClosed === false) notes.push('信号配时未闭合（主相位 Σ ≠ C）')
  if (ctx.hasFlow && ctx.flowAligned === false) notes.push('流量表/图同源校验未通过')
  if (ctx.hasAnalysis && ctx.analysisOk === false) notes.push('分析汇总与车道表不一致')
  if (!notes.length) notes.push('同源校验正常：可导出专业图件')
  return notes
}
