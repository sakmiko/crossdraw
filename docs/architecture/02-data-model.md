# 领域数据模型

**状态：** Accepted  
**版本：** 0.1.0

## 1. 设计原则

- **车道组（LaneGroup）一等公民**（吸收 HCM/SIDRA 概念）  
- 几何是派生，**可重建**；持久化以参数为主，可缓存 mesh 加速  
- ID 稳定：字符串 ULID/UUID，禁止数组下标当 ID  

## 2. ER 关系

```
Project 1──* ChannelizationScheme
ChannelizationScheme 1──* Approach
ChannelizationScheme 1──* FlowScheme
FlowScheme 1──* SignalScheme
Approach 1──* LaneGroup
LaneGroup 1──* Lane
SignalScheme 1──* Phase
Phase *──* Movement (turn + approach)
```

## 3. 核心类型（概念 Schema）

### Project

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | |
| name | string | |
| version | number | schema 版本 |
| units | `metric` | V1 仅公制 |
| crs | optional | V2 地图 |
| channelizationSchemes | ChannelizationScheme[] | |
| active | { channelId, flowId, signalId } | |
| meta | createdAt, updatedAt, author | |

### ChannelizationScheme

| 字段 | 说明 |
|------|------|
| id, name | |
| intersectionType | `cross` `t` `custom` |
| approaches | Approach[] |
| display | background, northArrow, paperSize |

### Approach

| 字段 | 说明 |
|------|------|
| id, name, bearingDeg | 方向 |
| entryLanes / exitLanes | Lane 参数 |
| widen | 展宽段/渐变/偏移 |
| rightTurnChannel | 渠化岛参数 |
| median | 中分样式+宽 |
| sidewalk / bike | |
| flags | leftWait, throughWait, borrowLeft, redRightTurn |

### Lane / LaneGroup

| 字段 | 说明 |
|------|------|
| widthM | 或 widths[] |
| movements | left/through/right/u-turn 集合 |
| satFlowPcu | 可选覆盖 |

### FlowScheme

| 字段 | 说明 |
|------|------|
| volumes | map approachId → { U,L,T,R } |
| heavyRatio, phf | |
| satFlowDefaults | |
| style | 箭头样式 |

### SignalScheme

| 字段 | 说明 |
|------|------|
| cycleSec | |
| phases | Phase[] |
| rings | 可选 Ring-Barrier 结构 |
| yellowDefault, allRedDefault, startLoss | |

### CrossSection

| 字段 | 说明 |
|------|------|
| approachId | |
| components[] | type+width+style |
| stale | 与渠化不同步标记 |

## 4. 派生几何

```ts
// 伪代码
type Mesh = { polygons: Poly[]; polylines: Line[]; labels: Label[] }
function rebuildChannelMesh(scheme: ChannelizationScheme): Mesh
```

持久化：V1 可不存 Mesh；若存，必须带 `sourceHash` 校验。

## 5. 校验问题模型

```ts
type Issue = {
  id: string
  level: 'ok' | 'warn' | 'block'
  code: string
  message: string
  path: string // json pointer
  standardRef?: string
}
```

## 6. 与文件格式

JSON 字段命名 **camelCase**；见 `specs/02-file-format.md`。
