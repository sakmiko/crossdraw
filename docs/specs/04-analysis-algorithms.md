# 分析与配时算法规格

**状态：** Accepted  
**版本：** 0.1.0  
**范围：** V1.1+ 实现；V1 可只读展示占位  
**注意：** 下列为工程实现规格，引用公开方法论与 RoadGee 公开说明口径；以可单测为准。

## 1. 流量预处理

1. 自然车辆数 V_nat  
2. 大车折算：`V_pcu = V_nat * (1 + heavyRatio * (PCE-1))`（PCE 默认 2.0，可配置；若 heavyRatio=0 则 V_pcu=V_nat）  
3. 高峰：`V_peak = V_pcu / PHF`（PHF=1 则不变）  

RoadGee 文档称未做转向直行当量转换——Crossdraw V1.1 **默认同样不做**，可选开关「转向当量」放 V1.2。

## 2. 绿信比与有效绿

```
g_e = g_display + yellow - startLoss   // 可配置；默认 yellow=3, startLoss=3 → g_e≈g_display
λ = g_e / C
```

## 3. 饱和度

```
CAP = S * λ
x = V_peak / CAP
```

交叉口平均饱和度：各进口（或车道组）x 按 V_peak 加权平均。

## 4. 延误（简化 HCM 型）

采用均匀延误 + 随机附加延误（无初始排队项），定时信号 e=0.5，分析期 T=0.25h。  
实现时公式与单元测试夹具对齐 `tests/fixtures/analysis/*`。

## 5. 排队长度

参照 HCM2000 思路 Q=Q1+Q2；孤立交叉口系数取 1；输出米时 `m = veh * 5.5`。

## 6. 服务水平

双指标表（延误 / 饱和度），默认参照 CJJ/T 141-2010 思想划分档位；冲突时以延误为准。  
表数据置于 `domain/analysis/losTables.ts` 可配置。

## 7. Webster 自动配时（V1.2）

输入：目标 x、PHF、启动损失、相位关键流率比 y_i、Y=Σy_i。  
输出：C 与各相位 g。  
支持固定 C 仅分配绿。搭接相位：V1.2 基础支持，复杂 overlap 单测驱动。

## 8. 测试要求

每个公式至少 3 个数值夹具（手算期望）。
