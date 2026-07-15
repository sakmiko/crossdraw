# D15 — 跨平台打包（可选增强）

**依赖：** D14  
**产出：** 桌面壳或发布说明  

## 1. 目标

在 Web MVP 已通过前提下，增强桌面体验。

## 2. 方案

- Electron + electron-builder  
- 目标：win/mac/linux  
- 菜单绑定打开/保存  
- 未签名包注明  

## 3. 通过条件

| 检查 | 标准 |
|------|------|
| 构建 | 至少 linux 产物成功（CI 环境） |
| 打开 | 能加载 D14 示例 |

**注意：D15 不阻塞 MVP 徽章。**

## 4. 提交

`feat(desktop): electron wrapper optional`
