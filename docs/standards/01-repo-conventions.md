# 仓库与工程约定

**状态：** Accepted  
**版本：** 0.1.0

## 1. 命名

| 对象 | 约定 |
|------|------|
| 产品名 | **Crossdraw**（对外唯一） |
| 包名 / 仓库 | `crossdraw` |
| 项目文件扩展名 | `.rtp`（Road Traffic Project） |
| 品牌旧称 | TrafficCanvas 仅历史文档提及，代码与 UI 禁止出现 |

## 2. 目录约定

```
crossdraw/
├── docs/                 # 文档（本树）
├── assets/               # 设计资源、fixture 图（非运行时依赖）
├── scripts/              # 维护脚本
├── src/                  # 源代码（脚手架后填充）
│   ├── app/              # 壳与路由
│   ├── canvas/           # 渲染
│   ├── domain/           # 领域模型与纯函数引擎
│   ├── state/            # 状态
│   ├── ui/               # 界面组件
│   ├── io/               # 读写导出
│   └── shared/           # 工具与类型
├── tests/                # 单测 / 集成 / e2e
├── package.json
├── LICENSE
└── README.md
```

## 3. Git 约定

### 分支

| 分支 | 用途 |
|------|------|
| `main` | 稳定可构建 |
| `docs/*` | 纯文档 |
| `feat/*` | 功能 |
| `fix/*` | 修复 |
| `chore/*` | 工程杂项 |

### Commit message（Conventional Commits）

```
feat(domain): add approach lane width array parser
fix(canvas): correct stop-line offset on widen
docs(prd): clarify V1 export scope
chore(repo): init gitignore and license
```

类型：`feat` `fix` `docs` `style` `refactor` `test` `chore` `perf` `build` `ci`

### 提交粒度

- 文档与代码尽量分 commit  
- 每个 commit 可编译（代码阶段）  
- 禁止提交密钥、授权码、第三方闭源资源

## 4. 文档变更规则

1. 改范围（V1 做什么/不做什么）→ 必须改 `product/03-roadmap.md`  
2. 改用户可见行为 → 必须改 `product/04-functional-spec.md`  
3. 改数据结构 → 必须改 `architecture/02-data-model.md` + `specs/02-file-format.md`  
4. 调研结论不直接等于承诺功能

## 5. 法律与道德红线

- 禁止使用 RoadGee 或其他商业软件的程序资源、图标、示例工程二进制  
- 允许学习公开文档中的**工作流、公式引用的国标/HCM 思路**  
- 对外文案禁止「破解 / 去水印 / 官方镜像」等表述  
- 商标：不使用「RoadGee」作为产品名或域名主体

## 6. 语言

- 代码、标识符、commit：英文  
- 产品文档、UI 文案：中文（可后续 i18n）  
- 算法注释：中英均可，公式符号与论文/国标一致  
