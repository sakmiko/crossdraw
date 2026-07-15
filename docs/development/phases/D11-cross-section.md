# D11 — 横断面简绘

**依赖：** D07  
**产出：** 断面模式  

## 1. 目标

从进口参数生成简绘断面；联动 stale。

## 2. 组件（MVP）

人行 | 非机(可选) | 机动车道×N | 中分 | 对向机动车…（对称或按出口）

## 3. 工作内容

1. `buildCrossSection(approach) → components[]`  
2. 画布 2D 简绘（可用 Pixi 或 SVG DOM，优先统一 Pixi）  
3. stale：approach hash 变化  
4. 一键刷新  

## 4. 借鉴

- RoadGee：路口一键生成断面  
- StreetMix：组件条带 UX  

## 5. 通过条件

| ID | 条件 |
|----|------|
| UT-XS-001 | 3 车道 → 3 车行组件 |
| UT-XS-002 | 改宽度后 stale true |
| IT-XS-001 | 刷新后 stale false 且图更新 |

## 6. 提交

`feat(xsection): schematic cross-section from approach`
