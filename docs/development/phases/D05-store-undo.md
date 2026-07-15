# D05 — Store 与撤销

**依赖：** D01, D04  
**产出：** Zustand slices + zundo  

## 1. 目标

`architecture/03-state-management.md` 落地。

## 2. Actions（MVP）

- `loadProject` / `resetToTemplate`  
- `updateApproach`  
- `setVolume`  
- `addPhase` / `updatePhase` / `setCycle`  
- `setMode` / `selectApproach`  
- `duplicateScheme` / `deleteScheme` / `setActive`  
- `markDirty` / `markClean`  

## 3. 撤销

- 仅 track `project`  
- 拖拽预览可 pause（若暂无拖拽可略）  
- 栈深 ≥100 或库默认  

## 4. 通过条件

| ID | 条件 |
|----|------|
| UT-ST-001 | updateApproach 后可 undo |
| UT-ST-002 | redo 恢复 |
| UT-ST-003 | selection 不污染 project 历史（或可接受分离） |

## 5. 提交

`feat(state): zustand project store with undo`
