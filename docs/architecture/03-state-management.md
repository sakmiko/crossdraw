# 状态管理

**状态：** Accepted  
**版本：** 0.1.0

## 1. Store 切片

| Slice | 内容 |
|-------|------|
| `projectSlice` | 当前 Project 树 |
| `selectionSlice` | 选中 approach/phase/scheme |
| `uiSlice` | 模式、面板折叠、缩放、主题 |
| `historySlice` | zundo 配置与暂停点 |
| `ioSlice` | 路径、dirty、saveState |

## 2. 动作边界

允许：

```
addApproach / updateApproachParams / setVolume / addPhase / setCycle
duplicateScheme / deleteScheme / setActiveScheme
```

禁止：UI 组件直接深改嵌套对象绕过 action。

## 3. 撤销

- zundo 跟踪 `project` 树  
- 选中态默认不进历史（或与 project 分离）  
- 拖拽预览：`history.pause()` 结束再 commit  

## 4. 派生数据

- `mesh`：由 geometry 引擎缓存，key=schemeId+hash  
- `metrics`：V1.1 分析缓存  
- React 用 selectors 减少重渲  

## 5. 持久化时机

| 事件 | 行为 |
|------|------|
| 编辑 | dirty=true |
| 30s timer | autosave |
| Ctrl+S | 写主文件，清 dirty |
| 切换方案 | 可选立即 autosave |
