# Crossdraw

**本地优先、免费开源的交叉口设计出图工具（GPLv3）· v0.5.114**

面向生产工作流的参数化交叉口方案表达：渠化 / 流量 / 信号 / 断面 / 分析 / 比选 / 绿波联动，本地 `.rtp` 归档，导出 PNG / SVG / DXF / CSV / MD / 净图包 / 工程图框。

- 仓库：https://github.com/sakmiko/crossdraw  
- 协议：[GNU GPLv3](LICENSE)  
- 包管理：**npm**（Windows / macOS / Linux）  
- 预览：https://crossdraw.fangbianhaoji.dpdns.org  

---

## 界面

- **双主题**：深色（工程工作站）/ 浅色（日间 CAD）
- **壳层**：左侧功能导航 + 全页两大区（图示 | 参数）；**仅信号页**上下布局
- **图表联动**：流量 / 信号 / 分析 / 绿波与参数同源；静默 autosave

## 快速开始

```bash
npm install
npm run dev
```

```bash
npm run build && npm run preview
npm test
npm run test:e2e
```

---

## 核心能力（0.5.x）

| 模块 | 内容 |
|------|------|
| 渠化 | 十字/T/Y/斜交/环岛/五路模板；展宽；右转渠化/安全岛审查；净图 / 图框出图 |
| 流量 | 转向矩阵；大车/PHF；流向高分辨率 OD 报告；流向净图 |
| 信号 | 相位/搭接；Webster 自动配时；双环示意；冲突看板；相位序号图；一键全方案优化 |
| 分析 | v/c·延误·排队·LOS；通行能力矩阵；四指标合图；比选记分卡 |
| 绿波 | 时距图；MAXBAND 离散；多走廊报告；连续相位差；路网预览 |
| 导出 | 导出中心多格式；**净图**（无脚注/多余文字）与工程图框分档；VISSIM 开放交换包 |

## 文档

| 路径 | 内容 |
|------|------|
| [docs/README.md](docs/README.md) | 文档中心索引与优先级 |
| [docs/research/05-professional-basis.md](docs/research/05-professional-basis.md) | 专业/算法依据 |
| [docs/research/06-competitor-optimization-survey-20260716.md](docs/research/06-competitor-optimization-survey-20260716.md) | 竞品与优化方法调研 |
| [docs/research/01-roadgee-feature-audit.md](docs/research/01-roadgee-feature-audit.md) | RoadGee 公开功能审计 |
| [docs/development/08-iteration-log.md](docs/development/08-iteration-log.md) | +0.0.1 迭代记录 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更 |

## 诚实边界

- 几何为**工程示意级**参数化生成，非测绘施工图 CAD  
- Webster / HCM 系为工程近似；绿波带宽为弧相交 + 离散搜索，**非**商业 MAXBAND-MIP  
- 双环为 NEMA 风格示意，**非**完整控制器  
- VISSIM 导出为开放 XML/CSV，**非** PTV 专有 `.inpx` 二进制  
- 一键全方案优化可审计（方法写入 MD），**非**黑箱多目标求解器  

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。
