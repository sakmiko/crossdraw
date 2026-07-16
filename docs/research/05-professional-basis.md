# 专业依据与算法来源（Crossdraw）

**状态：** Living  
**版本：** 0.5.x  

本文档说明各分析/图表模块所依据的**公开规范、教科书或经典论文**。实现为工程化可测近似，**非**对任何商业软件的闭源复制。

## 1. 信号配时

| 方法 | 依据 | 实现落点 |
|------|------|----------|
| 固定周期分绿 | 给定 C，有效绿灯按 y_i/Y | `optimizeSignalTiming` method=fixed-cycle |
| 等绿灯 | 实用近似 | method=equal |
| 延误最小 | HCM 延误代理扫周期 | method=hcm-delay |
| Webster 最优周期 | Webster, F.V. (1958). *Traffic Signal Settings*. Road Research Technical Paper No. 39. `C0 ≈ (1.5L+5)/(1−Y)` | `domain/analysis` `websterTiming` |
| 有效绿灯 / 损失时间 | HCM 系列；国内教材常用启动损失≈3s、黄灯利用 | `effectiveGreen`, `startLossSec` |
| 绿信比分配 | 按关键流向流量比 y_i / Y 分配有效绿灯 | `websterTiming` |
| 饱和流率默认 | 工程常用 1750 pcu/h/ln；借道左转 1650（与公开产品说明一致，可改） | `defaultSatFlow`, `borrowLeft` |

## 2. 延误 / 饱和度 / LOS

| 指标 | 依据 | 实现 |
|------|------|------|
| v/c | 通行能力 c = s·g/C；x = v/c | `analyzeIntersection` |
| 均匀延误 | Webster/HCM 均匀项近似 `(C(1−λ)²)/(2(1−λx))` | `uniform` |
| 随机延误 | HCM 增量项简化（Akçelik/HCM 风格） | `random` |
| 延误 LOS | 信号交叉口车均延误分级（与 HCM 信号交叉口 LOS 阈值一致的常用表：A≤10 … F>80 s） | `losByDelay` |
| 饱和度 LOS | 工程常用 x 分级（A≤0.25 … F>0.95），与延误 LOS 合成 | `losByVc`；高饱和时偏延误（CJJ/T 141 精神） |
| 排队长度 | 均匀到达简化 + 过饱和堆积；车头间距默认 5.5 m | `queueM` |

**规范索引（查阅用，不嵌入版权全文）：**

- CJJ/T 141 城市道路交通组织设计规范（服务水平与交通组织原则）  
- GB 50647 城市道路交叉口规划规范（几何/渠化原则）  
- HCM (Highway Capacity Manual) 信号交叉口章节（方法论）  

## 3. 绿波 / 干道协调

| 方法 | 依据 | 实现 |
|------|------|------|
| 经典数解 / 图解 | 国内《交通管理与控制》教材干道协调；时距图 | `analysis/band.ts`, `corridor.ts` |
| 半周期距离 | `d_half = v·C/2`（双向绿波常用） | `halfCycleDistanceM` |
| 相位差 | 单向：`o = d/v`；双向数解/扫描 | `optimizeBandClassic`, `optimizeBandMaxScan` |
| MAXBAND 思路 | Little, J.D.C. et al. 带宽最大化（本实现为**简化扫描**，非完整 MIP） | `optimized-scan` |

参考论文（公开可查）：

- Little, J.D.C., Kelson, M.D., Gartner, N.H. (1981). MAXBAND: A Program for Setting Signals on Arteries and Triangular Networks. *TRR*  
- Gartner, N.H. et al. MULTIBAND 扩展思路（后续版本可深化）  

## 4. 几何与渠化

| 内容 | 依据 |
|------|------|
| 车道宽默认 3.25–3.50 m | 城市道路工程设计规范常用推荐 |
| 展宽/渐变 | 设计规范中展宽段+渐变段原则（示意建模） |
| 右转渠化岛 | 交叉口渠化设计惯例 |
| 路口类型 | 十字 / T / Y / 斜交 / 环形（示意级，非环岛仿真） |

## 5. 图件样式

专业图件（矢量 SVG）对齐交通工程制图与教材常见表达：

| 图件 | 内容 | 参考风格 |
|------|------|----------|
| 相位配时图 | 横向时间轴，绿/黄/红条 | 信号配时图（教材/方案文本） |
| 相位放行/管控图 | 进口×相位放行矩阵 | 方案说明管控图 |
| 管控+饱和度看板 | KPI + 管控矩阵 + 配时条合图 | 教材/方案文本合成图 |
| 评价四指标平面合图 | LOS/延误/排队/v/c 2×2 平面 | RoadGee 评价平面图风格 |
| 相位冲突审查看板 | 矩阵+冲突点+命中表 | 相位冲突检查表（教材） |
| VISSIM 开放交换包 | links/routes/volumes/signal XML+CSV | 非 PTV 专有 .inpx |
| 流向箭头图 / 高分辨率流向报告 | 转向流量比例线宽 + OD 表 | 流量流向图（教材/方案） |
| 时距图（绿波） | 距离–时间，绿波带；高分辨率 1280×720 矢量 | 干道协调时距图（教材） |
| 干道路网预览 | 链式桩号、双幅路、λ/o 标注、上下行协调箭头 | 教材干道协调示意图；非 GIS 底图 |
| 五路交叉口模板 | 72° 五进口示意 + 五相位 | 多路交叉口渠化原则（示意级） |
| 冲突矩阵 | 转向两两冲突 | 相位设计冲突检查表 |
| 横断面 | 组成条带+尺寸 | 道路横断面图 |

## 6. 导出

| 格式 | 用途 |
|------|------|
| PNG | 位图汇报 |
| SVG | 矢量图复用（首选） |
| DXF | CAD |
| CSV / Excel(HTML) | 数据与评价表 |
| JSON 片段 | 图表数据热更新/二次开发 |
| Vissim 中间 CSV | 仿真前处理（非完整 inpx） |

## 7. 声明

- RoadGee 等商业软件仅作**工作流对标**，算法与图件均为自研。  
- 数值结果用于方案比选与教学，重大工程应以正式软件与现行规范审查为准。  


## 图表制图规范（实现约定）

| 图种 | 精确性约定 |
|------|------------|
| 配时图 | 时间轴严格为周期 C（秒）；主相位按序累加 G+Y+AR；余时为红灯；标注秒数 |
| 管控图 | 与 phase.releases 一一对应 |
| 流向图 | 线宽线性映射转向流量；标注 pcu/h 原值 |
| v/c 色阶 | ≤0.6 绿 … >1.0 深红 |
| LOS | 控制延误 A≤10 B≤20 C≤35 D≤55 E≤80 F>80（HCM） |
| 延误 | 均匀项 d1 用 HCM 简化式；随机项为近似 |


## 绿波带宽计算（0.5.14）

- 通过带宽度 \(b\) 定义为：可行出发时刻集合经行程时间平移后，与下游绿灯区间的**圆环弧交集测度**（秒）。
- 多路口：逐段相交，带宽为最终可行集长度。
- 不再使用“间距变异惩罚”缩小带宽；方法只决定相位差，评分统一用 `scoreOffsets` / `twoNodeThroughBand`。

| 行人过街审查看板 | Walk/FDW 环图+推算 | 人行横道配时工程近似 |
| 环岛布局图 | 内外半径随进口宽 | 环岛示意，非完整规范库 |

| 双环栏审查看板 | R1/R2 阶段 + 屏障 | NEMA 风格示意（非完整控制器） |

| 渠化出图图框 | 图框/比例尺/指北/标题栏 | 工程制图习惯；交互画布保持净几何 |

| A4 工程拼版 | 渠化图框+流向+配时+管控 | 打印拼版；示意非测绘 |

| 通行能力/饱和度矩阵 | 车道组 v/c 矩阵 + bar | HCM/Webster 工程近似 |

| 布局系统 v0.5.100 | 统一 page-fill + 断点 | 工程工作站：图+参两大区 |

| 相位序号图 | 顺序/双环编号板 | NEMA 风格示意 |
| 右转渠化审查 | rightTurn/安全岛参数表 | 与 mesh 同源示意 |

| 多走廊绿波报告 | 带宽柱 + 协调指数 | measureCorridor 同源；协调分为工程合成 |

| 一键全方案优化 | Webster + 连续相位差 + 多走廊离散优化 | 工程合成；非商业黑箱 |
| 净图导出 | 去标题/脚注/说明句 | 方法说明仅 MD |
| 竞品调研 2026-07 | docs/research/06-competitor-optimization-survey | RoadGee/教材/HCM |

| 关键流 Y 分解图 | computeSchemeY | 教材临界流比 |
| 排队储存审查 | 红灯到达×间距/车道 | 工程示意非仿真 |

| 配时方法比选看板 | compareTimingMethods | Webster/HCM/等绿/固定C |
| 搭接相位审查 | isOverlap 不计入主环Σ | 教材搭接示意 |

| 损失时间 L 看板 | L=nℓ+R；C₀=(1.5L+5)/(1−Y) | Webster 1958 示意 |
| 行人 Walk/FDW 优化 | 横道宽/1.2m/s | 工程推算非完整规范 |

| 进口道储存校核 | 排队示意 vs entryWidenLengthM | 工程式；非仿真 |

| 关键进口看板 | max v/c 车道组 | analyzeIntersection |

| 相位差扫描 | 自由节点 o 离散 + scoreOffsets | 工程扫描非 MIP |

| 速度敏感性扫描 | 固定相位差 · scoreOffsets vs v | 工程扫描非 MIP |

| 多走廊相位差联动 | progressive / offset-scan 批量 | 独立走廊；非联合 MIP |
