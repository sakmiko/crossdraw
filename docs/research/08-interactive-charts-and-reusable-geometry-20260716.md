# 调研纪要：交互图表 + 可复用交叉口建模（2026-07-16）

> 检索方式：Firecrawl **keyless 免费档**（付费 Key 额度 0，已注释）

## 1. 交互图表库（替代手写 SVG 条形/曲线）

| 库 | 结论 | 适配 Crossdraw |
|----|------|----------------|
| **Apache ECharts** | 2025–2026 多篇评测强调：大数据量、实时仪表盘、图种全、可 tree-shake；Canvas 性能好 | **首选**：v/c、延误、周期扫描、雷达比选、热力 |
| **echarts-for-react** | 常用 React 封装 | 可用；也可自写薄 `EChart` 封装减依赖 |
| **Recharts** | React 友好、声明式；复杂/大体量弱于 ECharts | 备选 |
| **Chart.js / react-chartjs-2** | 简单、下载量高 | 图种偏基础 |
| **D3 / visx** | 极强定制；开发成本高 | 几何级自定义再用 |

**产品决策：** 评价/配时/绿波**分析类看板**改 **ECharts 实时交互**（tooltip、dataZoom、markLine）；**渠化几何仍用自研 mesh/Pixi**（CAD 不是 ECharts 职责）。

## 2. 交叉口 / 渠化「现成在线建模」

| 来源 | 结论 |
|------|------|
| 商业：Civil 3D、OpenRoads、Synchro 等 | 有完整渠化/标线，**闭源**，无法嵌进 Web 开源 |
| **SUMO netedit** | 开源路网/交叉口编辑，面向仿真网络；可导出图，**不是**教材级渠化图库 |
| movsim / traffic-simulation-de | 交通流仿真 + 部分环岛几何示意，**非**参数化渠化 CAD |
| Maker.js | **参数化 2D 图元、可组合模块、导出 SVG** — 最接近「固定宽度车道/箭头图元再拼装」 |
| flatten-js | 2D 几何内核（弧、多边形）— 可作底层 |
| parametric-svg | 参数化 SVG（维护弱） |
| 标线库 | 多为 Civil3D/Revit 插件（Autosign、Naviate…），**无**可直接 npm 的开源道路标线包 |

**结论：** **没有**「RoadGee 级开源 Web 渠化图元库」可直接装上就用。正确路径是：

1. **自建可复用图元层**（车道矩形、箭头、斑马线、导流岛、环岛环带）——固定设计尺寸，**变换矩阵**放到进口方位  
2. 可选借鉴 **Maker.js 模块化思想**（不必立刻加依赖）  
3. 异形/环岛：规范参考 FHWA Roundabout 几何 + 自研 `computeRoundaboutLayout`，而非找一个现成完整建模器  

## 3. 对你当前产品的落地建议

1. **分析图表** → ECharts 交互（已 `npm install echarts`）  
2. **渠化** → `geometry/glyphs`：`laneRect`、`arrowThrough/Left/Right`、`zebra`、`splitterTeardrop`、`ringAnnulus`，在 `drawApproach` / `drawRoundabout` 中 **摆放** 而非每处手写  
3. **诚实边界**：示意级工程 CAD，非测绘/Civil3D  

## 4. Firecrawl 状态

- 付费 Key：`remaining_credits=0` → 402  
- 已按用户要求 **注释** `.env` 中 `FIRECRAWL_API_KEY`，走 **keyless**  
- 备份：`~/.hermes/.env.bak.firecrawl-keyless-*`  
