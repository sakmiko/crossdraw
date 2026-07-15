# Crossdraw 实施计划索引

**状态：** Accepted  
**Goal:** 交付可保存、可导出的单交叉口本地生成器 V1。

## 阶段总表

| Phase | 名称 | 产出 |
|-------|------|------|
| 00 | 脚手架 | Vite+React+TS+ESLint 可运行 |
| 01 | 领域契约 | 类型、zod schema、fixture |
| 02 | 校验规则 | OK/WARN/BLOCK 基础 |
| 03 | 几何原型 | 十字 ribbon/路口重建 |
| 04 | 应用壳 | 三栏布局 |
| 05 | Store+Undo | Zustand+zundo |
| 06 | 画布基建 | Pixi 缩放平移网格 |
| 07 | 渠化编辑 | 面板↔几何 |
| 08 | 方案树 | 复制删除激活 |
| 09 | 流量 | 矩阵+箭头 |
| 10 | 信号 | 相位+Ring图 |
| 11 | 横断面 | 简绘生成 |
| 12 | 持久化 | rtp+autosave |
| 13 | 导出 | PNG/SVG/DXF |
| 14 | 硬化 | E2E+性能 |
| 15 | 打包 | Electron RC |

细分子任务见：

- `00-05-foundation.md`
- `06-11-canvas-editors.md`
- `12-15-io-release.md`
- `fixed-testing-gates.md`
- `v1-release-checklist.md`

## 依赖方向

```
类型/校验 → 几何引擎 → store → canvas → 编辑器UI → io → 包装
```

禁止 UI 先行无引擎。
