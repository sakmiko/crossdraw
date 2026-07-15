# D06 — 画布基建

**依赖：** D03（可先 mock mesh）, D04  
**产出：** Pixi 视口  

## 1. 目标

挂载 Pixi，实现缩放、平移、网格、指北针占位、图层容器。

## 2. 工作内容

1. `CanvasHost` 生命周期 create/destroy  
2. 滚轮缩放（光标中心）  
3. 中键/Space+拖 平移  
4. 图层：L1 网格 … L5 交互  
5. `syncMesh(mesh)` 接口：清空业务层后重建 graphics  
6. 坐标：世界单位米；屏幕转换函数单测  

## 3. 官方文档

PixiJS Application, Container, Graphics, FederatedPointerEvent

## 4. 通过条件

| ID | 条件 |
|----|------|
| IT-CV-001 | 传入 mesh 后出现图元 |
| IT-CV-002 | 缩放后仍可 hit 测试（可选） |
| UT-CV-001 | worldToScreen 往返误差 <1e-6 |

## 5. 提交

`feat(canvas): pixi viewport and mesh sync`
