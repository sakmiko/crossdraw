# D01 — 领域类型与 .rtp

**依赖：** D00  
**产出：** `domain/types` + zod + codec + fixtures  

## 1. 目标

落地 `architecture/02-data-model.md` 与 `specs/02-file-format.md` 的可运行契约。

## 2. 工作内容

1. TypeScript 类型：Project、ChannelizationScheme、Approach、Lane、LaneGroup、FlowScheme、SignalScheme、Phase、CrossSection、Issue  
2. zod schema 与类型同源（或 zod 推断类型）  
3. `parseRtp(text): ProjectFile` / `serializeRtp(file): string`  
4. `schemaVersion: 1`  
5. fixtures：`tests/fixtures/rtp/minimal-cross.json`  
6. 工厂：`createEmptyProject()` / `createCrossTemplate()`（可只填数据不几何）  

## 3. 实现要求

- ID 使用 ulid/uuid 字符串  
- camelCase JSON  
- 无效 JSON → 明确错误  
- 车道宽度支持 number 或 number[]（分宽）  

## 4. 通过条件

| ID | 条件 |
|----|------|
| UT-RTP-001 | fixture parse → serialize → parse 语义一致 |
| UT-RTP-002 | 缺 format 字段失败 |
| UT-RTP-003 | createCrossTemplate 含 4 approach |
| UT-LG-001 | LaneGroup 类型可表达 L/T/R |

## 5. 测试夹具

手写 minimal 十字：名称「示例十字」，四进口默认 2 车道 3.5m。

## 6. 提交

`feat(domain): add rtp schema types and codecs`
