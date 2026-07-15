# Crossdraw

**本地优先、免费开源的交叉口设计图纸生成器（GPLv3）。**

参数一次输入 → 渠化 / 流量 / 信号 / 横断面 / 分析 / 绿波 联动出图。  
项目即 `.rtp` 文件，可离线、可归档、可 Git。

- 仓库：https://github.com/sakmiko/crossdraw  
- 协议：[GNU GPLv3](LICENSE)  
- 包管理：**npm**（跨平台 Windows / macOS / Linux）

---

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

```bash
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm test           # 单元测试
npm run test:e2e   # 端到端（需 Chromium）
```

---

## 功能一览

| 模块 | 能力 |
|------|------|
| 渠化 | 十字模板、车道/展宽/中分/右转渠化/人行非机，参数改即重绘 |
| 流量 | 转向矩阵、大车比、PHF、饱和流率 |
| 信号 | 相位编辑、周期、Webster 自动配时 |
| 断面 | 从进口参数生成简绘横断面 |
| 分析 | 饱和度 / 延误 / 排队 / LOS，CSV 导出 |
| 绿波 | 经典数解带宽与相位差示意 |
| 文件 | `.rtp` 打开保存、自动草稿恢复 |
| 导出 | PNG / SVG / DXF |
| 体验 | 撤销重做、快捷键、暗色专业 UI、Pixi 画布 |

---

## 示例工程

`examples/`：

- `standard-cross.rtp`
- `wide-entry.rtp`
- `compact.rtp`

在应用中「打开 .rtp」加载。

---

## 技术栈

TypeScript · React · Vite · Zustand · PixiJS · Zod · Vitest · Playwright

架构原则：**domain 纯函数引擎 + 薄 UI + 可替换渲染**。详见 `docs/`。

---

## 文档

| 路径 | 说明 |
|------|------|
| [docs/development/](docs/development/) | 开发阶段与验收 |
| [docs/product/](docs/product/) | PRD / 路线图 |
| [docs/research/](docs/research/) | RoadGee 与市场调研 |
| [docs/architecture/](docs/architecture/) | 架构与数据模型 |
| [docs/specs/](docs/specs/) | UI / 算法 / 文件格式 |

---

## 贡献与许可

见 [CONTRIBUTING.md](CONTRIBUTING.md)。代码与文档以 **GPLv3** 发布。
