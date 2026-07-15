# Crossdraw 文档中心

本目录是产品与工程的**唯一事实来源（Source of Truth）**。  
实现以文档为准；文档冲突时优先级：

```
1. docs/product/03-roadmap.md          （范围边界）
2. docs/product/04-functional-spec.md  （行为）
3. docs/architecture/*                 （怎么建）
4. docs/plans/*                        （怎么排期）
5. docs/research/*                     （调研参考，非承诺）
```

## 目录结构

```
docs/
├── product/          # 产品
├── research/         # 调研
├── architecture/     # 架构
├── specs/            # 详细规格
├── plans/            # 实施计划
└── standards/        # 工程规范
```

## 文档状态图例

| 标记 | 含义 |
|------|------|
| `Draft` | 起草中 |
| `Review` | 待审 |
| `Accepted` | 已采纳，可指导开发 |
| `Deprecated` | 废弃，仅历史参考 |

初始化阶段文档默认状态：**Accepted（草案冻结供开发）**，重大变更走 PR 修改。
