# Crossdraw

**本地优先、免费开源的交叉口设计出图工具（GPLv3）· v0.2.0**

面向生产工作流的参数化交叉口方案表达：渠化 / 流量 / 信号 / 断面 / 分析 / 绿波联动，本地 `.rtp` 归档，导出 PNG / SVG / DXF / CSV / Excel。

- 仓库：https://github.com/sakmiko/crossdraw  
- 协议：[GNU GPLv3](LICENSE)  
- 包管理：**npm**（Windows / macOS / Linux）

---

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

## 生产能力（0.2）

| 模块 | 内容 |
|------|------|
| 几何 2.0 | 圆角路口核心、分车道宽、展宽渐变、渠化岛、斑马线、图框图签、比例尺、指北针 |
| 流量 | 转向矩阵 + 画布流量箭头层 |
| 信号 | 相位编辑、Webster、冲突检测、周期校核 |
| 断面 | 简绘横断面联动 |
| 分析 | v/c·延误·排队·LOS；CSV / Excel；多方案对比 |
| 绿波 | 经典数解带宽与相位差 |
| 方案树 | 渠化/流量/信号增删复制激活；十字 / T 型模板 |
| 导出 | PNG / SVG / DXF（图层+线型） |
| 体验 | 撤销重做、Ctrl+K 命令面板、自动草稿、暗色专业 UI |

---

## 示例

`examples/standard-cross.rtp` · `wide-entry.rtp` · `compact.rtp`

---

## 技术栈

TypeScript · React · Vite · Zustand · PixiJS · Zod · Vitest · Playwright · GitHub Actions CI

---

## 文档

见 `docs/`（产品 / 调研 / 架构 / 开发阶段手册）。

## 边界说明

几何为**工程示意级参数化生成**（可出方案图/报告附图），不是测绘级施工图 CAD；绿波多节点默认示意坐标，可扩展为真实项目坐标。仿真深度对接（完整 Vissim inpx）仍可继续增强。

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。
