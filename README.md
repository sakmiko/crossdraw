# Crossdraw

**本地优先、免费开源的交叉口设计图纸生成器（GPLv3）。**

画两条路 → 自动生成路口 → 渠化 / 流量 / 信号 / 横断面联动出图。  
数据一次输入，多图自动一致。项目即 `.rtp` 文件，可离线、可归档。

- 仓库：https://github.com/sakmiko/crossdraw  
- 协议：[GNU GPLv3](LICENSE)

---

## 当前状态

| 阶段 | 状态 |
|------|------|
| 产品/调研/架构文档 | 完成 |
| **开发文档（分阶段+验收+测试）** | **完成** |
| 代码实现 D00–D15 | 未开始 |
| MVP | **文档通过后进入实现；全部功能测通后签 MVP** |

---

## 文档导航

| 路径 | 说明 |
|------|------|
| [docs/development/](docs/development/) | **开发执行手册（从这里开工）** |
| [docs/product/](docs/product/) | 愿景、PRD、路线图、功能规格 |
| [docs/research/](docs/research/) | RoadGee 审计、市场、技术栈、矩阵 |
| [docs/architecture/](docs/architecture/) | 系统架构、数据模型、状态、ADR |
| [docs/specs/](docs/specs/) | UI、文件格式、交互、算法、快捷键、默认值 |
| [docs/plans/](docs/plans/) | 早期提纲（细则以 development/phases 为准） |

开发阅读顺序：`docs/development/README.md` → `00-thinking-and-strategy.md` → `phases/D00-…`

---

## 技术栈（锁定）

- **npm** + TypeScript + Vite + React 18  
- Zustand + Immer + zundo  
- PixiJS（画布）  
- Vitest + Playwright  
- 跨平台：Windows / macOS / Linux  
- 可选：Electron 包装（不阻塞 Web MVP）

---

## 开发命令（脚手架落地后）

```bash
npm install
npm run dev
npm run test
npm run test:e2e
npm run build
```

---

## 原则摘要

1. 参数驱动，禁止死线主导  
2. domain 纯函数可测  
3. 本地文件真理，无账号扣次  
4. 国标默认、专家可覆盖  
5. 不复制商业软件资源  

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [docs/standards/](docs/standards/)。
