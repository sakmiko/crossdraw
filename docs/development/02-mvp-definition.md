# MVP 定义与总通过条件

**状态：** Accepted  
**版本：** 0.2.0

## 1. MVP 是什么

**最小可对外演示的本地交叉口出图器**，满足：

```
新建十字模板
 → 调整渠化参数并见画布更新
 → 输入流量见箭头
 → 编辑信号相位
 → 生成进口横断面简绘
 → 保存/打开 .rtp
 → 导出 PNG + SVG + DXF
 → 刷新后可恢复 / 自动保存可用
```

运行形态：**浏览器本地 dev/build 预览**（跨平台）。Electron 包装可为 D15 增强，**不阻塞 MVP**（若 Electron 未就绪，提供 `npm run build && npm run preview` 说明即可）。

## 2. MVP 包含（Must）

| 域 | 内容 |
|----|------|
| 工程 | npm 脚本、TS strict、lint、单测、E2E 主路径 |
| 数据 | schemaVersion=1 的 .rtp 读写 |
| 方案树 | 渠化/流量/信号 增删改复制（默认上限≥10） |
| 几何 | 标准十字生成稳定；参数改车道/展宽正确重算 |
| 渠化 UI | 右侧参数绑定；选中进口高亮 |
| 流量 | 转向矩阵、大车比、PHF、饱和流率、箭头层 |
| 信号 | 相位列表、周期、基础 Ring/条带、基础冲突 WARN |
| 断面 | 简绘；从进口生成；渠化变更 stale+刷新 |
| 规范 | 默认值；宽≤0 等 BLOCK；偏离 WARN |
| 导出 | PNG（1×）、SVG、DXF（ROAD/MARKING/ISLAND/ANNO） |
| 示例 | ≥3 个示例工程 |
| 体验 | 撤销/重做；Ctrl+S；模式 1–4 切换 |

## 3. MVP 不包含（Explicit Out）

Webster 自动配时、分析四指标、Excel、绿波、地图、实景断面、Vissim inpx、辅路完整、可变车道完整、借道左转完整、搭接相位完整、多交叉口。

（可在 UI 灰显「后续版本」但不计入 MVP。）

## 4. MVP 总通过条件（全部满足）

### 4.1 自动化

```bash
npm ci
npm run lint
npm run test
npm run test:e2e
npm run build
```

全部 exit code 0。

### 4.2 主路径 E2E（`e2e/mvp-main-path.spec.ts`）

| 步骤 | 期望 |
|------|------|
| 打开应用 | 标题含 Crossdraw |
| 新建十字 | 画布出现路口 mesh |
| 改东进口车道数 | 几何变化（截图或 DOM/数据断言） |
| 填流量 | 箭头层可见或数据非零 |
| 加相位设周期 | store 中 signal 正确 |
| 生成断面 | 断面模式有组件 |
| 下载/保存 rtp | 文件非空且可 parse |
| 导出 png/svg/dxf | 三个 blob size>0 |

### 4.3 人工抽检（发布前）

- [ ] Windows 或 macOS 或 Linux 之一：`npm run preview` 走通主路径  
- [ ] 导出 DXF 用任意 CAD/查看器打开无致命错误  
- [ ] 中文标注不乱码  
- [ ] 无个人隐私信息  

### 4.4 质量门槛

| 指标 | 门槛 |
|------|------|
| domain 单测 | geometry/validate/rtp 相关 ≥ 关键路径全覆盖 |
| 撤销 | 连续 5 次编辑可撤回到初始 |
| 性能 | 标准十字编辑交互无明显卡顿（目标 60fps，允许 dev 放宽） |

## 5. MVP 失败判定

任一成立即未过 MVP：

- 改车道数断面或渠化不更新  
- rtp 无法 roundtrip  
- 导出缺一种格式  
- 主路径 E2E 红  
- 存在密钥或隐私信息  

## 6. MVP 之后

进入 V1.1 规格（分析等），见 `product/03-roadmap.md`。
