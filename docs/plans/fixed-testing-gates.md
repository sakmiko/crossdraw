# 固定测试门禁

## 每次 PR

```bash
pnpm lint
pnpm test
pnpm build
```

## 合并 main 额外

```bash
pnpm test:e2e
```

## 领域门禁

- geometry 包变更必须带/更新 golden fixture
- analysis 公式变更必须更新数值夹具与文档 `specs/04`

## V1 验收路径

见功能规格 §8；自动化为 e2e `tests/e2e/main-path.spec.ts`。
