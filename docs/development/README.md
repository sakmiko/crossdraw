# 开发文档索引

**状态：** Accepted  
**版本：** 0.2.0  
**阶段：** 开发文档完成 → 功能实现通过后进入 MVP  
**包管理：** **npm**（跨平台；不使用 pnpm/yarn 作为项目标准）

本目录是 **实现阶段的执行手册**。产品「做什么」以 `docs/product/` 为准；本目录规定 **怎么做、做到什么算过、如何测**。

## 阅读顺序

1. [`00-thinking-and-strategy.md`](00-thinking-and-strategy.md) — 项目本质与最优实现  
2. [`01-engineering-principles.md`](01-engineering-principles.md) — 工程原则与禁止事项  
3. [`02-mvp-definition.md`](02-mvp-definition.md) — MVP 边界与总通过条件  
4. [`03-test-strategy.md`](03-test-strategy.md) — 测试金字塔与门禁  
5. [`04-acceptance-matrix.md`](04-acceptance-matrix.md) — 功能验收总表  
6. [`05-cross-platform-npm.md`](05-cross-platform-npm.md) — 跨平台与 npm 约定  
7. [`phases/`](phases/) — **分阶段开发规格**（最细，按序执行）  
8. 支撑文档：`../product/` `../architecture/` `../specs/` `../research/`

## 阶段一览

| ID | 名称 | 进入下一阶段条件 |
|----|------|------------------|
| D00 | 工程脚手架 | `npm run build` + lint + 空页可开 |
| D01 | 领域类型与 .rtp | schema roundtrip 单测全绿 |
| D02 | 校验引擎 | 规则表驱动测试全绿 |
| D03 | 几何引擎（十字） | golden mesh 测试全绿 |
| D04 | 应用壳与布局 | 视觉/布局 smoke |
| D05 | Store + Undo | 动作与撤销单测 |
| D06 | 画布基建 | 缩放平移 e2e/组件测 |
| D07 | 渠化编辑闭环 | 改参→重绘 集成测 |
| D08 | 方案树 | 深拷贝/激活测试 |
| D09 | 流量与箭头 | 折算+箭头测试 |
| D10 | 信号与 Ring | 相位/冲突测试 |
| D11 | 横断面简绘 | 联动 stale 测试 |
| D12 | 持久化与恢复 | 文件 IO 测试 |
| D13 | 导出 PNG/SVG/DXF | 导出金样检查 |
| D14 | 硬化与示例 | E2E 主路径 |
| D15 | 跨平台打包 | Win/macOS/Linux 构建矩阵（能到的环境） |
| **MVP** | 总验收 | 见 `02-mvp-definition.md` |

## 与旧 plans 的关系

`docs/plans/` 为早期提纲，**以本目录 `phases/` 为准**（更细、含通过条件与测试用例 ID）。

## 实现纪律

```
调研/官方文档 → 写清阶段规格 → 先测后码（domain 强制）→ 绿测再合入 → 推送远程
```

**未完成 D00–D15 且未过 MVP 清单前，不得宣称 MVP 可用。**
