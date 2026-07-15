# 跨平台与 npm 约定

**状态：** Accepted

## 1. 包管理

- **唯一标准：npm**  
- 锁文件：`package-lock.json` 必须提交  
- 安装：`npm ci`（CI）/ `npm install`（本地）  
- 禁止在文档中要求 pnpm/yarn（个人可用但不支持）  

## 2. Node 版本

- 建议：Node **20 LTS** 或 **22 LTS**  
- `engines` 字段写入 `package.json`：`">=20"`  

## 3. 操作系统

| OS | 开发 | 构建产物 |
|----|------|----------|
| Linux | 一等 | Web 静态资源 |
| Windows | 一等 | 同左；注意路径 |
| macOS | 一等 | 同左 |

Electron 安装包（D15）：`electron-builder` 多目标；缺签证书时允许 unsigned 说明。

## 4. 路径与文件

- 业务代码不写死 `C:\` 或仅 POSIX 假设  
- 使用 `path`；浏览器侧仅用逻辑相对名 + File API  
- 文本统一 UTF-8；git `core.autocrlf` 不强制改用户全局，fixture normalize  

## 5. 脚本标准（D00 落地）

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## 6. CI 建议（D14）

GitHub Actions：`ubuntu-latest` 跑 lint/test/build/e2e；可选 `windows-latest` 跑 `npm ci && npm test`。
