# 项目本质与最优实现策略

**状态：** Accepted  
**版本：** 0.2.0

## 1. 这个项目到底是什么

Crossdraw **不是** CAD，**不是** Vissim，**不是** 云端扣次 SaaS。

它是：

> **参数驱动的单交叉口「方案表达与出图」工作站**  
> 一次输入 → 渠化平面图 / 流量图 / 相位图 / 横断面 自动联动 → 本地文件归档 → 导出到 CAD/报告/仿真中间格式。

### 1.1 核心价值链

```
工程师脑子里的「进口几车道、展宽多长、相位怎么配」
        ↓ 结构化为对象
Project / Channelization / Flow / Signal / LaneGroup
        ↓ 确定性生成
Mesh（多边形、标线、箭头、标注）
        ↓ 呈现与导出
Pixi 画布 · PNG · SVG · DXF · .rtp
```

价值不在「能自由画线」，而在 **改一个数，全套图一致**。

### 1.2 对标与取舍（调研综合）

| 来源 | 学什么 | 不学什么 |
|------|--------|----------|
| **RoadGee** | 方案树（渠化⊃流量⊃信号）、参数面板、公开分析口径、Webster、绿波算法谱系 | 账号扣次、3×3×3 硬顶、闭源、水印 |
| **Synchro / Vistro / HCS** | 车道组、报告结构、配时时间线 | 完整商业配时全家桶 |
| **SIDRA** | 车道组/圆岛远期概念 | 分析器定位 |
| **Civil / 市政 CAD** | DXF 图层纪律、比例尺/北向/图框 | BIM 体量 |
| **StreetMix** | 断面组件拼装 UX | 非工程精度 |
| **SUMO** | 远期开源仿真对接 | 内嵌重仿真 |
| **现代编辑器** | 命令面板、快捷键、撤销 | 花哨无关功能 |

差异化（必须做成）：

1. 本地免费、无次数、无水印  
2. `.rtp` 可 Git  
3. 国标默认可溯源  
4. domain 引擎开源可测  
5. 方案数可配置（默认 >3）  
6. DXF 作为 V1 一等导出  

## 2. 最优实现（架构结论）

### 2.1 一句话架构

**纯函数 domain 引擎 + 薄 UI + 可替换渲染桥。**

```
React 面板 ──dispatch──► Zustand(project) ──► domain.rebuild/analyze
                              │                      │
                              ▼                      ▼
                         zundo 历史              Mesh / Metrics
                              │                      │
                              └──── canvas bridge ───┘──► Pixi
                              └──── io codecs ──────────► rtp/png/svg/dxf
```

### 2.2 为什么这是最优

| 决策 | 理由 |
|------|------|
| domain 无 React/Pixi | 可单测、可 golden、可换渲染器 |
| 参数生成而非自由 CAD | 与 RoadGee 工作流一致，复杂度可控 |
| 先 Web 后壳 | 跨平台最快；Electron 仅包装 |
| **npm** | 用户要求；零额外包管理器；CI/文档最通用 |
| 先出图后分析 | 验证「联动」比堆指标更关键 |
| 十字优先 T 型次之 | 几何难度集中在路口拟合 |

### 2.3 技术锁定（开发期）

| 层 | 选择 |
|----|------|
| 语言 | TypeScript 5 strict |
| 包管理 | **npm**（lockfile: `package-lock.json`） |
| 构建 | Vite |
| UI | React 18 |
| 状态 | Zustand + Immer + zundo |
| 画布 | PixiJS（v8 评估，失败锁 v7） |
| 校验 | zod |
| 单测 | Vitest |
| E2E | Playwright |
| 桌面 | Electron（MVP 后或 D15；开发以浏览器为主） |
| OS | Windows / macOS / Linux（路径与换行规范化） |

官方文档优先查阅：

- Vite / React / TypeScript Handbook  
- Zustand / immer / zundo  
- PixiJS Guides  
- Vitest / Playwright  
- Electron（仅打包阶段）  
- 交通：CJJ 37、CJJ 152、CJJ/T 141、HCM 方法概念（实现以 `specs/04` 为准）

### 2.4 实现不清晰时的流程

```
卡点 → 查官方文档 → 写 spike（docs/development/spikes/ 或 /tmp） 
     → 结论写回阶段「决策记录」→ 再编码
禁止：无规格直接堆 UI；禁止复制闭源软件资源。
```

## 3. 模块边界（硬规则）

| 允许 | 禁止 |
|------|------|
| `domain/**` 纯函数 | domain 读 `window`/`document` |
| canvas 只消费 Mesh | canvas 写业务规则 |
| io 只序列化 | io 偷偷改默认规范值 |
| UI 调 store action | UI 深改 project 树 |

## 4. 数据真理

1. **`.rtp` JSON** = 磁盘真理  
2. **Zustand project** = 运行时真理  
3. **Mesh** = 派生缓存（可丢，可重建）  
4. 分析 metrics（V1.1）= 派生  

## 5. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 路口几何难 | 仅十字保质；golden 夹具；T 型降级 |
| Pixi 版本坑 | 适配层 `canvas/bridge`；锁版本 |
| DXF 兼容差 | 最小图层集 + CAD 打开清单 |
| 范围膨胀 | MVP 清单否决；路线图优先 |
| 跨平台路径 | `path` 抽象；禁止写死 `/` 业务逻辑 |

## 6. 进入编码的前置条件

- [x] 产品/调研/架构文档存在  
- [ ] 本开发文档 Accepted  
- [ ] D00 脚手架合并  

**本文件确认后，按 `phases/D00` 起实施；全部阶段通过后执行 MVP 验收。**
