# 架构决策记录

## ADR-001：本地 Web 优先 + Electron 发布

- 日期：2026-07-15  
- 状态：Accepted  
- 上下文：需快速迭代画布又要桌面文件体验  
- 决策：开发用 Vite Web；V1 RC 用 Electron 包装  
- 后果：两套跑法；共享同一套前端代码  

## ADR-002：PixiJS 作为主画布

- 状态：Accepted  
- 决策：WebGL 2D 场景树；导出不依赖 GPU 反读  
- 后果：需维护 canvas bridge  

## ADR-003：GPLv3

- 状态：Accepted  
- 决策：保证开源 reciprocal  
- 后果：企业闭源分发需遵从 GPL 义务  

## ADR-004：方案树对齐主流工具心智

- 状态：Accepted  
- 决策：渠化⊃流量⊃信号，但数量上限可配置  
- 后果：与 SaaS 用户迁移成本低  
