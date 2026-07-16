/**
 * One-click VISSIM open interchange download helper (honest non-PTV-binary pack).
 */
import type { Approach, FlowScheme, SignalScheme } from '@/domain/types'
import { buildVissimInpxPack } from '@/io/vissimInpx'
import { downloadText } from '@/io/download'

export function downloadVissimPack(
  projectName: string,
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): { fileCount: number; honesty: string } {
  const pack = buildVissimInpxPack(projectName, approaches, flow, signal)
  downloadText(`${projectName}-vissim-README.md`, pack.readme, 'text/markdown')
  downloadText(`${projectName}.inpx.xml`, pack.xml, 'application/xml')
  downloadText(`${projectName}-vissim-summary.json`, pack.json, 'application/json')
  downloadText(`${projectName}-vissim-links.csv`, pack.bundle.links, 'text/csv')
  downloadText(`${projectName}-vissim-routes.csv`, pack.bundle.routes, 'text/csv')
  downloadText(`${projectName}-vissim-volumes.csv`, pack.bundle.volumes, 'text/csv')
  downloadText(`${projectName}-vissim-signal.csv`, pack.bundle.signal, 'text/csv')
  return {
    fileCount: 7,
    honesty: '开放交换 XML+CSV，非 PTV 专有 .inpx 二进制',
  }
}

export function vissimPackSummaryMarkdown(
  projectName: string,
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): string {
  const pack = buildVissimInpxPack(projectName, approaches, flow, signal)
  return [
    `# ${projectName} · VISSIM 交换包说明`,
    '',
    `- 进口数 ${approaches.length} · 流量方案 ${flow.name} · 信号 ${signal.name} · C=${signal.cycleSec}s`,
    `- 文件：README · .inpx.xml · summary.json · links/routes/volumes/signal.csv`,
    `- **诚实边界：开放交换格式，非 PTV 专有二进制 .inpx**`,
    '',
    '## README 摘要',
    '',
    pack.readme.slice(0, 800),
    pack.readme.length > 800 ? '\n…' : '',
  ].join('\n')
}
