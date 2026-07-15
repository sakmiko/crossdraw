# Crossdraw 技术栈选型

**状态：** Accepted  
**版本：** 0.1.0  
**日期：** 2026-07-15

## 1. 决策摘要（推荐栈）

| 层 | 选择 | 版本基线 |
|----|------|----------|
| 语言 | **TypeScript** | 5.x |
| UI | **React** | 18.x（稳定优先，不追 19 作为硬依赖） |
| 构建 | **Vite** | 5/6 |
| 状态 | **Zustand** + Immer + zundo | 4.x |
| 2D 渲染 | **PixiJS** | v8 优先评估，不行则 v7 锁定 |
| 几何 | **自研 domain 引擎** + 少量 Turf 工具函数 | — |
| 桌面壳 | **阶段 A：纯本地 Web**；**阶段 B：Electron** 打包 | Electron 30+ |
| 测试 | Vitest + Testing Library + Playwright | — |
| DXF | `dxf-writer` / `@tarikjabiri/dxf` 类库评估后锁定一种 | MIT |
| 包管理 | pnpm | — |
| 质量 | ESLint + Prettier + TypeScript strict | — |
| 许可兼容 | 依赖须 GPLv3 兼容（MIT/BSD/Apache/LGPL；禁 AGPL/SSPL 混用策略见下） | — |

**一句话：** 用成熟 Web 技术做参数化 2D 专业工具；先 Web 跑通主路径，再 Electron 分发。

## 2. 壳层对比

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| **纯本地 Web (Vite)** | 迭代最快、易做像素级 UI 调试、CI 简单 | 文件系统要 File System Access API 或用户下载 | **开发默认** |
| **Electron** | 成熟、文件系统/菜单/自动更新生态完整 | 包体积大 | **发布默认** |
| **Tauri 2** | 体积小、安全模型好 | Rust 工具链与原生插件成本；DXF/打印边界案例少 | V2 可再评估 |
| **PWA 仅浏览器** | 零安装 | 弱文件权限、难深度桌面集成 | 仅作附赠 |

**否决「只做云 SaaS」：** 与本地免费、可归档定位冲突。

## 3. 渲染层对比

| 方案 | 适合 | 不适合 | 结论 |
|------|------|--------|------|
| **PixiJS** | 大量图元、60fps、场景树、WebGL | 富文本排版弱于 DOM | **主画布** |
| Konva | 中等交互、事件简单 | 超大图元性能一般 | 备选 |
| Fabric.js | 对象编辑器 | 性能与可控性对专业 CAD 弱 | 否 |
| 纯 SVG | 导出友好、清晰 | 复杂路口 DOM 爆炸 | **导出通道**可 SVG |
| Three.js | 3D | 2D 过重 | 否 |

策略：**逻辑几何在 domain 算好 → Pixi 只负责画**；导出 PNG 走 render texture，SVG/DXF 走独立序列化，不从 GPU 反推。

## 4. UI / 状态

| 选项 | 结论 |
|------|------|
| React | 生态与招人；与文档原选型一致 |
| Vue/Svelte | 可，但不为换框架付迁移税 |
| Redux | 样板过多 → 否 |
| Zustand+Immer+zundo | 动作边界清晰、撤销友好 → **是** |
| Radix / shadcn 风格 | 可做专业面板；保持克制 |

## 5. 几何与分析

| 能力 | 策略 |
|------|------|
| 道路 ribbon / 展宽 / 路口拟合 | **自研纯 TS**，单测 + golden polyline |
| 缓冲/距离/方位 | Turf 可选 |
| Webster / 饱和度 / 延误 / 排队 | **自研**，公式文档化（`specs/04`） |
| 拓扑 | 有向图 RoadNode–Road–Intersection |

禁止：在 React 组件里算几何。

## 6. DXF / 导出库

候选：

- JavaScript DXF writer 生态（如 tarikjabiri/js-dxf、dxfjs/writer）  
- 评估维度：MIT 许可、LAYER/POLYLINE/TEXT、中文标注、维护状态  

PNG：Pixi extract 或 canvas。  
SVG：domain → SVG path 序列化（推荐自研薄层，避免绑定渲染器）。

## 7. 测试与工程

| 类型 | 工具 |
|------|------|
| 单元 | Vitest（domain 必须高覆盖） |
| 组件 | Testing Library |
| E2E | Playwright（主路径） |
| 视觉 | Playwright screenshot diff（布局 token） |
| CI | GitHub Actions：lint + test + build |

## 8. 许可注意（GPLv3 项目）

- 运行时依赖优先 **MIT/BSD/Apache-2.0**  
- 若使用 LGPL，保持动态链接语义、提供源码 reciprocal 义务说明  
- **不引入** 明显与分发策略冲突的 SSPL 等  
- 产品 GPLv3：分发必须开源 reciprocal；`.rtp` 数据文件不受传染

## 9. 分阶段落地

```
Phase 0: Vite + React + TS + Zustand 空壳
Phase 1: domain 类型与 fixture
Phase 2: Pixi 画布基础设施
Phase 3: 业务
Phase 9: Electron 包装（文件协议、菜单）
```

## 10. 风险

| 风险 | 缓解 |
|------|------|
| Pixi v8 破坏性变更 | 锁定版本；渲染适配层 |
| Electron 体积 | 延迟包装；单 arch 构建 |
| DXF 兼容性差 | 用 BricsCAD/AutoCAD 样例验收 |
| 自研几何难度 | V1 只保证十字+简化 T |

## 11. 最终锁定声明

在 `package.json` 创建时写入引擎版本；变更渲染引擎需 ADR（架构决策记录）追加本节修订。
