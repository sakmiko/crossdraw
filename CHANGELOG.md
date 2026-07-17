## 0.5.140 — Export PNG on boards + lazy params workspaces

- Analysis / Compare workspace「导出 PNG」on primary ECharts hosts (ExportCenter still canonical).
- Lazy-load Analysis/Compare/XSection workspaces under params Suspense (faster first paint).
- Continues UX 20-round: discoverability + performance, no new domain methods.

## 0.5.139 — Density, focus, stage chrome

- Signal/params sticky section titles under param-jump; sticky table heads; denser stage download chip.
- Focus-visible rings for keyboard users; stage empty contrast retained.
- Band back control marked primary; analysis jump includes A4/VISSIM anchor.
- Continues 20-round UX push (layout clarity, not new domain claims).

## 0.5.138 — Command palette, keyboard map, param-jump navigation

- Command palette redesigned: DESIGN tokens, groups, ↑↓/Enter, footer shortcut legend; Ctrl+K / Ctrl+E.
- LeftNav shows keys 1–7; number keys switch modes (skip when typing in inputs); 7 = 绿波.
- Sticky **param-jump** chips on Signal/Flow/Analysis/Compare/XSection/Band/Channel for long params.
- Mode head: short mode title + scheme name (breadcrumb hidden).
- Topbar menus: token styling + outside-click/Esc close; stage empty hints force-visible.
- Light-theme readability remains (0.5.137 tokens).

## 0.5.137 — Light theme readability + shell slim + empty states

- **Critical**: light theme text was invisible (`--text: var(--bg)` from CSS bulk replace). Restored DESIGN tokens `--text/#0f172a`, `--chart-text`, `--panel-hover: #e2e8f0`; dark `--text-secondary: #cbd5e1`.
- ECharts defaults theme-aware (CSS vars + data-theme observer).
- Mode empty-state messages (flow/signal/analysis/xsection) when scheme missing; Suspense fallback uses theme tokens; restore `lazy` import.
- App import slim: export handlers self-import static modules; App injects runtime state only (~971 LOC shell).
- `applyFullSchemeOptimize` is store runtime dep for export handlers.

## 0.5.136 — Maintainability, performance, declutter (full ship)

### Architecture
- Extract ExportCenter handlers → `src/io/buildExportHandlers.ts` (App shell ~2200→~1274 LOC).
- Lazy-load `BandPage` via React.lazy + Suspense.
- Drop unused `BandWorkspace` import from App (green wave is BandPage-only).
- Export audit script also scans `buildExportHandlers.ts`.

### Charts / UX
- Central ECharts interaction chrome: `src/ui/charts/chartDefaults.ts` applied in `EChart` (tooltip, legend, auto dataZoom, toolbox saveAsImage, emphasis).
- Strip scattered per-board SVG/MD/CSV export buttons from Signal / Band / Compare / Flow params; keep ExportCenter (131 ids, handlers 0 missing) + ECharts PNG where wired + Analysis A4/VISSIM.

### CSS / build
- CSS parse fix after density cleanup; version-marker strip; `!important` ~251→148.
- Vite `manualChunks`: echarts / pixi / react / immer; BandPage separate chunk.
- Main index JS ~1.86MB → ~613KB + vendor chunks.

### Tests
- Unit 326/326, E2E 8/8; tests updated for handler extract + declutter (no behavior pin on removed UI strings).

### Honesty
- Domain methods unchanged (Webster/HCM approx, discrete green wave, open VISSIM pack). Schematic engineering tool.


## 0.5.134 — Channel form density

- Horizontal label|control rows; 22px inputs; tighter section gaps.
- Channel params column ~30%; less empty vertical space.

## 0.5.133 — RoadGee-style channel form

- Channel right params rebuilt to reference product: red section titles, two-column rows, disabled gray fields.
- Sections: 道路属性 / 右转渠化 / 进口 / 出口 / 中央隔离 / 非机动车 / 辅路 / 更多 + 分车道明细.
- Direction switcher + 非机动车 设置/取消; no draft/review boards.
- Honesty: cosmetic fields (交叉口大小/曲度/角度辅助) UI-only unless domain-backed.

## 0.5.132 — Channel params compact (cut draft/review boards)

- Remove 渠化出图稿 / 右转渠化审查 boards from right params (export center still has draft/right-turn if cataloged).
- Dense prop tables: 道路 / 进·出口 / 右转 / 辅路 / 分车道; 22px inputs; channel column ~28% width.
- Honesty: params-only density — geometry homology unchanged.

## 0.5.131 — Canvas zoom bar + stage chrome + interactive export group

- CanvasHandle zoomIn/zoomOut/zoomBy; channel strip zoom toolbar.
- Export category `interactive` for all ECharts PNG deliverables.
- Stage border/background unify (light/dark). Schematic UI — not GIS viewer.

## 0.5.130 — Cycle-scan PNG + approach-strip polish

- Export center `echarts-cycle-scan-png` + Signal「周期 C 敏感性」导出 PNG (homology scanCycleSensitivity).
- Approach strip chip density (active ring, lane count, tools). Schematic scan — not full HCM optimizer.

## 0.5.129 — Borrow-left glyph + flow/signal PNG buttons

- `placeBorrowLeftPocket` (homology borrowLeft).
- Flow / Signal workspaces「导出 PNG」aligned with other modes.
- Light-theme echart/params contrast. Schematic — not design-code borrow bay.

## 0.5.128 — Wait-bay glyph + xsection PNG + scheme strip

- `placeWaitBay` for left/through wait areas (homology leftWait/throughWait).
- Export `echarts-xsection-png` + section workspace PNG button.
- Compact scheme switcher (+渠/+流/+信). Schematic paint — not design-code bay.

## 0.5.127 — Band/Compare ECharts PNG + topbar density

- Export center `echarts-band-png` / `echarts-compare-png` (homology BandResult / compare rows).
- Band & Compare workspaces「导出 PNG」buttons.
- Tighter topbar / menu control height. Schematic PNG — not GIS.

## 0.5.126 — Aux road glyph + ECharts PNG export + density

- `placeAuxRoadRibbon` for frontage/aux road (homology auxRoad width/offset/openNear).
- Export center: `echarts-vc-delay-png` / `echarts-flow-ltr-png` / `echarts-phase-timing-png` via off-DOM ECharts PNG.
- Analysis workspace「导出 PNG」; shell params density unify.
- Schematic only — not survey CAD / not second formula set.

## 0.5.125 — Sidewalk ribbon glyphs + channel KPI strip

- `placeRibbonBetween` / `placeCurbStroke` for entry/exit sidewalk + bike (homology widen profile).
- Channel params **KPI strip** (legs / lanes / RT / sidewalk / median).
- Schematic curb ribbons — not survey CAD.

## 0.5.124 — Cycle-scan ECharts + unified responsive shell

- Live `cycleScanOption` on Signal「周期 C 敏感性」(`#cycle-scan-echarts`, homology `scanCycleSensitivity`).
- Unified responsive grid: 1280/1100 left|right tighten; ≤900 stack with stage min-height.
- Schematic fixed-cycle scan — not full HCM optimizer.

## 0.5.123 — Cross-section width ECharts

- `xsectionWidthOption`: component width bars + type share pie (homology section.components / diagramComps).
- XSection `#xsection-echarts` + CrossSectionCharts live board.
- Xsection params metric/table polish. Schematic — not survey CAD.

## 0.5.122 — Compare schemes ECharts

- `compareSchemesOption`: multi-scheme delay bars (LOS color) + v/c line (homology analyzeIntersection rows).
- Compare workspace `#compare-echarts` + CompareCharts live board.
- Dense compare table + 1100px column polish. Not multi-objective commercial optimizer.

## 0.5.121 — Band bandwidth ECharts

- `bandBandwidthOption`: node offsets + green length + forward/backward band (homology BandResult).
- Band page `#band-echarts` under KPI strip.
- Schematic green-wave metrics — not MAXBAND-MIP.

## 0.5.120 — Phase G/Y/AR ECharts + signal params polish

- `phaseTimingOption`: stacked green/yellow/all-red vs cycle C (main phases).
- Signal workspace `#signal-echarts` + SignalCharts interactive board.
- Sticky section titles / number input width on signal params.

## 0.5.119 — Median glyphs + interactive flow L/T/R

- `placeMedianStrip` / `placeFishBellyMedian` in approach rebuild.
- ECharts stacked L/T/R (`flowLtrOption`) on Flow workspace + FlowCharts (homology `flowAlign`).
- Schematic only — not survey CAD.

## 0.5.118 — Channel island glyphs + page polish

- Free-right **ribbon / island / safety disc** as reusable glyphs (`placeChannelRibbon`, `placeChannelIslandArc`, `placeSafetyDisc`).
- Stage chrome + denser params; breakpoints 1100/900 for responsive columns.
- Schematic channelization — not survey CAD / not RoadGee clone.

## 0.5.117 — Stop-line glyph + RoadGee-style band a-scan

- `placeStopLine` double-bar glyph wired into approach rebuild (with zebra/arrows).
- Green-wave **classic / optimized-scan**: `enumerateHalfCycleA` a0=v·C/2, **±100 m @ 10 m** (optimized + fine o1).
- BandPage optimize button documents a-grid; schematic band only — not MAXBAND-MIP.

## 0.5.116 — Zebra glyphs + full left-right layout density

- Approach crosswalks via reusable `placeZebra` (bars along ux).
- **All modes** desktop left diagram | right params (including signal; supersedes vertical stack).
- Control density tokens `--ctrl-h` / `--ctrl-gap` / `--input-num`; hide params hints.
- Narrow ≤960: stage/params stack with min stage height.
- Honesty: layout/geometry schematic; not survey CAD / not RoadGee clone.

## 0.5.115 — RoadGee-aligned glyphs + interactive analysis

- **Reusable glyphs**: fixed-size movement arrows (place by frame); roundabout **circular island** + continuous ring.
- **ECharts** live v/c·delay board on Analysis params + center **交互图** tab (homologous to `analyzeIntersection`).
- **Homology tests**: Cap=S·λ, Vc=V/Cap, HCM d1+d2 identity (RoadGee research doc 10).
- Honesty: engineering schematic; not RoadGee clone / not full HCM software.

# CHANGELOG

## 0.5.114 — 2026-07-16

### 清空间隔审查（黄灯 / 全红）
- `collectIntergreenRows` / `applyIntergreenRecommendations`：ITE 式黄灯与全红推荐
- 信号页看板 +「修正偏短黄/全红」「全部套用推荐」
- 导出 `intergreen-svg|md|csv`

### 诚实边界
- 工程示意（t_pr + v/2a · (W+L)/v）；非完整设计规范库

0.5.113 — 2026-07-16

### 周期 C 敏感性扫描
- `scanCycleSensitivity`：固定周期按 y 分绿，扫描延误 / max v/c
- 信号页看板 +「应用最小延误 C」「应用最小maxVC C」
- 导出 `cycle-scan-svg|md|csv`

### 诚实边界
- 工程固定分绿评价；非完整 HCM 周期优化器

0.5.112 — 2026-07-16

### 多走廊相位差联动
- `linkMultiCorridorOffsets`：全走廊 **连续 / 反向连续 / 相位差扫描** 统一写回
- 绿波顶栏「联动连续」「联动扫描」；多走廊页签结果看板
- 导出 `multi-corridor-link-svg|md|csv`

### 诚实边界
- 各走廊独立变换；非多走廊联合 MIP / 非共享约束求解

0.5.111 — 2026-07-16

### 速度敏感性扫描
- `scanCorridorSpeeds`：固定相位差，扫设计速度 30–80 km/h
- 绿波页签「速度敏感」+ 顶栏「速度扫描」→ 应用最优 v
- 导出 `speed-scan-svg|md|csv`

### 诚实边界
- 相位差固定；仅扫速度；工程离散 · 非 MIP

## 0.5.110 — 2026-07-16

### 相位差扫描
- `scanCorridorOffsets`：自由节点 o 全周期离散扫描，`scoreOffsets` 评 Σb
- 绿波页签「相位差扫描」+ 顶栏「扫描并应用」
- 导出 `offset-scan-svg|md|csv`

### 诚实边界
- 工程离散扫描；非 MAXBAND-MIP / 非多变量联合优化

## 0.5.109 — 2026-07-16

### 关键进口高亮
- `criticalApproachBoardSvg`：按 v/c 排序 · CRITICAL 徽章
- 信号页 / 分析页实时看板；导出 `critical-approach-*`

### 比选页 × 配时方法
- CompareWorkspace 嵌入当前方案 Webster/HCM/等绿/固定C 比选看板
- 与信号页同源 `buildTimingCompareRows`

### 诚实边界
- 关键 = 分析车道组最大 v/c；非完整关键路径优化

0.5.108 — 2026-07-16

### 进口道储存长度校核
- `collectStorageCheckRows`：排队示意长度 vs 入口展宽段
- 状态：正常 / 紧张(>85%) / 溢出(>100%)
- 分析页看板 + 导出 `storage-check-svg|md|csv`

### 诚实边界
- 排队为红灯到达工程式；可用长度=展宽段（无展宽按 20m 示意）
- 非轨迹仿真、非完整进口道设计规范库

0.5.107 — 2026-07-16

### 损失时间 L 看板
- `lostTimeBoardSvg`：L=n×ℓ+ΣAR · C₀–Y 曲线
- 信号页 / 分析页实时展示 + 导出 `lost-time-*`

### 行人 Walk/FDW 优化
- `pedTimingOptBoardSvg`：当前 vs 推算；短绿标 !
- 「应用 Walk/FDW」写回相位；导出 `ped-timing-opt-*`

### 诚实边界
- Webster 损失与行人时距为工程示意；非实测/非完整国标控制器

0.5.106 — 2026-07-16

### 配时方法比选看板
- `timingCompareBoardSvg`：Webster / HCM延误 / 等绿 / 固定C 并排 + 推荐★
- 信号页「多方法比选」后显示看板 + 表 + SVG/MD/CSV 导出
- 导出中心：`timing-compare-board-svg|md|csv`

### 搭接相位审查
- `overlapReviewSvg`：搭接不计入主环 Σ；G/Y/AR/放行
- 信号页常驻审查区；导出 `overlap-review-*`

### 诚实边界
- 比选为同需求下工程近似对比；搭接为示意，非完整搭接控制器

0.5.105 — 2026-07-16

### 调研补强
- `docs/research/07-online-methods-supplement-20260716.md`：方法要点与竞品动作映射

### 关键流 Y 分解
- `criticalYBoardSvg` + MD/CSV；信号页实时条形图、「Y分解图」「一键全方案」
- 导出：`critical-y-board-svg|md|csv`

### 排队储存审查
- 红灯到达示意排队长度；分析页看板 + MD/CSV
- 导出：`queue-storage-*`

### 净图/全方案入口
- 分析页：一键全方案优化 · 渠化/流向/评价净图快捷按钮
- 同源：`computeSchemeY` / `analyzeIntersection` / `runFullSchemeOptimize`

### 诚实边界
- Y/排队为工程示意；非仿真轨迹；非商业黑箱

0.5.104 — 2026-07-16

### 调研与文档
- `docs/research/06-competitor-optimization-survey-20260716.md`：竞品·痛点·论文/教材可落地方法·出图规则
- README / docs 中心 / 迭代日志 / 阶段复盘同步至 v0.5.104

### 一键全方案优化（中优先）
- `runFullSchemeOptimize`：Webster 配时 + 连续相位差 + 多走廊优化
- store `applyFullSchemeOptimize` 写回工程；导出 `full-scheme-optimize-md`

### 净图出图
- `cleanDrawingPack`：渠化/流向/评价/配时/时距/路网 SVG，剥离脚注与长说明
- 导出中心：`clean-*-svg`

### 诚实边界
- 优化为工程合成管线；净图启发式去字；非商业黑箱 / 非完整 HCM

## 0.5.103 — 2026-07-16

### 绿波页顶部工具栏重排
- 顶栏改为**两行**：第一行返回/标题 + 操作按钮；第二行视图页签
- 去掉 `height: var(--shell-top)` 硬卡 50px 导致按钮贴顶/挤扁
- 按钮统一 `height: 34px` 垂直居中；页签 `height: 32px` 可换行


## 0.5.102 — 2026-07-16

### 多走廊绿波报告包
- `professionalMultiCorridorReportSvg`：带宽柱图 + 协调指数表（A–F）
- `collectCorridorReportRows` = measureCorridor + coordinationIndex
- 绿波「多走廊」页签：报告 SVG/MD/CSV + 简图导出
- 导出中心：`multi-corridor-report-svg|md|csv`

### 诚实边界
- 协调分为工程合成指标，非国标分级；带宽为弧相交示意，非 MAXBAND-MIP


## 0.5.101 — 2026-07-16

### 相位序号图 + 右转渠化审查
- `professionalPhaseNumberBoardSvg`：单环顺序编号 / 双环阶段板
- `collectRightTurnRows` + 审查 SVG/MD/CSV：各进口右转 R/道宽/安全岛
- 信号页「导出相位序号」；渠化页「右转审查图」扁平两大区
- 导出中心：`phase-number-board-*` · `right-turn-review-*`

### 诚实边界
- 相位序号为工程示意编号，非完整 NEMA 映射
- 右转审查为参数表示意，非设计规范自动校核


## 0.5.100 — 2026-07-16

### 全站布局系统统一（响应式精调）
- 合并 0.5.81–0.95 叠床架屋的 page-fill / shell / signal 覆盖规则为 **一套** 布局系统
- 断点：1101 桌面左右 · ≤1100/960/900/720/420 阶梯堆叠
- **仅信号**始终上下；渠化/流量/分析/比选/断面桌面左右比例分模式
- 参数区扁平分区标题、工具栏间距、表单 field-row 窄屏单列
- 绿波页侧栏宽度/内边距与主壳对齐；去刺眼红色 subpanel 摘要色

### 诚实边界
- 布局精调，非功能算法变更


## 0.5.99 — 2026-07-16

### 通行能力 / 饱和度矩阵
- `professionalCapacityMatrixSvg`：车道组 v/c 矩阵 + KPI + 迷你 v/c 条
- 分析页扁平「通行能力矩阵」/ CSV；导出中心 3 项
- 与 `analyzeIntersection` 同源；HCM/Webster 工程近似


## 0.5.98 — 2026-07-16

### A4 工程拼版（联通渠化出图）
- `collectEngineeringPrintPanels`：默认四联 **渠化图框 · 流向 · 配时 · 管控**
- 打印预览 `collectPrintPanels` 改用工程预设（含图框）
- 分析页 / 渠化页「A4 工程拼版」→ SVG + HTML + 清单 MD
- 导出中心：`engineering-print-a4`

### 诚实边界
- 示意拼版，非测绘出图


## 0.5.97 — 2026-07-16

### 渠化出图图框（导出稿）
- `buildChannelDraftSheet`：双线边框 · 标题栏 · 比例尺 · 指北 · mesh 平面
- 渠化参数区扁平「渠化出图稿」预览 + 导出 SVG/MD（不破坏画布净几何）
- 导出中心：`channel-draft-svg` · `channel-draft-md`
- 图幅 A3/A4 横纵可选（随 display.paperSize）

### 诚实边界
- 示意比例，非测绘出图；交互画布仍无图框/指北/比例尺


## 0.5.96 — 2026-07-16

### 双环栏审查看板
- `professionalDualRingBoardSvg`：KPI + R1/R2 时序条 + 屏障明细表 + 相位序
- 信号页扁平区：勾选双环后即时看板；SVG/MD/CSV 导出
- 导出中心：`dual-ring-board-svg|md|csv`
- 同源：`buildDualRingAlignment`（阶段=max(R1,R2)，Σ≈C 闭合）

### 诚实边界
- NEMA 风格工程示意，非完整 dual-entry 控制器 / 屏障转移引擎


## 0.5.95 — 2026-07-16

### 功能页去套层（两大区）
- 各模式参数区取消 `details/subpanel` 折叠套层与多层 `card`
- 结构只保留 **图示区 page-fill-stage | 参数区 page-fill-params**
- 分区改为扁平 `rg-section-title` 标题，不再层层嵌套
- 同步：行人审查看板、环岛布局图（v0.5.94 能力）

### 边界
- 顶栏菜单仍用 dropdown（不属于页面功能区套层）


## 0.5.93 — 2026-07-16

### 相位冲突审查看板 + 一键 VISSIM
- `professionalConflictBoardSvg`：矩阵 + 冲突点图 + 全方案命中表（与 releases 同源）
- 信号页：冲突审查看板实时预览 · 矩阵/点图/CSV 导出
- `downloadVissimPack`：七文件一键下载；分析页「一键 VISSIM 包」置顶
- 导出中心：`conflict-board-svg` · `conflict-board-csv` · `vissim-pack-oneclick`

### 依据 / 诚实边界
- 冲突规则见 domain conflictMatrix / detectPhaseConflicts（教材相位冲突检查表）
- VISSIM：**开放交换 XML+CSV，非 PTV 专有 .inpx 二进制**


## 0.5.92 — 2026-07-16

### 评价四指标平面合图
- `professionalAnalysisPlanPackSvg`：LOS / 延误 / 排队 / 饱和度 2×2 + KPI + 车道表
- 分析页工具栏：四指标平面合图 · 合集 MD · 车道 CSV · 多页工程报告（置顶）
- 导出中心：`analysis-plan-pack-svg|md|csv`
- 单指标平面导出分辨率 720；与 `analyzeIntersection` 同源

### 依据
- HCM/Webster 延误与 v/c；LOS 延误分级；RoadGee 评价平面图风格

### 诚实边界
- 工程近似评价，非微观仿真


## 0.5.91 — 2026-07-16

### 流量流向高分辨率报告
- `professionalFlowReportSvg`：飘带图 + OD 分向表合图（与 flowAlign 同源）
- 流量页：高分辨率流向报告 / OD MD / OD CSV；Σ LTR KPI
- 导出中心：`flow-report-hires-svg` · `flow-od-md` · `flow-od-csv`
- 中心流向图尺寸加大；分析页多页工程报告入口保持

### 依据
- 交叉口流量流向图教材表达；PHF/大车换算见 convertVolumes

### 诚实边界
- 非交通仿真 OD 矩阵估计；示意流向几何


## 0.5.90 — 2026-07-16

### 绿波时距图高分辨率深包
- `professionalTimeSpaceSvg`：1280×720 教材风格时距图（绿灯窗、上下行轨迹、半带宽色带、路段 L/t）
- 绿波「时距图」页：高分辨率主图 + 交互悬停折叠；导出 高分辨率 SVG / 交互 SVG / MD / CSV
- 导出中心：`timespace-hires-svg` · `timespace-report-md` · `timespace-report-csv`
- 与 `measureCorridor` / 带宽计算同源；改相位差/速度即热更新

### 依据
- 《交通管理与控制》干道协调时距图；Little MAXBAND 带宽思路（工程色带，非 MIP）

### 诚实边界
- 非 GIS；非商业 MAXBAND-MIP


## 0.5.89 — 2026-07-16

### 信号饱和度 KPI + 管控看板 + 一键优化
- 实时 KPI：Y、均/最大 v/c、延误、LOS、关键转向（`analyzeIntersection` 同源）
- **一键优化配时**：Webster/当前算法写回相位；优化预览 Δv/c·Δ延误
- **管控看板 SVG**：KPI 条 + 放行管控矩阵 + 配时条（教材风格）
- 导出中心：`signal-control-board` / `saturation-kpi-md` / `optimize-preview-md`

### 依据
- Webster (1958) 最优周期；HCM 延误/v/c 工程近似；管控图与 releases 一一对应

### 诚实边界
- 非完整 NEMA；非商业黑箱优化器


## 0.5.88 — 2026-07-16

### 绿波路网高分辨率预览
- 1200×440 矢量路网：双幅路、路口十字、λ/o、段长/行程时间/Δo、上下行协调箭头
- 绿波「路网预览」页签 + 导出中心 `corridor-network-svg`
- 链式桩号布局，**非 GIS 底图**（依据教材干道协调示意图）

### 五路交叉口模板
- 新建 → 五路；72° 五进口 + 五相位示意 + 流量键对齐

### 承接 0.5.87
- 横断面报表 MD/CSV/辅路条带

### 诚实边界
- 路网为工程示意；五路非完整多路仿真；MAXBAND 仍为离散搜索


## 0.5.87 — 2026-07-16

### 横断面深包
- 构成报表（宽度/占比）· 标准断面图预览（含辅路条带）
- 导出 MD / CSV / SVG；导出中心两项报表
- KPI：辅路、特殊标线（左待/直待/借道）；滑条回写仍同源

### 诚实边界
- 断面为工程示意，非勘察放样图；辅路为附加条带


## 0.5.86 — 2026-07-16

### 方案比选记分卡深包
- 中心图 + 参数区：多方案延误/v/c 卡片、基准方案、Δ 表、推荐
- 导出记分卡 SVG + 差量 MD；导出中心两项
- 继续保持：仅信号上下，其余桌面左右

### 诚实边界
- 同源评价模型比选，非商业多目标优化器


## 0.5.85 — 2026-07-16

### 布局纠正（重要）
- **仅信号页**保持上下布局（上图下参）
- 流量 / 渠化 / 分析 / 比选 / 断面：桌面恢复 **左右分栏**
- 窄屏（≤1100px）非信号页仍可上下堆叠以便阅读

### 无信号评价深包
- 信号/分析：开关「无信号控制」
- 中心平面图 + 能力条图；导出 SVG/MD/CSV
- 导出中心三项

### 诚实边界
- TWSC/环形为工程示意，非完整 HCM/SIDRA


## 0.5.84 — 2026-07-16

### 绿波 MAXBAND 报告可视化
- 新页签 **MAXBAND**：相位差茎叶图 + 节点表 + b↑/b↓/比
- 导出 SVG / MD / CSV；「优化并应用」切 maxband-discrete 并写回相位差
- 导出中心：`maxband-report-svg|md|csv`

### 流量页
- 桌面保持 **左图右表**（仅信号页为上下布局）

### 诚实边界
- MAXBAND 为工程离散搜索，非商业 MIP


## 0.5.83 — 2026-07-16

### 信号页上下布局
- 信号功能页强制 **上图下参**：相位灯态/配时条在上，相位表·放行·自动配时在下
- 全宽度响应式；图示区约 42–46vh，参数区可滚动铺满余下高度
- 灯态板随视口加宽；保留自动配时/Y/生成/清空

### 诚实边界
- 布局优化；非完整 NEMA


## 0.5.82 — 2026-07-16

### 信号自动配时深包（RoadGee 对齐）
- **计算Y值**：相位/双环关键流量比明细 + 面板报告
- **生成方案**：按进口生成保护相位（L/T/R+行人）
- **清空方案**：绿灯压至最小绿，保留结构/放行
- **设计参数**：目标VC · 启动损失 · 设计PHF · 锁定设计周期
- **自动配时**：Webster/HCM/等绿/固定C 写入相位 → **中心灯态图同源更新**
- **导出配时报告** Markdown；分析平面图 **导出数据** CSV

### 诚实边界
- 非完整 NEMA；生成方案为工程示意相位，非国标图集


## 0.5.81 — 2026-07-16

### 全页响应式布局（优先级）
- **移除**原方案树列 / 功能轨占位，主区 = **功能导航 + 全宽工作区**
- 各功能页统一 `page-fill`：**上/左图示 + 下/右参数**，宽屏左右分栏，窄屏上下堆叠
- 渠化/断面：顶栏 **进口芯片条**（替代侧栏进口列表）
- 流量页：RoadGee 式分组表（绘图属性 / 车道属性 / 转向流量 / 饱和流率）+ 图示样式联动
- 方案切换仅在**顶栏下拉**；静默自动保存不变

### 诚实边界
- 非完整 RoadGee；布局为工程工具壳，非商业 UI 复刻


## 0.5.80 — 2026-07-16

### 布局：方案顶栏 + 信号上下分栏
- **方案树移至顶栏** 渠化/流量/信号 下拉切换（+复制方案）
- 原方案树列改为 **页面功能轨**（进口列表 / 模式说明）
- **信号页上下布局**：上=灯态配时图，下=相位参数与放行芯片；右侧栏隐藏

### 信号放行矩阵（RoadGee 式）
- 相位编辑区：各进口 **U/L/T/R + 行人** 图标芯片切换放行（含掉头）
- 点击即时改 `phase.releases` / 行人过街 → **中心灯态配时图同步**
- 独占行人勾选保留；样式分区「机动车 / 行人」

### 诚实边界
- 非完整 NEMA 信号机；放行为工程示意矩阵


## 0.5.79 — 2026-07-16

### 按页定制中心图 + 静默实时自动保存
- **中心舞台**按模式切换：渠化=交叉口建模；流量=流向图；信号=灯态配时条；分析=LOS/延误/排队/饱和度；断面=横断面；比选=指标图
- 左侧进口树仅渠化/断面显示；右侧为参数表（图示上移中心，文字更全）
- **静默自动保存**：dirty 后 400ms 写入 localStorage；启动自动恢复；去掉「未保存/保存」提示与恢复弹窗
- 导出工程文件仍在「文件」菜单；图随参数变、无水印

### 诚实边界
- 非完整 RoadGee；自动保存为浏览器本地草稿非云端

## 0.5.78 — 2026-07-16

### 渠化参数表单（RoadGee 式分组）
- 右侧进口编辑按道路属性/右转渠化/进口/出口/中分/非机/辅路分组；setExitLaneCount

0.5.78 — 2026-07-16

### 渠化参数表单（RoadGee 式分组）
- 右侧进口编辑按 **道路属性 / 右转渠化 / 进口属性 / 出口属性 / 中央隔离 / 非机动车 / 辅路 / 更多 / 分车道** 分组
- 红色分区标题、双列表单；出口车道数可改（`setExitLaneCount`）
- 参数写入 domain，画布即时重绘；去掉冗长说明

### 诚实边界
- 非完整 RoadGee 几何参数全集（穿越方式等未建模字段不伪造成可编辑）


## 0.5.77 — 2026-07-16

### 信号页 RoadGee 式灯态配时板
- 多相位十字灯态图（放行箭头绿显）+ 周期轴配时条（G/Y/λ）
- 改相位 G/Y/放行 → 图即时更新；下载图片；导出中心 `roadgee-signal-board`
- 自动配时区显示 **Y值** / C / 相位数；一键优化改称「自动配时」
- **无水印**

### 诚实边界
- 灯态为工程示意，非仿真动画；Y 为临界流率之和示意


## 0.5.76 — 2026-07-16

### RoadGee 式出图（无水印）
- **流量流向图**：彩色转向飘带 + 进口合计/分流数值，表改图改；可调粗细/字号/颜色方案；下载 SVG
- **平面评价图**：服务水平 / 延误 / 排队 / 饱和度 四模式，中心综合指标 + 进口转向色块；与分析表同源
- 导出中心：`roadgee-flow-svg` · `roadgee-plan-los|delay|queue|vc`
- **无**试用版水印

### 诚实边界
- 示意工程图，非完整 RoadGee 复刻；流向曲线为工程示意路径


## 0.5.75 — 2026-07-16

### UI 矢量图标（附加）
- 自绘统一极简圆润描边 icon（24×24，stroke 1.75，round cap）
- 左侧导航、顶栏菜单/撤销重做/主题、页面标题、信号关键操作、绿波工具栏接入
- 无第三方 icon 字体依赖


## 0.5.74 — 2026-07-16

### 画布纯几何（附加）
- 去掉图例、图框标题栏、指北/比例尺、停车线桩号、B= 总宽、车道号 E1、进口方位参数等**画面上的参数说明**
- 仅保留交叉口实体：路面、标线、人行道/横道、导流岛、转向箭头

### 弱项深化（贴近 RoadGee 能力面）
- 行人 Walk/FDW 按横道宽度推算 + 信号页一键应用
- 双环屏障关键 Y 配绿
- 转向饱和能力表、损失时间 L、PHF 示意
- 排队长度估算、协调指数、连续相位差、MAXBAND 报告表
- 分析页增加「转向能力 · 排队 · 损失时间」折叠区

### 诚实边界
- 非完整 NEMA / 非 PTV 私有 inpx / 非商业 MAXBAND-MIP
- 画布去标注不表示出图套件删除（图例函数仍保留但未挂交互网格）


## 0.5.73 — 2026-07-16

### 左侧功能导航（可折叠）
- 最左侧增加窄侧栏：渠化 / 流量 / 信号 / 断面 / 分析 / 比选 / 绿波，**每项对应独立功能页**
- 可折叠为 **仅图标** 宽度；状态写入 localStorage
- 右侧去掉模式横条，改为页面标题；绿波专页同样挂载左侧导航
- 布局：`nav | 方案树 | 画布 | 参数`


## 0.5.72 — 2026-07-16

### 人行道/横道 + 绿波表格 + 去地理
- **人行横道**：斑马线沿进口宽度横跨路面（非沿路纵向乱铺）；条带方向修正
- **人行道**：双侧沿展宽轮廓连续铺设，非机在出口侧叠放，去掉死链/多余段
- **绿波**：默认「路口参数表」集中填 λ/C/相位差/桩号/路段；顶部实时 KPI 条
- **去掉地理位置**：移除渠化底图经纬度填写；绿波节点 lat/lon 输入去掉；走廊图仅桩号展开

### 布局
- 右侧参数区压缩字号与间距；长说明隐藏；计算结果数字加大加亮


## 0.5.71 — 2026-07-16

### 渠化几何修正 + 绿波独立页
- **线色/间距**：统一车道路面色；缘石/边线/车道虚线层次清晰；实线边线 + 虚线分车道
- **异形衔接**：Y/斜交停车线距离随锐角加大；路口缘石闭合路径按角平分与角点半径重算，减少断链/飞弧
- **绿波专页**：参考 RoadGee 分页——进入「绿波」为全宽独立页（走廊列表 | 时距/走廊图/节点/对比），不再挤在单点三栏里
- 交叉口设计与干道绿波职责分离


## 0.5.70 — 2026-07-16

### UI 可读性与布局
- **顶栏重排**：单行对齐；新建/文件/导出为二级下拉，去掉重复保存与挤在一排的模板按钮
- **参数区折叠**：信号相位表、双环、优化操作收入 `details` 二级分区
- **减噪**：面板徽章精简；图表标题/副标题缩短；走廊/行人/双环图去掉叠字参数与冗长脚注
- **样式**：菜单、保存状态胶囊、分区标题层级


## 0.5.69 — 2026-07-16

### 屏障关键 Y · 无信号/环岛能力 · 鱼腹中分
- **双环关键流量比 Y**：按屏障 max(Σy_R1, Σy_R2) 累加；Webster/分绿联立
- **无信号评价**：TWSC 间隙接受示意 + 环形进口能力示意；分析页图与 MD
- **鱼腹式中分带**：近停车线放宽、远端收窄的几何体 + 标注
- 诚实边界：非完整 NEMA dual-entry / 非 SIDRA / 非 HCM 全章


## 0.5.68 — 2026-07-16

### 多 Barrier · Webster 双环联立 · Y 角部
- **多屏障分配**：单屏障 / 双屏障自动分配；相位级 R1/R2 + B0–B3
- **平衡双环 / 闭合周期**：环时长取 max 对齐；C = 阶段和
- **Webster/HCM 等优化**：双环启用时自动平衡屏障并写回阶段闭合说明
- **Y 型模板**：135°/225° 分叉、主线右转渠化、夹角标注更清晰
- 非完整 NEMA 双入口并发机


## 0.5.67 — 2026-07-16

### NEMA 风格双环 + 斜交角部
- **双环栏**：Phase.ring / barrierIndex + SignalScheme.dualRing
- 闭合规则：阶段时长 = max(R1,R2)，Σ阶段 ≈ C（与 timingAlign 同源）
- 信号页：启用双环、自动分配、逐相位 R1/R2
- 专业双环栏图（双轨并发 + Barrier 分割）
- **斜交/锐角角部**：夹角标注、锐角加严缘石半径与辅助线


## 0.5.66 — 2026-07-16

### 弱项深化 + 专业呈现
- **环形交叉口 CAD**：多车道环道、导流岛、让行三角、人行斑马、环道标注（与进口宽度联动）
- **行人过街环图**：相位聚焦 Walk/FDW 进口面示意；信号页 + 导出中心
- **导出中心**：Vissim 开放交换包、多页工程报告、行人环图三项门禁导出
- 行人相位条视觉专业级 chrome


## 0.5.65 — 2026-07-16

### 弱项深化（内容重、呈现专业）
- **VISSIM**：开放交换 `.inpx.xml` + CSV + summary（诚实非私有二进制）
- **MAXBAND 离散搜索** `maxband-discrete`：锁定相位差 + 网格/坐标下降 + 精修
- **走廊选点示意**：lat/lon 节点表 + 专业走廊地图 SVG
- **辅路 CAD 示意**：进口辅路参数与几何带
- **专用行人相位**：一键添加 exclusive 行人相位
- **断面交互改宽**：滑条回写渠化，色带高亮
- **多页工程报告 HTML**：浏览器打印/另存 PDF（5 页）
- 行人/非机柱图、报告与图表视觉层次专业化


## 0.5.64 — 2026-07-16

- 20 轮补强收官复盘 docs/plans/phase-review-0.5.64.md

## 0.5.63 — 2026-07-16

- E2E：行人独占；版本锚点

## 0.5.62 — 2026-07-16

- 单测：Vissim 骨架 / multimodal 图 / 比选排序

## 0.5.61 — 2026-07-16

- 渠化：非机动车道宽度编辑


## 0.5.60 — 2026-07-16

- 阶段复盘 0.5.55；版本锚点

## 0.5.59 — 2026-07-16

- 比选表排序：延误 / v/c / 名称

## 0.5.58 — 2026-07-16

- Vissim 导入骨架包（README + CSV，非真 .inpx）

## 0.5.57 — 2026-07-16

- docs/plans/phase-review-0.5.55.md

## 0.5.56 — 2026-07-16

- chartRegistry 登记 multimodal-bars


## 0.5.55 — 2026-07-16

- E2E 冒烟增加断面；流量含行人/非机断言

## 0.5.54 — 2026-07-16

- （并入）工作区拆分稳定性

## 0.5.53 — 2026-07-16

- 行人/非机柱状示意图 multimodalBarSvg

## 0.5.52 — 2026-07-16

- 状态栏：校验计数、配时闭合

## 0.5.51 — 2026-07-16

- 状态栏信息密度提升


## 0.5.50 — 2026-07-16

- 横断面总宽与渠化构成同源校验 sectionAlignsWithApproach

## 0.5.49 — 2026-07-16

- （并入）断面构成明细表已在 XSectionWorkspace

## 0.5.48 — 2026-07-16

- 校验面板：计数摘要 + 问题 code 展示

## 0.5.47 — 2026-07-16

- 行人「独占」开关：人车冲突升为禁止


## 0.5.46 — 2026-07-16

- FlowScheme.multimodal 行人/非机流量骨架
- 流量页可编辑；机动车分析仍只用 volumes

## 0.5.45 — 2026-07-16

- XSectionWorkspace 拆分；断面 KPI 含人行/非机


## 0.5.44 — 2026-07-16

- CompareWorkspace：方案比选从 App 拆出
- 六大模式工作区组件齐全（除断面仍内联）


## 0.5.43 — 2026-07-16

- E2E 多页冒烟：壳层/渠化/流量/信号/分析/绿波/比选
- 截图回归 docs/screenshots/00–06


## 0.5.42 — 2026-07-16

- AnalysisWorkspace：评价分析面板从 App 拆出
- App.tsx 再减约 130 行（~1210）


## 0.5.41 — 2026-07-16

- BandWorkspace：绿波侧栏/节点表/时距图从 App 拆出
- App.tsx 再减约 240 行（~1340）


## 0.5.40 — 2026-07-16

- ChannelWorkspace：渠化底图 + 进口编辑从 App 拆出
- App.tsx 再减约 600 行，可维护性提升


## 0.5.39 — 2026-07-16

- 阶段复盘 docs/plans/phase-review-0.5.38.md
- FlowWorkspace 从 App 拆出（流量表/图/同源徽章）


## 0.5.38 — 2026-07-16

- 行人–机动车并发冲突校核（右转/对向左转/邻向）
- 独占行人升级为禁止；信号页徽章与明细表
- 并入 detectPhaseConflicts / 工程校验


## 0.5.37 — 2026-07-16

- 相位行人过街：按进口面勾选 pedestrian[]
- 行人 Walk/FDW 相位条（与 G 同源）
- .rtp 兼容旧文件；信号工作区「行人」按钮


## 0.5.36 — 2026-07-16

- 冲突点示意图：按方位路径 + 相交冲突点
- 当前相位放行高亮；与冲突矩阵规则同源
- 导出冲突点 SVG；信号工作区按钮


## 0.5.35 — 2026-07-16

- 绿波走廊列表侧栏：KPI 卡片切换
- 批量优化全部走廊（保留锁定 o）
- optimizeAllCorridors domain API


## 0.5.34 — 2026-07-16

- 渠化图注：进口车道编号 E1…（中分→路缘）、出口 X1…
- 停车线桩号 K0+xxx.x 与 SL 距离标注
- 进口方向码 N/E/S/W；图例补充桩号/车道编号


## 0.5.33 — 2026-07-16

- 分析明细表：进口/转向筛选、最小 v/c·延误、列排序
- CSV 导出与当前筛选/排序列对齐；行级 LOS
- Excel 全量表增加 LOS 列


## 0.5.32 — 2026-07-16

- 信号工作区拆至 SignalWorkspace.tsx（App 减负）
- 信号编辑/比选/冲突图/关键 y 面板 props 接线


## 0.5.31 — 2026-07-16

- 冲突矩阵 SVG + 全相位审查 Markdown 导出
- A4 打印拼版纳入冲突矩阵
- 阶段复盘 docs/plans/phase-review-0.5.30.md


## 0.5.30 — 2026-07-16

- 冲突矩阵高亮当前相位放行组合与相悖对
- 相位切换条 + 相悖明细表（与 detectPhaseConflicts 同源）
- 信号页「相位相悖」状态徽章


## 0.5.29 — 2026-07-16

- 可变车道开关与图面黄色标注
- 车道组合并/拆组；laneGroups 与转向同步
- 分析：多车道共享饱和流 + 可变车道 0.85 系数


## 0.5.28 — 2026-07-16

- 多走廊带宽对比图/表（measureCorridor 同源）
- 导出多走廊对比包 SVG+JSON+MD
- 导出中心 band-multi-compare


## 0.5.27 — 2026-07-16

- 绿波多走廊：bandCorridors[] + activeBandId
- 新建/复制/删除/切换走廊；名称编辑
- 旧 .rtp 自动归一为单走廊列表


## 0.5.26 — 2026-07-16

- 展宽几何与 WidenParams 全量对齐（取消 0.35 缩水系数）
- 进口/出口展宽段长、渐变、车道数、单宽独立 UI
- 图面展宽标注与段尽/渐尽站位刻度


## 0.5.25 — 2026-07-16

- 右转渠化参数扩展：渠化岛宽、右转道宽、岛偏移、样式
- 行人安全岛：开关/半径/退距/岛面/让行三角，几何与标注联动
- .rtp 旧文件自动补全 rightTurn 默认字段


## 0.5.24 — 2026-07-16

- A4 打印拼版预览（2×2 矢量面板）
- 导出中心「A4 打印拼版」+ 顶栏入口
- 导出拼版 SVG / 打印 HTML


## 0.5.23 — 2026-07-16

- chartRegistry：图种/数据源/模式/导出 id 映射，便于维护

## 0.5.22 — 2026-07-16

- LOS 色带与 HCM 延误阈值同源（losLegend）；阈值标注在图下

## 0.5.21 — 2026-07-16

- 渠化图：CAD 式图例、双线框、指北针、多栏标题栏、0–25–50m 比例尺

## 0.5.20 基线复盘

- docs/plans/phase-review-0.5.20.md


## 0.5.20 — 2026-07-16

- 浅色主题图表对比度：统一 chartTheme 重映射
- 方案树层次：渠化 → 流量 → 信号节点样式与当前态
- 时距图浅色轴网加深


## 0.5.19 — 2026-07-16

- UI：检查器层次条、间距/字体密度收束
- 导出中心串联配时闭合 / 流量同源 / 分析同源门禁
- 导出项缺条件原因更具体


## 0.5.18 — 2026-07-16

- 流量表与柱状图/流向图数值同源（flowAlign）
- 图示可选自然 veh/h 或高峰 pcu/h（大车/PHF）
- 表/图同源徽章 + 流向图内嵌数值表


## 0.5.17 — 2026-07-16

- 放行矩阵与相位 L/T/R 按钮逐格对齐（同源 releaseAlign）
- 管控图单元格标签规范化 L·T·R；内嵌矩阵明细表
- 信号页对齐提示


## 0.5.16 — 2026-07-16

- 信号相位表 ↔ 配时图/环栏图字段同源对齐
- Ring-Barrier 时间轴改为周期 C；搭接不计入主环
- 配时闭合徽章 + 配时图内嵌相位明细表


## 0.5.15 — 2026-07-16

- 绿波相位差可编辑 + 锁定（优化时保留）
- KPI/时距图按当前相位差 measureCorridor 重算（含锁定后）
- 分析页图/表同源校验徽章


## 0.5.14 — 2026-07-16

- 绿波带宽：圆环弧相交精确度量（替代启发式 cover）
- 取消带宽“路段均方差缩减”失真；上/下行带宽秒数可复验
- 时距图：工程刻度 timeTicks、跨周期绿窗分段、导出与交互同几何


## 0.5.13 — 2026-07-16

- 专业图表精度：配时图时间轴=周期 C、秒级标注、ΣG+Y+AR 闭合检查
- 延误均匀项对齐 HCM d1 简化式；v/c 色阶与制图规范文档
- OSM 底图骨架（渠化页开关 + 经纬度写入 .rtp）


## 0.5.12 — 2026-07-16

- 统一「导出中心」：分类清单、可用性门禁、当前模式优先
- 一站导出图面/信号/评价/比选/绿波/Vissim/数据
- 顶栏入口（后续可绑 Ctrl+E）


## 0.5.11 — 2026-07-16

- 标准横断面专业矢量图（尺寸链、进/出口箭头、图例）
- 断面类型占比条 + KPI 卡片
- 与渠化参数热同步；导出标准断面 SVG


## 0.5.10 — 2026-07-16

- 比选：并排配时图（最多 4 方案绿黄红条）
- 比选：延误/v/c 双指标图
- 导出并排配时图 SVG 包


## 0.5.9 — 2026-07-16

- 独立「比选」工作区（模式轨第 6 项，快捷键 6）
- 方案组合表：v/c 色阶、LOS、一键打开并激活方案
- 比选 CSV/JSON 导出；命令面板入口
- 分析拼图并入相位灯态条带


## 0.5.8 — 2026-07-16

- 分析报告 SVG 拼图板（KPI+流向+雷达+饱和度+延误+明细表）
- 流量流向图：路口盘面、路段 stub、进口总量、图例芯片
- 分析页「导出分析拼图」一键输出 SVG + Markdown


## 0.5.7 — 2026-07-16

- 渠化：角部缘石圆角线、右转导流岛弧段精度、让行三角
- 双线停止线 + 更密斑马线
- 进口总宽尺寸标注 B、方位/车道数、渠化岛半径 R
- 图面「图例」块与类型信息


## 0.5.6 — 2026-07-16

- 时距图：绿波带宽色带、相位差标注、图内 KPI 角标
- 绿波页 KPI 卡片（带宽比/上下行/a/带速）
- 导出时距图 SVG + band JSON + Markdown 简报


## 0.5.5 — 2026-07-16

- 配时多方法比选表 + 延误/v/c 对比图
- 一键推荐并应用比选方案
- 饱和度 v/c 连续色阶（分析表与比选）
- 检查器面板层次与推荐行高亮


## 0.5.4 — 2026-07-16

- 配时优化多方法：Webster / 延误最小 / 等绿灯 / 固定周期分绿
- 支持「固定周期」开关：在选定算法下锁定 C 只分绿
- 配时说明卡片（公式与结果注释）

## 0.5.3 — 2026-07-16

- 绿波：单向 / 双向数解 / 双向等带 / 图解 / 优化扫描
- 路段距离表输入；交互时距图悬停参数


## 0.5.2 — 2026-07-16

- 专业图件导出包：配时图 / 管控图 / 流向图 / 时距图 SVG + 分析 JSON + Markdown 简报
- 画布更高分辨率（DPR≤3）与更满幅 fit

## 0.5.1 — 2026-07-16

- 一键 Webster 优化写入全相位（含搭接策略说明）
- 关键流量比 y 表；专业依据文档 `docs/research/05-professional-basis.md`

## 0.5.0 — 2026-07-16

- 路口类型：十字 / T / Y / 斜交 / 环形（示意几何）
- 矢量专业图：信号配时图、管控放行图、流量流向箭头图、绿波时距图

## 0.4.8 — 2026-07-15

 — 2026-07-15

- 多方案对比柱状图（延误 / v/c，色随 LOS）

## 0.4.7 — 2026-07-15

- 横断面组成图 + 组件占比表，与参数联动

## 0.4.6 — 2026-07-15

- 画布图层开关（路面/标线/岛/流量/标注/图框）
- 「适应窗口」一键 fit
- 搭接相位一键添加


## 0.4.5 — 2026-07-15

- 画布图例（路面/岛/流量）
- 信号冲突矩阵图（与放行对照）

## 0.4.4 — 2026-07-15

- 分析：LOS 色带、综合雷达图、延误热色柱

## 0.4.3 — 2026-07-15

- 相位 G/Y/AR 精细编辑、搭接相位 Overlap 开关
- 冲突矩阵领域模型


## 0.4.2 — 2026-07-15

- 移动端顶栏精简：隐藏桌面工具条，保留保存/主题
- 手机三面板切换可用性增强（方案/画布/参数）
- 自适应画布高度；画布自适应 fit 视口

## 0.4.1 — 2026-07-15

### Theme & responsive (professional)

- 深色 / 浅色双主题（持久化 localStorage，顶栏切换）
- 专业化设计系统：IBM Plex、工程向色板、清晰层级
- 响应式：桌面三栏 → 平板双栏 → 手机方案/画布/参数切换
- 图表随主题换色；画布舞台色随主题变化

## 0.4.0 — 2026-07-15

### Visual QA polish (0.3.7–0.4.0)

- 画布改为矩形出图区（去掉圆形 vignette）
- 图表：坐标轴刻度、单位、数值标签、网格
- 分析：可滚动表格、v/c·延误热色、LOS 色阶
- 流量表合计列；渠化面板渐进披露（details）
- 顶栏次要导出分组；截图 E2E 视觉回归
- 默认流量/相位更合理

## 0.3.6 — 2026-07-15

### UI / IA + Charts

- 设计系统 / 面包屑 / 模式轨 / 画布壳
- SVG 图表：流量 / 信号 / 分析 / 绿波时空图，与数据联动

## 0.3.0 — 2026-07-15

- 渠化长尾字段、绿波走廊、Vissim CSV、相位放行矩阵

## 0.2.0 — 2026-07-15

- 几何 2.0、冲突矩阵、方案树、命令面板、多方案对比、DXF/CI

## 0.1.0 — 2026-07-15

- 首个可运行 Web MVP