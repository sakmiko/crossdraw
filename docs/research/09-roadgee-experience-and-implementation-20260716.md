# RoadGee 产品体验与实现调研（Crossdraw 内部）

> **日期：** 2026-07-16  
> **目的：** 学习交互与实现思路，指导 Crossdraw 建模/图表/布局迭代。  
> **合规：** 学习 IA 与工程方法；**不**抄 logo/品牌文案；**不**声称 RoadGee 克隆；账号仅用于本次体验，**勿**把密码写入代码仓。  
> **账号状态：** 可登录；`剩余可用 0 天 / 0 次`；无授权码时效果图含水印；新建绿波/横断面弹「激活账号」。

## 1. 产品信息架构

三大独立产品入口（顶栏）：

| 入口 | URL | 能力概要 |
|------|-----|----------|
| 交叉口 | `/design/` | 道路→渠化→流量→信号→分析；≤7 条道路；VISSIM 导出按钮 |
| 横断面 | `/hdm/` | 实景/简绘断面；红线、车道数、边坡/边沟/高架/管线等元素 |
| 干道绿波 | `/band/` | 2–10 路口；双向/上行/下行；多方法一键优化 + 时距图 |
| 地图模式 | `/design/?map=1` | 交叉口 + 地图底图（未深测） |
| 项目列表 | `/design/lists/index` | 类型/地理/标签筛选；复制分享 |

交叉口左栏两段（体验实测）：

- **设计：** 道路 · 渠化 · 流量 · 信号 · 横断面  
- **分析：** 饱和度 · 延误时间 · 排队长度 · 服务水平  

顶栏：交叉口名称、保存、`vissim`、画布尺寸（默认 **550**，范围约 550–1000）、「最多支持 7 条道路」。

官方文档树（完整功能清单）见 `roadgee-reference/doc-index.md`。

## 2. 前端技术栈（运行时 + 静态包）

### 2.1 交叉口 `/design/`

| 项 | 观测 |
|----|------|
| 壳 | Bootstrap + 自研 iconfont + jQuery；**Vue 2**（`__vue__` 数据：CurrentStep、CurrentRoadDomId、TimerDrawEcharts…） |
| 打包 | `/static/dist/base.js`、`design/base.js`、`vendor.js`、`design.js`（`?t=250125`） |
| 场景图 | **spritejs 3.8.3**（`window.spritejs`）；多 **Canvas**（9×550² 层叠） |
| 分析图 | **Apache ECharts 4.9.0**（`window.echarts`） |
| 全局对象 | `Road`（类）、`ObjRoad`、`ObjScheme`、`ObjSignal`、`ObjFlow`、`ObjAnalyse`、`Config`、`Util` |
| 源码保护 | `design.js` 混淆（`_0x…` 字符串表）；原型方法名仍可读 |

### 2.2 横断面 `/hdm/`

- 独立包：`/hdm/hdm/dist/base.js`、`hdm.js`（约 341KB）  
- 标识符显示 **按车道组件化绘制**：`DrawLaneByDomId`、`DrawLaneArrows`、`DrawSideView`、`DrawSlopeTexts`、`ExportAsPng` 等  
- 未检出 echarts/sprite 全局（与交叉口分离）

### 2.3 干道绿波 `/band/`

- 独立应用；新建：路口数 2–10、协调类型（双向/上/下行）  
- 文档公开算法细节（见 §5）

## 3. 渠化几何实现（核心——可复用图元）

### 3.1 坐标系与方案状态

`ObjScheme` 关键字段：

- `Center` 画布中心 px（默认 `[275,275]`，与 550 画布配套）  
- `Width/Height` 画布；`MinRadius` 交叉口大小相关（默认 5）  
- `ChannelCurvity` 右转曲度（默认 0.5）  
- `ColorRoad / ColorBikeLane / ColorChannelFootWalk`  
- `List` 道路列表；`Layer` 场景层；`IsCompass` 指北针  

`Config`：

- `PxRate: 3`（米→像素比例相关）  
- `LengthRate: 0.5`  
- `ChannelRange: [44,134]`  
- `CanvasSizeRange: [550,1000]`  
- `Colors.*` 路面/标线/流量色板（多套 `FlowColors`）  
- `WhiteObliquePath / WhiteHorizonPath / YellowObliquePath` — **标线路径资源**  
- **`Arrow` / `ArrowSplit` / `ArrowRate`** — 箭头图元表（见下）

`Util` 几何工具：`MiToPx`、`GetRadByXY`、`GetEndPointByVector`、`CenterToReal`、角度格式化等。

### 3.2 `Road` 绘制流水线（方法名 = 图元清单）

单进口道路类 `Road`，绘制拆成可组合方法（**固定图元 + 位姿**）：

| 方法 | 含义 |
|------|------|
| `InitSize` / `InitPosition` / `_InitPositionLeft/Right/Center` | 按进/出口道数、宽度、中分带算顶点 |
| `_InitBiasY` / `PointOffsetWidthBias` | 进口/出口倾斜（立体偏移） |
| `DrawBackground` | 路面底 |
| `DrawStopLine` | 停止线（`SvgHelper` + `Path`） |
| `DrawEnterRoadLine` / `DrawExitRoadLine` | 进/出口车行道边线 |
| `DrawEnterReliefRoadLine` / `DrawReliefSpliter` | 辅路 |
| `DrawBikeLane` / `DrawFootWalk` | 非机动车道 / 人行道 |
| `DrawSpliter` / `_DrawMedianIsland` | 导流/中分岛 |
| `_DrawFishLine` | 导流鱼刺线（空实现残留可见） |
| `InitArrows` / `_InitArrow` / `_DrawEnterArrow` / `_DrawArrow` | **贴图箭头** |
| `DrawDzZz` / `DrawDzZx` … | 待转区等 |
| `DrawBorrow` | 借道左转 |
| `DrawHdmButton` | 跳转横断面 |

`Road.Draw(t)` 依次调用上述子步骤（混淆后仍可见链式调用）。

**关键结论（与用户要求一致）：**  
RoadGee **不是** 每帧自由手绘箭头，而是：

1. 车道宽度等参数 → 算出局部顶点  
2. **箭头用固定 PNG 精灵** 按编码放置（旋转+平移）  
3. 标线用 `Path` + 预设 path 资源（斜线/横线黄白）  
4. 多 Canvas / Layer 叠放（spritejs）

### 3.3 箭头图元目录（必须对齐的思想）

路径模式：`/static/dist/imgs/50-25/{CODE}.png`  
实测尺寸：**50×25 px RGBA**。

| CODE | 中文 | 配置 w×h（逻辑） |
|------|------|------------------|
| ZX | 直行 | 10×20 |
| ZZ | 左转 | 10×20 |
| YZ | 右转 | 10×20 |
| DT | 掉头 | 10×20 |
| ZX_ZZ | 直左 | 10×20 |
| ZX_YZ | 直右 | 10×20 |
| ZZ_YZ | 左右 | 10×20 |
| ZX_ZZ_YZ | 左直右 | 10×20 |
| ZX_DT / ZZ_DT / YZ_DT / … | 组合 | 10×20 或 10×26 |
| KB | 可变车道 | 10×50 |
| CX | 潮汐 | 10×120 |
| BUS | 全向/公交 | 10×120 |
| BLANK | 空白 | 10×20 |

`ArrowRate` 对组合箭头按转向 **分摊比例**（如 ZX_ZZ → ZX:0.5, ZZ:0.5；三向各 1/3）。

`_DrawArrow` 运行时逻辑（反混淆摘要）：

- 取 `Config.Arrow[code]` → `{w,h,p}`  
- `new Rect({ rotate, pos, size:[h,w], texture: p })` 挂到道路 layer  
- 特殊 code `KB`/`CX` 有纵向偏移修正  

→ **Crossdraw 应对齐：自绘等比例 path/SVG 图元库（勿直接商用其 PNG），按 movements 编码选择 glyph 再 `place(frame)`。**

### 3.4 文档侧渠化参数全集（实现 checklist）

官方 `/doc` 渠化章节约 30+ 项，优先级建议：

1. 交叉口大小、右转曲度、道路方位  
2. 进口/出口车道数与宽度、展宽段长、渐变段  
3. 中央隔离形式与带宽、内侧偏移  
4. 人行横道宽度、非机动车道  
5. 右转渠化（固体/划线、单独出入口）  
6. 安全岛、待转/待行、借道左转、可变/潮汐  
7. 辅路、倾斜 bias、转向标志、指北针  

详见 `roadgee-reference/doc-index.md`。

## 4. 流量 / 信号 / 分析实现

### 4.1 流量 `ObjFlow`

- 矢量流向：`drawVector`、`drawEnterArrow`、`drawOuterArrow`  
- 颜色：`GetFlowRoadColorByDomId/Index` + `Config.Colors.FlowColors` 多色板  
- 输入：大车比例、PHF、饱和流率（文档：`flow_big_car` / `flow_phf` / `flow_sat`）  
- 折算：运行时字段 `BigCarRat`、`Phf`、`FlowPcuNum`、`PeakPcuNum`

### 4.2 信号 `ObjSignal`

字段：`CycleTime`（默认 140）、`PhaseNum`（默认 4）、`Phases`、`Roads`、`IsTl`  

绘制 API：

- `draw` / `drawPhase` / `drawBigPhase` / `drawTl` / `drawRule`  
- `DrawPhaseLightBar`、相位悬停/点击事件  
- 背景生成：`_getPhaseBackgournd` / `_Dz` / `_JDC` / `_Xr`（机动车/非机动车/行人相位底图）  
- 搭接相位（早启迟断）文档：`phase_dj`  

UI 暴露：相位 2–8、周期、相位尺寸 px、道路宽度、图例、绿/黄/全红、搭接、关联选择、自动配时/方案生成/清空。

### 4.3 分析 `ObjAnalyse` + ECharts

方法：`drawTurnData`、`drawTotalData`、`drawTlVc`、`drawTlDel`、`drawBackground`  

Vue 定时器名 `TimerDrawEcharts` → **改参后定时刷新 ECharts**，不是静态 SVG。

#### 饱和度（官方公式，文档 `/doc/vc`）

1. **绿信比** λ = gE / C；gE = g + A − l（默认 A=3s，l=3s → 有效绿≈显示绿）  
2. **车道饱和度** x = V / (S · λ)；高峰态用 q/PHF（默认 PHF=0.95）  
3. **交叉口平均饱和度** = 流量加权平均  
4. 细节：转向流量先按大车比例折 pcu；**未**做转向→直行当量  

运行时对象含：`Saturation`、`Capacity`、`Vc`、`GreenTime`、`Gtr`、`LaneGroup`、`TotalDelay`、`TotalQueue`、`TotalLos`、`StartLostTime` 等。

#### 服务水平（`/doc/service_level`，CJJ/T 141-2010）

| LOS | 延误 T (s/pcu) | 饱和度 S |
|-----|----------------|----------|
| A | ≤10 | ≤0.25 |
| B | ≤20 | ≤0.50 |
| C | ≤35 | ≤0.70 |
| D | ≤55 | ≤0.85 |
| E | ≤80 | ≤0.95 |
| F | >80 | >0.95 |

S>0.85 必须看延误；延误与 S 冲突时 **以延误为准**。

#### 自动配时（例1）

教材例题对齐：计算 Y、周期、各相最佳绿灯；过程保留小数，显示取整。

## 5. 干道绿波算法（公开文档，可直接工程化）

来源：`/doc/band`

| 方法 | 做法 |
|------|------|
| **经典数解法** | a0=v·C/2；a 以 10 m 步进在 a0±100 m 枚举，取 b 最大的 a；再算相位差与带宽 |
| **优化数解法** | 对 a0…a20 **直接算带宽取 max**（不用论文完整改进算法，用暴力枚举） |
| **图解法** | 「标准带速」+ 辅助线，滚轮调速 |
| **MaxBand / 逐渐拟合** | 产品宣称支持（方法选择页） |
| 单向协调 | 文档独立小节 |

UI：相位差 **比值/数值** 模式；一键优化后锁定 vC/2、写标准带速与上下行速度。

## 6. 横断面（简）

- 新建：道路类型（快速路/主/次/支/公路）、红线宽、左/右侧车道数  
- 侧栏：导出 / 风格 / 标注 / 文字 / 图片 / 箭头 / 路基 / 边坡  
- 实现：按 `Lane` 组件 `DrawLane*` + 箭头贴图 + 边坡文字；`ExportAsPng`

## 7. 与 Crossdraw 差距与落地映射

| RoadGee 做法 | Crossdraw 现状 | 建议动作 |
|--------------|----------------|----------|
| 箭头 **固定 50×25 精灵表** + 编码 | 矢量简易箭头，质量不稳 | 自建 `glyphs`：ZX/ZZ/YZ/DT 组合 path，**统一尺寸**，按 lane mid 放置 |
| 道路 = 参数 → 顶点流水线 | rebuild 过程式 mesh | 保持 mesh，但抽 `placeZebra/Arrow/Splitter` 复用 |
| 分析 **ECharts 实时** | 多为静态 SVG board | 已装 echarts：分析/周期扫描/比选改交互 |
| 绿波：数解 a 枚举 + 时距图 | 已有 measureCorridor/扫描 | 对齐「经典/优化数解」枚举步长与锁定 vC/2 体验 |
| 方案多级：渠化/流量/信号方案 | 已有 schemes | 保持；强化切换与复制 |
| 画布固定 px 中心、PxRate | 米制 mesh + 相机 | 可继续米制；导出图框单独对齐「出图尺寸」 |
| VISSIM 一键 | 开放 interchange 包 | 保持诚实边界 |
| 商业授权/水印 | GPLv3 免费 | 产品差异，保持无水印 |

## 8. 体验限制（诚实记录）

- 试用额度 **0**，无授权码 → 出图水印、部分新建受限  
- 未能完整走完「七路满配 + 全部分析导出」商业路径  
- 源码混淆 → 依赖 **原型方法名 + Config 表 + 官方文档** 反推，非完整反编译  

## 9. 参考文件（本仓库）

- `docs/research/roadgee-reference/`：文档摘录、`runtime-snapshot.json`  
- 临时包（本机）：`/tmp/roadgee-research/`（design.js / vendor / 箭头 PNG 样本，**勿入库商用素材**）  

## 10. Crossdraw 下一迭代建议（按本调研）

1. **图元层** `geometry/glyphs.ts`：车道条、停止线、斑马线、水滴岛、箭头编码表（对齐 ZX/ZZ/YZ…）  
2. **`drawApproach` / `drawRoundabout`** 只负责 frame 与参数，绘制调用 glyphs  
3. **分析页 ECharts**：v/c 柱 + 延误线 + LOS 色；周期扫描交互  
4. **绿波**：补「优化数解」a 枚举步长与文档一致的一键体验  
5. **永远** 方法说明进 docs，界面少废话；出图可净图  

---

*调研人：Hermes Agent · 仅供 Crossdraw 开源工程改进参考。*

## 补充：数值计算与显示正确性

见 **`docs/research/10-roadgee-calc-response-display-20260716.md`**（运行时注入实测：Cap=Sλ、延误 d1+d2 与 Delay 字段 0 误差、技术栈与响应链路）。
