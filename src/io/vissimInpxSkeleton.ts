/**
 * VISSIM .inpx skeleton — NOT a full PTV file.
 * Emits a structured text package documenting links/routes/signal for manual import.
 * Real binary/XML .inpx remains out of scope until licensed schema work.
 */
import type { Approach, FlowScheme, SignalScheme } from '@/domain/types'
import { exportVissimCsvBundle } from './vissimCsv'

export function vissimInpxReadme(projectName: string): string {
  return `# ${projectName} — VISSIM 导入骨架（Crossdraw）

本导出**不是**完整 PTV Vissim .inpx 工程文件。

## 包含
- links / routes / volumes / signal 四份 CSV（exportVissimCsvBundle）
- 本说明

## 建议
1. 在 Vissim 中按 links 表建路段
2. 用 routes/volumes 配置转向与流量
3. 按 signal 表配置信号灯组与配时

真 .inpx 需 PTV 模式与版本对齐，后续版本再深化。
`
}

export function buildVissimImportPack(
  projectName: string,
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): { readme: string; bundle: ReturnType<typeof exportVissimCsvBundle> } {
  return {
    readme: vissimInpxReadme(projectName),
    bundle: exportVissimCsvBundle(approaches, flow, signal),
  }
}
