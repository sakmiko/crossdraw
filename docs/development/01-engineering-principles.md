# 工程原则

**状态：** Accepted

## 1. 总则

1. **规格先于代码**：阶段文件写清再动手。  
2. **测试先于「看起来能跑」**：domain 强制；UI 主路径 E2E。  
3. **小步提交**：一个阶段可对应 1–N 个 commit，需可回滚。  
4. **远程备份**：阶段通过后 `git push origin main`。  
5. **跨平台**：开发与脚本用 npm；路径用 Node `path`/`path-browserify` 策略见 D00。  
6. **许可证**：依赖 MIT/BSD/Apache；产品 GPLv3。  

## 2. 编码规范

- 标识符英文；UI 文案中文  
- `strict: true`，禁止随意 `any`（必要时局部 + 注释）  
- 文件名：domain 用 kebab 或清晰模块目录  
- 错误：domain 返回 `Result`/`Issue`，不抛不可恢复业务异常  

## 3. Git

```
feat(domain): ...
fix(canvas): ...
test(geometry): ...
docs(dev): ...
chore(tooling): ...
```

作者：`sakmiko` + `sakmiko@users.noreply.github.com`（无真实邮箱入库）

## 4. 禁止

- 提交密钥、PAT、个人手机邮箱  
- 提交 RoadGee 等商业资源  
- 在未过阶段门禁时合并「半成品主路径」到宣称完成  
- 为赶工删除 golden 测试  

## 5. 文档更新

行为变更必须同步：

- `product/04-functional-spec.md` 或本目录 phase  
- 若改 schema → `specs/02-file-format.md` + migration  
- 若改公式 → `specs/04-analysis-algorithms.md` + 夹具  
