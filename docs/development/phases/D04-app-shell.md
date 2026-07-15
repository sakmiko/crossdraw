# D04 — 应用壳与布局

**依赖：** D00  
**产出：** 三栏壳 + 模式切换 UI  

## 1. 目标

实现 `specs/01-ui-design.md` 布局 token 的静态壳。

## 2. 区域

- 顶栏：文件菜单占位、撤销重做占位、保存占位  
- 左：项目/方案树占位  
- 中：画布挂载点 `#canvas-root`  
- 右：模式 Segmented：渠化|流量|信号|断面  
- 底：状态栏  

## 3. 通过条件

| ID | 条件 |
|----|------|
| IT-UI-001 | 四模式可切换且右侧标题变 |
| IT-UI-002 | 布局尺寸符合 token（允许 ±4px） |
| 手动 | 无 emoji |

## 4. 提交

`feat(ui): app shell three-pane layout`
