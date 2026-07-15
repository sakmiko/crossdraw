# D00 — 工程脚手架

**状态：** Ready to implement  
**依赖：** 无  
**产出：** 可运行的 Vite+React+TS 空应用  

## 1. 目标

建立跨平台 npm 工程，后续所有阶段在此之上迭代。

## 2. 工作内容

1. `npm create vite@latest`（react-ts）于仓库根或 `src` 对齐约定  
2. 目录：
```
src/
  app/
  domain/
  canvas/
  state/
  ui/
  io/
  shared/
tests/
public/
```
3. ESLint + Prettier + `tsconfig` strict  
4. 路径别名 `@/*` → `src/*`  
5. 首页显示 **Crossdraw** 与版本占位  
6. `.nvmrc` 或 `engines`  
7. README 写明 `npm install` / `npm run dev`  

## 3. 实现要求

- 包管理 **仅 npm**  
- 不引入 Electron（D15）  
- GPLv3 LICENSE 保持  
- 无隐私信息  

## 4. 通过条件

| 检查 | 命令/标准 |
|------|-----------|
| 安装 | `npm install` exit 0 |
| 类型 | `npm run typecheck` exit 0 |
| 构建 | `npm run build` 产出 `dist/` |
| 开发 | 浏览器打开无控制台 error |
| lint | `npm run lint` exit 0 |

## 5. 测试

| ID | 类型 | 用例 |
|----|------|------|
| UT-APP-000 | smoke | 可 import 根组件（可选） |
| 手动 | | 三系统之一 dev 打开 |

## 6. 提交

```
chore(tooling): scaffold vite react-ts with npm
```

推送 `origin/main`。
