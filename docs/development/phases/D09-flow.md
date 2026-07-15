# D09 — 流量与箭头图

**依赖：** D07, D08  
**产出：** 流量模式  

## 1. 目标

对齐 RoadGee 流量输入与箭头图；折算规则见 `specs/04` 预处理。

## 2. 工作内容

1. 转向矩阵 UI（进口 × U/L/T/R）  
2. 大车比、PHF、饱和流率  
3. `domain/flow/convertVolumes`  
4. 箭头 mesh 层：流量映射线宽  
5. Tab 键切换单元格  

## 3. 通过条件

| ID | 条件 |
|----|------|
| UT-FLW-001 | 大车比 0 → PCU=自然量 |
| UT-FLW-002 | PHF 0.95 放大高峰 |
| IT-FLW-001 | 输入后箭头层非空 |
| IT-FLW-002 | 绘图属性改颜色生效 |

## 4. 提交

`feat(flow): volume matrix and arrow layer`
