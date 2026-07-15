# Crossdraw

**本地优先、免费开源的交叉口设计图纸生成器。**

> 画两条路 → 自动生成路口 → 渠化 / 流量 / 信号 / 横断面一气呵成。  
> 数据一次输入，多图自动联动。项目即文件，可离线、可归档、可审计。

---

## 产品定位

| 项 | 说明 |
|----|------|
| **是什么** | 参数化交叉口出图与方案表达工具 |
| **不是什么** | 通用 CAD、微观仿真器、路网 BIM |
| **对标心智** | 专业交通设计工作流（方案树 + 参数面板 + 画布） |
| **差异** | 本地免费、无账号次数、国标默认、对象联动、开源可二次开发 |

开源协议：**GNU GPLv3**（见 `LICENSE`）。

---

## 文档导航

| 目录 | 内容 |
|------|------|
| [`docs/product/`](docs/product/) | 产品定义、PRD、功能规格、路线图 |
| [`docs/research/`](docs/research/) | RoadGee 调研、竞品矩阵、技术栈选型 |
| [`docs/architecture/`](docs/architecture/) | 系统架构、数据模型、状态、渲染 |
| [`docs/specs/`](docs/specs/) | 交互、UI、文件格式、算法、快捷键 |
| [`docs/plans/`](docs/plans/) | 分阶段实施计划、测试门禁、发布清单 |
| [`docs/standards/`](docs/standards/) | 贡献规范、提交约定、目录约定 |

**建议阅读顺序：**  
`product/01-vision.md` → `research/01-roadgee-feature-audit.md` → `product/02-prd.md` → `architecture/01-system-architecture.md` → `plans/README.md`

---

## 当前状态

- [x] 仓库与文档体系初始化  
- [ ] 技术栈锁定与脚手架  
- [ ] Phase 00 可运行空壳  
- [ ] V1 单路口主路径  

版本规划见 `docs/product/03-roadmap.md`。

---

## 开发原则（摘要）

1. **生成优先**：先稳定出图，再分析优化。  
2. **对象即数据**：改参数必须联动全图，禁止死线。  
3. **国标默认、专家可覆盖**：推荐值可溯源，不强制锁死。  
4. **本地文件为真相**：`.rtp` 可保存、可 diff、可恢复。  
5. **功能对齐工作流，实现完全自研**：不复制第三方资源与商标。

---

## 许可证

GNU General Public License v3.0 — 见 [`LICENSE`](LICENSE)。
