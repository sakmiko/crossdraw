# Phase 00–05 基础

## 00 脚手架

- [ ] pnpm init，Vite React-TS 模板
- [ ] strict TS、ESLint、Prettier
- [ ] 路径别名 `@/`
- [ ] 空页面标题 Crossdraw
- [ ] README 开发命令

## 01 领域契约

- [ ] `src/domain/types.ts` 按数据模型
- [ ] zod schema 与 rtp 顶层
- [ ] fixtures：最小十字 project JSON
- [ ] 单测：parse/serialize roundtrip

## 02 校验

- [ ] `validateProject` 返回 Issue[]
- [ ] 宽度≤0 → BLOCK；偏离默认 → WARN
- [ ] 单测表驱动

## 03 几何原型

- [ ] `buildCrossIntersection(approaches) → Mesh`
- [ ] 单元黄金折线（允许 epsilon）
- [ ] 不接 UI

## 04 应用壳

- [ ] 顶栏/左/右/状态栏布局组件
- [ ] 模式枚举切换（无业务）

## 05 Store

- [ ] projectSlice + selection + ui
- [ ] zundo 撤销重做
- [ ] 用 fixture 水合 store
