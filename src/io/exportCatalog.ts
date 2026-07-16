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
  | 'xsection-report-md'
  | 'xsection-report-csv'
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
  | 'corridor-network-svg'
  | 'signal-control-board'
  | 'saturation-kpi-md'
  | 'optimize-preview-md'
  | 'timespace-hires-svg'
  | 'timespace-report-md'
  | 'timespace-report-csv'
  | 'flow-report-hires-svg'
  | 'flow-od-md'
  | 'flow-od-csv'
  | 'analysis-plan-pack-svg'
  | 'analysis-plan-pack-md'
  | 'analysis-plan-pack-csv'
  | 'conflict-board-svg'
  | 'conflict-board-csv'
  | 'vissim-pack-oneclick'
  | 'ped-board-svg'
  | 'ped-timing-md'
  | 'ped-timing-csv'
  | 'roundabout-plan-svg'
  | 'roundabout-plan-md'
  | 'dual-ring-board-svg'
  | 'dual-ring-board-md'
  | 'dual-ring-board-csv'
  | 'channel-draft-svg'
  | 'channel-draft-md'
  | 'engineering-print-a4'
  | 'capacity-matrix-svg'
  | 'capacity-matrix-md'
  | 'capacity-matrix-csv'
  | 'phase-number-board-svg'
  | 'phase-number-board-md'
  | 'right-turn-review-svg'
  | 'right-turn-review-md'
  | 'right-turn-review-csv'
  | 'multi-corridor-report-svg'
  | 'multi-corridor-report-md'
  | 'multi-corridor-report-csv'
  | 'full-scheme-optimize-md'
  | 'clean-channel-svg'
  | 'clean-flow-svg'
  | 'clean-analysis-svg'
  | 'clean-timespace-svg'
  | 'clean-timing-svg'
  | 'clean-network-svg'
  | 'unsignalized-plan-svg'
  | 'unsignalized-md'
  | 'unsignalized-csv'
  | 'compare-scorecard-svg'
  | 'compare-delta-md'

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
    id: 'full-scheme-optimize-md',
    category: 'analysis',
    title: '一键全方案优化报告',
    format: 'MD',
    description: 'Webster配时 + 连续相位差 + 多走廊优化（工程近似）',
    modes: ['analysis', 'signal', 'band'],
    requires: ['signal', 'flow'],
  },
  {
    id: 'clean-channel-svg',
    category: 'drawing',
    title: '渠化净图',
    format: 'SVG',
    description: '无标题/脚注/说明文字的几何出图',
    modes: ['channel'],
    requires: ['channel'],
  },
  {
    id: 'clean-flow-svg',
    category: 'drawing',
    title: '流向净图',
    format: 'SVG',
    description: '无多余文字的流向飘带图',
    modes: ['flow'],
    requires: ['flow'],
  },
  {
    id: 'clean-analysis-svg',
    category: 'drawing',
    title: '评价净图',
    format: 'SVG',
    description: '无脚注的服务水平平面图',
    modes: ['analysis'],
    requires: ['analysis'],
  },
  {
    id: 'clean-timespace-svg',
    category: 'band',
    title: '时距净图',
    format: 'SVG',
    description: '无脚注时距图',
    modes: ['band'],
    requires: ['band'],
  },
  {
    id: 'clean-timing-svg',
    category: 'signal',
    title: '配时净图',
    format: 'SVG',
    description: '无脚注配时条',
    modes: ['signal'],
    requires: ['signal'],
  },
  {
    id: 'clean-network-svg',
    category: 'band',
    title: '路网净图',
    format: 'SVG',
    description: '无脚注走廊路网预览',
    modes: ['band'],
    requires: ['band'],
  },

  {
    id: 'multi-corridor-report-svg',
    category: 'band',
    title: '多走廊绿波报告',
    format: 'SVG',
    description: '带宽柱图 + 协调指数表 · measureCorridor 同源',
    modes: ['band'],
    requires: ['band'],
  },
  {
    id: 'multi-corridor-report-md',
    category: 'band',
    title: '多走廊绿波 MD',
    format: 'MD',
    description: '多走廊 KPI + 协调分',
    modes: ['band'],
    requires: ['band'],
  },
  {
    id: 'multi-corridor-report-csv',
    category: 'band',
    title: '多走廊绿波 CSV',
    format: 'CSV',
    description: '带宽与协调指数数据表',
    modes: ['band'],
    requires: ['band'],
  },

  {
    id: 'phase-number-board-svg',
    category: 'signal',
    title: '相位序号图',
    format: 'SVG',
    description: '顺序/双环相位编号板 · 与 phases 同源',
    modes: ['signal'],
    requires: ['signal'],
  },
  {
    id: 'phase-number-board-md',
    category: 'signal',
    title: '相位序号表',
    format: 'MD',
    description: '相位 G/Y/AR/环/屏障表',
    modes: ['signal'],
    requires: ['signal'],
  },
  {
    id: 'right-turn-review-svg',
    category: 'drawing',
    title: '右转渠化审查图',
    format: 'SVG',
    description: '各进口右转/安全岛参数审查',
    modes: ['channel'],
    requires: ['channel'],
  },
  {
    id: 'right-turn-review-md',
    category: 'drawing',
    title: '右转渠化审查 MD',
    format: 'MD',
    description: '右转与安全岛参数表',
    modes: ['channel'],
    requires: ['channel'],
  },
  {
    id: 'right-turn-review-csv',
    category: 'drawing',
    title: '右转渠化审查 CSV',
    format: 'CSV',
    description: '右转参数数据表',
    modes: ['channel'],
    requires: ['channel'],
  },

  {
    id: 'capacity-matrix-svg',
    category: 'analysis',
    title: '通行能力 / 饱和度矩阵',
    format: 'SVG',
    description: '车道组 v/c 矩阵 + 迷你 v/c 条 · 与 analyzeIntersection 同源',
    modes: ['analysis'],
    requires: ['channel', 'analysis'],
  },
  {
    id: 'capacity-matrix-md',
    category: 'analysis',
    title: '通行能力简报',
    format: 'MD',
    description: '车道组参数表 + LOS/v/c KPI',
    modes: ['analysis'],
    requires: ['analysis'],
  },
  {
    id: 'capacity-matrix-csv',
    category: 'analysis',
    title: '通行能力 CSV',
    format: 'CSV',
    description: 'v/s/λ/c/v/c/d/Q 数据表',
    modes: ['analysis'],
    requires: ['analysis'],
  },

  {
    id: 'engineering-print-a4',
    category: 'package',
    title: 'A4 工程拼版（含渠化图框）',
    format: 'SVG/HTML/MD',
    description: '渠化出图+流向+配时+管控 四联 · 与编辑器同源',
    modes: ['channel', 'analysis', 'signal'],
    requires: ['channel'],
  },

  {
    id: 'channel-draft-svg',
    category: 'drawing',
    title: '渠化出图图框',
    format: 'SVG',
    description: '图框·比例尺·指北·标题栏 · 与 mesh 同源；交互画布仍净几何',
    modes: ['channel'],
    requires: ['channel'],
  },
  {
    id: 'channel-draft-md',
    category: 'drawing',
    title: '渠化出图说明',
    format: 'MD',
    description: '进口参数表 + 出图说明',
    modes: ['channel'],
    requires: ['channel'],
  },

  {
    id: 'dual-ring-board-svg',
    category: 'signal',
    title: '双环栏审查看板',
    format: 'SVG',
    description: 'R1/R2 阶段条 + 屏障表 · 与 dualRing 同源',
    modes: ['signal'],
    requires: ['signal'],
  },
  {
    id: 'dual-ring-board-md',
    category: 'signal',
    title: '双环栏简报',
    format: 'MD',
    description: '屏障阶段与闭合状态',
    modes: ['signal'],
    requires: ['signal'],
  },
  {
    id: 'dual-ring-board-csv',
    category: 'signal',
    title: '双环栏阶段 CSV',
    format: 'CSV',
    description: 'B0… 阶段 Σ',
    modes: ['signal'],
    requires: ['signal'],
  },

  {
    id: 'ped-board-svg',
    category: 'signal',
    title: '行人过街审查看板',
    format: 'SVG',
    description: '环图 + Walk/FDW 推算表 · 横道长度同源',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },
  {
    id: 'ped-timing-md',
    category: 'signal',
    title: '行人配时简报',
    format: 'MD',
    description: '各相位 Walk/FDW 推算',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },
  {
    id: 'ped-timing-csv',
    category: 'signal',
    title: '行人配时 CSV',
    format: 'CSV',
    description: 'Walk/FDW 数据表',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },
  {
    id: 'roundabout-plan-svg',
    category: 'drawing',
    title: '环岛布局图',
    format: 'SVG',
    description: '内外半径与进口臂 · 随进口宽度',
    modes: ['channel'],
    requires: ['channel'],
  },
  {
    id: 'roundabout-plan-md',
    category: 'drawing',
    title: '环岛布局参数',
    format: 'MD',
    description: '半径与车道数',
    modes: ['channel'],
    requires: ['channel'],
  },

  {
    id: 'conflict-board-svg',
    category: 'signal',
    title: '相位冲突审查看板',
    format: 'SVG',
    description: '矩阵 + 冲突点 + 全方案命中表 · 与 releases 同源',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },
  {
    id: 'conflict-board-csv',
    category: 'signal',
    title: '冲突命中 CSV',
    format: 'CSV',
    description: '全相位同时放行冲突列表',
    modes: ['signal'],
    requires: ['channel', 'signal'],
  },
  {
    id: 'vissim-pack-oneclick',
    category: 'package',
    title: '一键 VISSIM 交换包',
    format: 'ZIP/多文件',
    description: '开放 XML+CSV 七文件；非 PTV 专有二进制',
    modes: ['analysis', 'signal'],
    requires: ['channel', 'flow', 'signal'],
  },

  {
    id: 'analysis-plan-pack-svg',
    category: 'analysis',
    title: '评价四指标平面合图',
    format: 'SVG',
    description: 'LOS/延误/排队/饱和度 2×2 + 车道表 · 与评价模型同源',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal', 'analysis'],
  },
  {
    id: 'analysis-plan-pack-md',
    category: 'analysis',
    title: '评价合集简报',
    format: 'MD',
    description: 'KPI + 车道明细',
    modes: ['analysis'],
    requires: ['analysis'],
  },
  {
    id: 'analysis-plan-pack-csv',
    category: 'analysis',
    title: '评价车道 CSV',
    format: 'CSV',
    description: '车道组 v/c·延误·排队',
    modes: ['analysis'],
    requires: ['analysis'],
  },

  {
    id: 'flow-report-hires-svg',
    category: 'drawing',
    title: '流量流向报告（高分辨率）',
    format: 'SVG',
    description: '飘带图 + OD 分向表 · 与流量表同源',
    modes: ['flow'],
    requires: ['channel', 'flow', 'flowAligned'],
  },
  {
    id: 'flow-od-md',
    category: 'data',
    title: '流量 OD 简报',
    format: 'MD',
    description: '分向 L/T/R/U 表',
    modes: ['flow'],
    requires: ['channel', 'flow'],
  },
  {
    id: 'flow-od-csv',
    category: 'data',
    title: '流量 OD CSV',
    format: 'CSV',
    description: '分向流量数据',
    modes: ['flow'],
    requires: ['channel', 'flow'],
  },

  {
    id: 'timespace-hires-svg',
    category: 'band',
    title: '绿波时距图（高分辨率）',
    format: 'SVG',
    description: '1280×720 教材风格时距图 · 与带宽计算同源',
    modes: ['band'],
    requires: ['band'],
  },
  {
    id: 'timespace-report-md',
    category: 'band',
    title: '绿波时距简报',
    format: 'MD',
    description: '路口/路段表 + b↑/b↓/带宽比',
    modes: ['band'],
    requires: ['band'],
  },
  {
    id: 'timespace-report-csv',
    category: 'band',
    title: '绿波时距数据 CSV',
    format: 'CSV',
    description: '节点与路段行程时间',
    modes: ['band'],
    requires: ['band'],
  },

  {
    id: 'signal-control-board',
    category: 'signal',
    title: '信号管控与饱和度看板',
    format: 'SVG',
    description: 'KPI + 放行管控图 + 配时条 · 与相位/releases 同源',
    modes: ['signal'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'saturation-kpi-md',
    category: 'signal',
    title: '饱和度 KPI 简报',
    format: 'MD',
    description: 'Y / v/c / 延误 / LOS',
    modes: ['signal', 'analysis'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'optimize-preview-md',
    category: 'signal',
    title: '一键优化预览',
    format: 'MD',
    description: 'Webster 等算法前后对比（未写回则仅预览）',
    modes: ['signal'],
    requires: ['channel', 'flow', 'signal'],
  },

  {
    id: 'corridor-network-svg',
    category: 'band',
    title: '干道路网预览（高分辨率）',
    format: 'SVG',
    description: '链式双幅路+路口参数·上下行协调示意 · 非 GIS',
    modes: ['band'],
    requires: ['band'],
  },

  {
    id: 'compare-scorecard-svg',
    category: 'analysis',
    title: '方案比选记分卡',
    format: 'SVG',
    description: '多方案延误/v/c 卡片 · 基准差量',
    modes: ['compare'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'compare-delta-md',
    category: 'analysis',
    title: '方案差量 Markdown',
    format: 'MD',
    description: '相对基准 Δv/c · Δ延误',
    modes: ['compare'],
    requires: ['channel', 'flow', 'signal'],
  },

  {
    id: 'unsignalized-plan-svg',
    category: 'analysis',
    title: '无信号评价平面图',
    format: 'SVG',
    description: 'TWSC/环形 · LOS 色块 · 非完整 HCM',
    modes: ['analysis', 'signal'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'unsignalized-md',
    category: 'analysis',
    title: '无信号评价简报',
    format: 'MD',
    description: '腿部能力表 + 说明',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal'],
  },
  {
    id: 'unsignalized-csv',
    category: 'analysis',
    title: '无信号腿部 CSV',
    format: 'CSV',
    description: 'volume/capacity/vc/delay/los',
    modes: ['analysis'],
    requires: ['channel', 'flow', 'signal'],
  },

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
    id: 'xsection-report-md',
    category: 'drawing',
    title: '横断面构成报表',
    format: 'MD',
    description: '总宽/分项/占比 · 与渠化进口同源',
    modes: ['xsection'],
    requires: ['channel', 'selected'],
  },
  {
    id: 'xsection-report-csv',
    category: 'drawing',
    title: '横断面构成 CSV',
    format: 'CSV',
    description: '分项宽度与占比',
    modes: ['xsection'],
    requires: ['channel', 'selected'],
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
    description: '最多 4 图 A4 矢量拼版（工程预设含渠化图框）',
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
