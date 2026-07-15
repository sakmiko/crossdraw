# D10 — 信号与 Ring-Barrier

**依赖：** D08, D09  
**产出：** 信号模式  

## 1. 目标

手动相位编辑 + 简单 Ring/条带图 + 冲突 WARN。  
Webster：**灰显**，指向 V1.2。

## 2. 工作内容

1. 相位列表：名、绿、黄、全红、放行转向集合  
2. 周期 C  
3. 顺序调整  
4. 可视化：水平条或双环简图  
5. `domain/signal/conflicts`：对向直行 vs 左转等基础矩阵  

## 3. 调研对齐

- RoadGee：相位属性、顺序、搭接（搭接延期）  
- Synchro：时间线表达（可借鉴 UI）  

## 4. 通过条件

| ID | 条件 |
|----|------|
| UT-SIG-001 | 周期/相位写入 |
| UT-SIG-002 | 明显冲突返回 warn |
| IT-SIG-001 | UI 增删相位 |
| IT-SIG-002 | 顺序上移下移 |

## 5. 提交

`feat(signal): phase editor and basic ring view`
