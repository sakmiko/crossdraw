# 测试策略与门禁

**状态：** Accepted

## 1. 金字塔

```
        E2E (Playwright)     少而关键：MVP 主路径
       /                  \
  组件/集成测              画布 bridge、面板绑定
     /                      \
Domain 单测 (Vitest)         几何、校验、rtp、流量折算、信号
```

## 2. 目录约定

```
tests/
  unit/domain/
  unit/io/
  integration/
  e2e/
  fixtures/
    rtp/
    geometry/golden/
    analysis/          # V1.1+
```

## 3. 脚本（npm）

| 脚本 | 含义 |
|------|------|
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:watch` | 开发 |
| `npm run test:e2e` | Playwright |
| `npm run build` | 生产构建 |
| `npm run typecheck` | `tsc --noEmit` |

## 4. 门禁

### PR / 阶段完成

必须：`lint` + `typecheck` + `test` + `build`

### 合并宣称「主路径完成」

额外：`test:e2e`

### Golden 规则

- 几何变更更新 golden，并在 PR 说明数值差原因  
- 禁止删除失败测试充绿  

## 5. 用例 ID 规范

```
UT-GEO-001   单元-几何
UT-VAL-001   单元-校验
UT-RTP-001   单元-文件
UT-FLW-001   单元-流量
UT-SIG-001   单元-信号
IT-CHN-001   集成-渠化
E2E-MVP-001  端到端-MVP
```

## 6. 跨平台测试注意

- 路径断言用 `path.join`  
- 换行 CRLF：fixture 读入后 normalize `\r\n`→`\n`  
- 浮点几何：`expect.closeTo` / epsilon 1e-6  

## 7. 视觉回归（可选 D14）

Playwright screenshot；阈值阈值允许小阈值。布局 token 变更时更新基线。
