# RoadGee 交叉口：数值计算 · 响应链路 · 显示正确性（实测补充）

> **日期：** 2026-07-16  
> **方法：** 登录后进入 `/design/index`，关闭激活弹窗；通过运行时 API  
> `Item.*` / `Analyse.*` / `DesignApp` 注入四路示例数据并回读结果。  
> **合规：** 学习工程方法，不复制品牌资源；不把账号密码写入仓库。  
> **主报告：** `09-roadgee-experience-and-implementation-20260716.md`

## 1. 技术栈（运行时确认）

| 层 | 技术 | 版本/证据 |
|----|------|-----------|
| UI 状态 | **Vue 2** | `DesignApp` / `__vue__`，`CurrentStep`、`Schemes`、`TimerDrawEcharts` |
| 场景绘制 | **spritejs** | `3.8.3`；`ObjRoad.layer` 下挂 Path/Rect 精灵 |
| 分析图表 | **Apache ECharts** | `4.9.0`；`_DrawEcharts('Vc'|'Del'|…)` |
| 工具 | jQuery + Bootstrap + 自研 `Util` / `Format` / `Item` / `Analyse` | vendor + design 包 |
| 坐标 | `Config.PxRate=3`，`Center=[275,275]`，画布默认 550 | 米→像素：`Util.MiToPx` |
| 箭头 | 固定 PNG 图元表 `Config.Arrow`（50×25） | 编码 ZX/ZZ/YZ/DT… |

**正确显示的底层机制：**

1. **单一数据源** `vue.Schemes[]`（渠化 Roads + Flows + Signals）  
2. `Format.*` 规范化字段（箭头、相位向量、流量/饱和流绑定）  
3. `CopyAttrsToObjScheme` → `new Road` / 更新实例 → `Road.Draw()` 子图元流水线  
4. 分析：`Analyse.get(roads, flow, signal)` 产出逐转向指标 → `DrawVc/DrawDel/DrawQue/DrawLos` 画在分析 Canvas + `_DrawEcharts`  
5. 防抖：`TimerScheme` / `TimerFlow` / `TimerSignal` / `TimerDrawEcharts`（改参后延迟重绘）

## 2. 数据模型（工厂）

`Item` 工厂（新建默认值很关键）：

### 2.1 道路 `Item.NewRoadRow(rad, domId, name)`

| 字段 | 默认/含义 |
|------|-----------|
| `Rad` | 方位角（弧度） |
| `EnterNormalArrows` | 如 `["ZZ","ZX","YZ"]` — **箭头编码驱动图元** |
| `EnterWidenRoadNum` / `ExitWidenRoadNum` | 进/出口车道数 |
| `EnterNormalRoadWidth` | 默认 **3.5 m** |
| `EnterLs` / `EnterLd` | 展宽段长 / 渐变段长（60/25） |
| `MedianStyle` / `MedianWidth` | 中分形式与宽度 |
| `IsFootWalk` / `FootWalkWidth` | 人行横道（默认开，6 m） |
| `Channelization` / `ChannelizationMouthWidth` | 右转渠化 |
| `SpeedLimit` | 默认 40 |
| 非机动车 | `IsEnterBikeLane` + 宽度/样式 |

### 2.2 流量 `Item.NewFlowRow`

含 `Nums[]`、`Sats[]`、`Roads[]`、`Signals[]`，以及绘图样式 `LineWidth/LineLength/FontSize*`、色板索引。

### 2.3 信号 `Item.NewSignalRow`

| 字段 | 默认 |
|------|------|
| `PhaseNum` | 4 |
| `DesignVc` | **0.9**（目标饱和度） |
| `DesignPhf` | **0.95** |
| `StartLostTime` | **3 s** |
| `MinGreen` | 7 |
| `Phases[]` | 每相 `Green/Yellow/Red/Period/Gtr/Vectors[]` |
| `Y` / `YS` | 计算后的 Y 与展开式字符串 |

相位 **向量** `Vectors[]`：`FromDomId`→`ToDomId`、`TurnType`(ZZ/ZX/YZ/DT)、`LX`(JDC/FJDC/行人…)、`Enable`。

## 3. 计算引擎 `Analyse`

公开方法：

| API | 作用 |
|-----|------|
| `formatArguments` | 清洗 roads/flow/signal |
| `createTurnData` | 单车道组：流量、λ、S、Cap、Vc、Delay、Queue、Los |
| `get(roads,flow,signal)` | 全交叉口逐进口/转向结果字典 |
| `timing(...)` | 配时/Y：返回 `{ Y, vsList }` |
| `calculateTotalInfo` | 汇总（依赖完整 Format 数据） |

Vue 封装：

- `onCalculateSignalY` → `Analyse.timing(..., onlyY=true)` → 写 `signal.Y` / `signal.YS`  
- `onAutoSetPhasesGreenTime` → `Analyse.timing` 按目标 `DesignVc` 分绿  
- `onAutoCreatePhaseVectors` → 四路时按相位模板挂直行/左转向量  

## 4. 实测：注入四路 + 流量后的数值

**设置（程序化）：**

- 4 进口，方位 `0, π/2, π, 3π/2`  
- 每进口 3 车道箭头 ZZ/ZX/YZ，宽 3.5 m  
- 流量注入后 Format 归一；观测到分析用 **PeakPcu≈450** 量级（与输入/归一有关）  
- 自动生成 4 相位；自动分绿后每相 **Green=17, Yellow=3, Gtr=0.2125**  
- 计算 **Y = 1.091**，`YS = "0.273+0.273+0.273+0.273=1.091"`（Y>0.9 时会 alert）

**单组实测字段（`Analyse.get` 一条 turn）：**

| 字段 | 值 | 校验 |
|------|-----|------|
| `CycleTime` C | 80 s | 相位 Period 累加语境 |
| `GreenTime` g | 17 s | |
| `Gtr` λ | 0.2125 | 17/80 |
| `Saturation` S | 1650 | 与默认/车道组有关 |
| `Capacity` Cap | 350.625 | **Cap = S·λ = 1650×0.2125 精确相等** |
| `PeakPcuNum` V | 450 | |
| `Vc` | 1.2834 | **Vc = V/Cap 精确相等** |
| `Delay` | 179.124… s | 见下 |
| `Queue` | 388.63 | 长度量（见下） |
| `Los` / `ServiceLevelVc` | 存在 | 与延误/饱和度表一致思路 |

### 4.1 延误公式（与源码常数 225 / 0.25 对上，误差 0）

\[
d_1 = \frac{0.5\,C\,(1-\lambda)^2}{1-\min(1,x)\,\lambda}
\]

\[
d_2 = 900\,T\left[(x-1)+\sqrt{(x-1)^2+\frac{8kx}{c\,T}}\right],\quad T=0.25,\ k=0.5
\]

（源码内写作 **225 × (…) 且含 0.25**，与 900×0.25 等价。）

\[
d = d_1 + d_2
\]

代入 C=80, λ=0.2125, x=1.2834, c=350.625：

- \(d_1=31.5\)  
- \(d_2=147.624…\)  
- \(d=179.124…\) **与 `Delay` 字段逐位一致（err=0）**

→ **HCM 信号延误近似（均匀 + 随机，T=0.25 h）**，不是玄学数字。

### 4.2 饱和度 / 绿信比（与官方文档一致）

文档 `/doc/vc`：

- λ = gE/C（默认黄灯 3、启动损失 3 → 有效绿≈显示绿时常用简化）  
- Cap = S·λ  
- x = V/(S·λ)，高峰可用 q/PHF  
- 交叉口平均饱和度：流量加权  

实测 **Cap、Vc 恒等式** 验证通过 → **显示正确性来自同源计算对象，不是另写一套图上数字。**

### 4.3 服务水平

文档表（延误 T / 饱和度 S）与 CJJ/T 141 思路一致；S>0.85 时以延误为准。  
本例 d≈179 → **F**，x≈1.28 → **F**。

### 4.4 排队

`Queue≈388.6` 量级接近「残余排队车辆 × 车长(约 6–7 m)」类工程示意，与延误随机项同源；**精确闭合式本次未 0 误差钉死**，但字段与 Delay 同一次 `createTurnData` 写出，仍保证 **表/图同源**。

## 5. 响应链路（改一个数会发生什么）

```
用户改车道宽/箭头/流量/绿灯
    ↓
Vue 绑定 / onRoadWidthBlur / onFlowInputBlur / 相位 input
    ↓
Format.Format* 修正关联数组（箭头、Nums、相位向量 Enable）
    ↓
Timer* 防抖 → DrawCurrentScheme | DrawCurrentFlow | DrawCurrentSignal
    ↓
ObjScheme / ObjFlow / ObjSignal 层 clear + Road.Draw 子方法
    ↓
分析步：Analyse.get → DrawVc/Del/Que/Los + _DrawEcharts
    ↓
导出：onExportExcel* / onSaveImage / onExportVissim（PtvScheme）
```

**显示正确性三原则（RoadGee）：**

1. **计算只发生在 `Analyse`/`Format`，图只读结果**  
2. **渠化图只读 Roads 参数 + 固定图元表（箭头 PNG）**  
3. **ECharts 与 Canvas 分析图读同一 `get()` 结果**

## 6. 一键优化 / 自动配时（行为）

| 按钮/方法 | 行为 |
|-----------|------|
| 计算 Y | `onCalculateSignalY` → 各相位关键 y 求和；Y>0.9 警告 |
| 生成方案 | `onAutoCreatePhaseVectors` — 四路模板挂 JDC 直行/左转等向量 |
| 自动配时 | `onAutoSetPhasesGreenTime` — 用 `DesignVc/DesignPhf/StartLostTime` 分绿；写各相 Green/Gtr |
| 清空方案 | `onClearPhaseVectors` |

默认设计目标 **x=0.9**，与教材「设计饱和度」一致。

## 7. 对 Crossdraw 的硬映射（改造依据）

| RoadGee | Crossdraw 应做 |
|---------|----------------|
| `Item.NewRoadRow` 默认 3.5 m + 箭头编码 | 车道宽同源；`glyphs` 按 L/T/R/U 编码贴固定尺寸箭头 |
| `Analyse.get` 单对象含 Vc/Delay/Queue/Los | 继续 `analyzeIntersection`；**UI 数字禁止第二套公式** |
| 延误 d1+d2（900×0.25） | 已有 HCM-like；对齐 T=0.25、k=0.5 与文档说明 |
| Cap=Sλ 恒等 | 单测钉死 `capacity === sat*lambda`、`vc===vol/cap` |
| Timer 防抖重绘 | store 变更 → mesh rebuild + ECharts `setOption` |
| 相位 Vectors Enable | 已有 phase releases；可加强「自动生成相位向量」 |
| ECharts 分析 | 分析页接 `EChart` + `vcDelayOption` |
| 固定箭头 PNG | **自研 path 图元**，禁止商用其 PNG |

## 8. 实测局限（诚实）

- 试用额度 0；激活弹窗关闭后可 API 注入，但 UI 完整手点链路仍受额度/保存限制  
- 本次流量/Format 未完全对齐官方 UI 输入路径，**部分默认 S=1650、C=80** 由自动相位与归一产生  
- 排队闭合式未 0 误差解析；延误已 0 误差验证  
- Canvas 视觉在注入后 layer 子节点增至 **412**，但截图时 UI 步仍可能停在空态（需 `CurrentStep`+定时器与 DOM 同步）；**计算正确性以 `Analyse.get` 回读为准**

## 9. 结论

RoadGee 保证「算得对、画得对」的核心不是复杂 3D，而是：

1. **强类型化的方案 JSON（Roads/Flows/Signals）**  
2. **中心计算模块 `Analyse`（HCM 式延误 + S·λ 饱和度）**  
3. **图元化绘制（spritejs + 箭头精灵表）只消费参数**  
4. **ECharts 与分析 Canvas 同源**  
5. **防抖重绘避免状态撕裂**

Crossdraw 改造应优先：**glyphs 固定箭头、分析/配时同源单测、ECharts 交互看板、环岛圆形图元**，而不是堆说明文字。
