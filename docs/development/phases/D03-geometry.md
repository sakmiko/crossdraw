# D03 — 几何引擎（十字）

**依赖：** D01  
**产出：** `domain/geometry` 纯函数  

## 1. 目标

`rebuildChannelMesh(scheme) → Mesh`，稳定生成标准十字。

## 2. Mesh 结构

```ts
type Mesh = {
  polygons: { layer: string; points: [number,number][]; meta?: object }[]
  polylines: { layer: string; points: [number,number][]; meta?: object }[]
  labels: { text: string; at: [number,number]; meta?: object }[]
  bbox: { minX:number; minY:number; maxX:number; maxY:number }
}
```

图层名与 DXF 对齐：`ROAD` `MARKING` `ISLAND` `ANNO`

## 3. 算法要求（MVP）

1. 四进口按 bearing 0/90/180/270 或用户 bearing  
2. 每进口 ribbon：入口车道 + 出口车道 + 中分宽  
3. 停止线、人行横道矩形  
4. 展宽：简化梯形扩展（文档允许简化）  
5. 右转渠化：固体=岛多边形；划线=多段线  
6. **确定性**：同输入同输出（浮点稳定 round）  

## 4. 参考调研

- RoadGee：参数驱动非自由线  
- CAD：图层分离  

## 5. 通过条件

| ID | 条件 |
|----|------|
| UT-GEO-001 | 默认十字 bbox 合理（非 0 面积） |
| UT-GEO-002 | 车道 2→3 后 ROAD 面积或宽度指标增加 |
| UT-GEO-003 | 黄金点集距离 < 1e-4（关键折线） |
| UT-GEO-004 | 无 NaN/Infinity |

## 6. 测试方法

- golden JSON：关键角点  
- 属性测试：随机合法参数 50 次无 NaN  

## 7. 风险

路口中心拼接缝：允许小幅重叠，禁止大洞（后续修补）。

## 8. 提交

`feat(domain): cross intersection mesh builder`
