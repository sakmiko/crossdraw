# D13 — 导出 PNG / SVG / DXF

**依赖：** D06, D03  
**产出：** 三套导出  

## 1. 目标

报告/CAD 可用导出；**不从 GPU 反推业务几何**。

## 2. 实现

| 格式 | 策略 |
|------|------|
| PNG | Pixi extract 或离屏 canvas，1×（2× 可选） |
| SVG | `meshToSvg(mesh)` 自研 |
| DXF | 评估 MIT 库写 POLYLINE/TEXT/LAYER |

图层：ROAD / MARKING / ISLAND / ANNO / FRAME

## 3. 通过条件

| ID | 条件 |
|----|------|
| UT-DXF-001 | 输出含 `LAYER` 与点 |
| UT-SVG-001 | 输出含 polygon/path |
| E2E-EXP-001 | 三按钮产生非空文件 |
| 手动 | DXF 用查看器打开 |

## 4. 提交

`feat(export): png svg dxf exporters`
