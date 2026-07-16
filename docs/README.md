# Crossdraw 文档中心

本目录是产品与工程的**唯一事实来源（Source of Truth）**。  
实现以文档为准；文档冲突时优先级：

```
1. docs/product/03-roadmap.md          （范围边界）
2. docs/product/04-functional-spec.md  （行为）
3. docs/architecture/*                 （怎么建）
4. docs/plans/*                        （阶段复盘 / 排期）
5. docs/research/*                     （调研参考，非产品承诺）
```

## 目录结构

```
docs/
├── development/      # 开发手册（阶段/验收/测试/迭代日志）
├── product/          # 产品
├── research/         # 调研与专业依据
├── architecture/     # 架构
├── specs/            # 详细规格
├── plans/            # 阶段复盘 phase-review-0.5.*
├── standards/        # 工程规范
└── screenshots/      # E2E 回归截图
```

## 调研与依据（常用）

| 文档 | 用途 |
|------|------|
| [research/05-professional-basis.md](research/05-professional-basis.md) | 算法/图件专业依据一览 |
| [research/06-competitor-optimization-survey-20260716.md](research/06-competitor-optimization-survey-20260716.md) | 竞品·痛点·可落地优化方法·出图规则 |
| [research/01-roadgee-feature-audit.md](research/01-roadgee-feature-audit.md) | RoadGee 公开功能审计 |
| [research/04-feature-matrix.md](research/04-feature-matrix.md) | 功能对齐矩阵 |
| [development/08-iteration-log.md](development/08-iteration-log.md) | 0.5.x 迭代索引 |
| [plans/phase-review-0.5.104.md](plans/phase-review-0.5.104.md) | 本阶段复盘 |

## 当前产品优先级（2026-07）

1. **功能深挖**：自动优化（有依据）、净图/工程出图、评价与绿波工具  
2. **文档维护**：调研、依据、CHANGELOG、阶段复盘与 README 同步  
3. **布局精调**：用户指示降优先级，非紧急不改壳层  

## 出图约定

- **净图（clean-*-svg）**：图上不带脚注、水印、长说明；方法写在 MD  
- **工程图框**：标题栏/比例尺/指北仅导出稿；交互画布保持净几何  

## 文档状态图例

| 标记 | 含义 |
|------|------|
| `Draft` | 起草中 |
| `Review` | 待审 |
| `Accepted` | 已采纳，可指导开发 |
| `Deprecated` | 废弃，仅历史参考 |

初始化阶段文档默认状态：**Accepted（草案冻结供开发）**，重大变更走 PR 修改。
