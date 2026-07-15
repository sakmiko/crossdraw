# D12 — 持久化与恢复

**依赖：** D01, D05  
**产出：** 打开/保存/自动保存  

## 1. 目标

本地文件为真相；无账号。

## 2. 工作内容

1. 浏览器：`<input type=file>` 打开；`Blob` 下载保存  
2. 可选：File System Access API（Chrome）保留句柄  
3. autosave：localStorage 或 IndexedDB 存最近草稿（跨平台通用）  
4. 启动检测草稿 → 提示恢复  
5. dirty 标记与窗口 `beforeunload`  

## 3. 通过条件

| ID | 条件 |
|----|------|
| E2E-IO-001 | 保存再打开数据一致 |
| IT-IO-001 | 编辑后 dirty |
| IT-IO-002 | autosave 可恢复 |

## 4. 提交

`feat(io): open save autosave restore for rtp`
