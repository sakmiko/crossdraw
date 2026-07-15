# 系统架构

**状态：** Accepted  
**版本：** 0.1.0

## 1. 逻辑架构

```
┌─────────────────────────────────────────────┐
│ Presentation                                 │
│  React UI (shell, panels, dialogs)           │
│  PixiJS Viewport (layers, hit-test, gizmo)   │
└─────────────────┬───────────────────────────┘
                  │ actions / selectors
┌─────────────────▼───────────────────────────┐
│ Application State (Zustand slices)           │
│  project · selection · ui · history          │
└─────────────────┬───────────────────────────┘
                  │ pure calls
┌─────────────────▼───────────────────────────┐
│ Domain Engines (no React, no Pixi)           │
│  geometry · topology · flow · signal ·       │
│  analysis · cross-section · validate         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ I/O                                          │
│  rtp codec · png/svg/dxf · csv · autosave    │
└─────────────────────────────────────────────┘
```

## 2. 渲染分层

```
L5 Interaction (handles, marquee)
L4 Labels / flow text
L3 Markings / islands / crosswalks
L2 Road ribbons / intersection body
L1 Grid / paper frame / north arrow
```

单一 Pixi Application；逻辑层开关由图层 store 控制。

## 3. 数据流

```
用户改面板
  → dispatch domain action
  → immer 更新 project 树
  → 标记 dirty schemes
  → geometry.rebuild(intersectionId)
  → canvas bridge 增量/全量同步 display objects
  → zundo 压栈
```

分析模式（V1.1）：`analyze(flow, signal, geometry) → metrics` 只读派生，可缓存。

## 4. 模块边界

| 模块 | 职责 | 禁止 |
|------|------|------|
| `domain/geometry` | 参数→多边形 | 读 DOM |
| `domain/signal` | 相位、冲突、Webster | 画布 API |
| `domain/analysis` | v/c 延误排队 LOS | UI 文案硬编码以外的 i18n |
| `canvas` | 显示与命中 | 业务规则 |
| `io` | 序列化 | 偷偷改业务默认值 |

## 5. 存储

| 层 | 用途 |
|----|------|
| `.rtp` JSON | 项目真相 |
| 旁路 `.autosave.rtp` | 崩溃恢复 |
| localStorage | UI 偏好（主题、最近路径元数据） |
| 内存 | 当前会话 |

不做强制云同步。

## 6. 扩展点（远期）

- `Exporter` 接口：`export(project, options) → Blob`  
- `Validator` 插件：返回 issue 列表  
- 绿波 / 地图 为独立 app 模式，共享 domain 类型  

## 7. 与原 TrafficCanvas 文档关系

原 Electron+Pixi+Zustand 方向采纳；品牌与范围以 Crossdraw 路线图为准；存储以 JSON `.rtp` 清晰化（可版本化），SQLite 仅可选缓存元数据，不作为 V1 必项。
