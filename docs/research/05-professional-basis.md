# 专业依据与算法来源（Crossdraw）

**状态：** Living  
**版本：** 0.5.x  

本文档说明各分析/图表模块所依据的**公开规范、教科书或经典论文**。实现为工程化可测近似，**非**对任何商业软件的闭源复制。

## 1. 信号配时

| 方法 | 依据 | 实现落点 |
|------|------|----------|
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
| 流向箭头图 | 转向流量比例线宽 | 流量流向图 |
| 时距图（绿波） | 距离–时间，绿波带 | 干道协调时距图 |
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
