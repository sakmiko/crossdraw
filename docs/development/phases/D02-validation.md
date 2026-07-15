# D02 — 校验引擎

**依赖：** D01  
**产出：** `domain/validate`  

## 1. 目标

实现 OK/WARN/BLOCK 规则骨架，默认值对照 `specs/06-standards-defaults.md`。

## 2. 规则（MVP 最小集）

| code | level | 条件 |
|------|-------|------|
| WIDTH_NON_POSITIVE | block | 任一道宽 ≤0 |
| LANE_COUNT_INVALID | block | 车道数 <1 或非整数 |
| WIDTH_OFF_DEFAULT | warn | 机动车道宽偏离模板默认 |
| CYCLE_NON_POSITIVE | block | 周期 ≤0（若有信号） |
| EMPTY_PHASES | warn | 信号方案 0 相位 |

每条 Issue 含：`id, level, code, message, path, standardRef?`

## 3. 通过条件

| ID | 条件 |
|----|------|
| UT-VAL-001 | 宽 0 → block |
| UT-VAL-002 | 宽 2.5（若默认 3.5）→ warn |
| UT-VAL-003 | 合法模板 → 无 block |
| UT-VAL-004 | path 为 json pointer 风格 |

## 4. 提交

`feat(domain): add validation issues engine`
