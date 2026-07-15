# D07 — 渠化编辑闭环

**依赖：** D03, D05, D06  
**产出：** 参数面板 ↔ 几何 ↔ 画布  

## 1. 目标

用户改右侧进口参数，画布立即重建（debounce ≤50ms 或同步）。

## 2. 面板字段（MVP）

见 `product/04-functional-spec.md` 渠化分组：车道数、宽度/分宽、展宽数、展宽长、渐变、右转渠化开关与类型、中分、人行宽、非机开关。

## 3. 流程

```
onChange → store.updateApproach → select scheme → rebuildChannelMesh → syncMesh
```

## 4. 通过条件

| ID | 条件 |
|----|------|
| IT-CHN-001 | 车道 2→3 触发 rebuild 调用 |
| IT-CHN-002 | 选中进口高亮切换 |
| E2E-MVP- partial | 主路径前半 |

## 5. 体验

- 数字输入非法不写 store  
- 显示当前校验 WARN  

## 6. 提交

`feat(ui): channelization editor bound to geometry`
