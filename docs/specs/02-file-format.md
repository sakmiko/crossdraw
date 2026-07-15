# 文件格式 .rtp

**状态：** Accepted  
**版本：** schema 1

## 1. 概述

- 扩展名：`.rtp`  
- 编码：UTF-8  
- 形态：JSON（可 `rtp.json` 调试）  
- 可选：gzip 包装 `.rtpz`（V1.1）

## 2. 顶层结构

```json
{
  "format": "crossdraw.rtp",
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "project": { }
}
```

## 3. 兼容性

| schemaVersion | 支持 |
|---------------|------|
| 1 | V1 读写 |
| >1 | 需 migration 模块 |

迁移函数：`migrate(data): ProjectFile` 纯函数链。

## 4. 校验

- 启动加载：JSON parse → schema 校验（zod/ajv）→ migrate → 入 store  
- 失败：不覆盖原文件；保留 `.bak`

## 5. 自动保存

- 同目录：`.<name>.rtp.autosave`  
- 或用户缓存目录（Electron `userData`）  

## 6. 最小示例

```json
{
  "format": "crossdraw.rtp",
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "project": {
    "id": "01HEXAMPLE",
    "name": "示例十字",
    "units": "metric",
    "channelizationSchemes": [],
    "active": { "channelId": null, "flowId": null, "signalId": null },
    "meta": { "createdAt": "2026-07-15T00:00:00Z", "updatedAt": "2026-07-15T00:00:00Z" }
  }
}
```
