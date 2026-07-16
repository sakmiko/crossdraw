/**
 * High-resolution flow / OD report pack — textbook ribbon diagram + OD table.
 * Homology: buildFlowAlignment only. No watermark.
 * Style: 城市道路交叉口流量流向图常见教材表达.
 */
import type { Approach, FlowScheme } from '@/domain/types'
import {
  buildFlowAlignment,
  type FlowDisplayMode,
} from '@/domain/flow/flowAlign'
import {
  roadgeeFlowDiagramSvg,
  DEFAULT_ROADGEE_FLOW_STYLE,
  type RoadGeeFlowStyle,
} from './roadgeeFlowDiagram'
import { escapeXml, fmtNum } from './chartStandards'

export function professionalFlowReportSvg(
  approaches: Approach[],
  flow: FlowScheme,
  opts: {
    size?: number
    mode?: FlowDisplayMode
    style?: Partial<RoadGeeFlowStyle>
    title?: string
  } = {},
): string {
  const size = opts.size ?? 900
  const mode = opts.mode ?? 'natural'
  const align = buildFlowAlignment(approaches, flow, mode)
  const diagram = roadgeeFlowDiagramSvg(approaches, flow, {
    size: Math.min(size, 820),
    mode,
    style: { ...DEFAULT_ROADGEE_FLOW_STYLE, thickness: 1.15, font1: 15, font2: 15, font3: 18, ...opts.style },
  })
  // strip outer svg wrapper to embed
  const inner = diagram
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')

  const W = size + 40
  const tableH = 36 + approaches.length * 22 + 48
  const H = size + tableH + 80
  const title = opts.title ?? '交叉口流量流向图'

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="12" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="40" fill="#0f172a" font-size="18" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(title)}</text>`
  g += `<text x="28" y="60" fill="#64748b" font-size="12" font-family="system-ui,sans-serif">${escapeXml(align.unit)} · Σ自然 LTR ${fmtNum(align.totalLTR, 'int')} · Σ高峰 ${fmtNum(align.totalPeakLTR, 'int')} · PHF=${align.phf.toFixed(2)} · 大车比 ${(align.heavyRatio * 100).toFixed(0)}%</text>`
  g += `<text x="${W - 28}" y="40" text-anchor="end" fill="#94a3b8" font-size="11">${size}px · 矢量</text>`

  // embed diagram centered
  const ox = (W - Math.min(size, 820)) / 2
  g += `<g transform="translate(${ox}, 72)">${inner}</g>`

  // OD table
  const ty = size + 80
  g += `<text x="28" y="${ty}" fill="#0f172a" font-size="13" font-weight="700">OD 分向流量表（与编辑器同源）</text>`
  const cols = ['进口', 'L', 'T', 'R', 'U', 'ΣLTR', '方位°']
  const colX = [28, 120, 180, 240, 300, 370, 460]
  cols.forEach((c, i) => {
    g += `<text x="${colX[i]}" y="${ty + 22}" fill="#64748b" font-size="11" font-weight="600">${c}</text>`
  })
  g += `<line x1="28" y1="${ty + 28}" x2="${W - 28}" y2="${ty + 28}" stroke="#e2e8f0"/>`
  align.rows.forEach((r, i) => {
    const y = ty + 46 + i * 22
    const vals = [
      r.approachName,
      fmtNum(r.chartL, 'int'),
      fmtNum(r.chartT, 'int'),
      fmtNum(r.chartR, 'int'),
      fmtNum(r.U, 'int'),
      fmtNum(r.chartL + r.chartT + r.chartR, 'int'),
      fmtNum(r.bearingDeg, 'int'),
    ]
    vals.forEach((v, j) => {
      g += `<text x="${colX[j]}" y="${y}" fill="#0f172a" font-size="11" font-family="system-ui,sans-serif">${escapeXml(String(v))}</text>`
    })
  })
  g += `<text x="28" y="${H - 28}" fill="#94a3b8" font-size="10">线宽 ∝ 转向流量 · 无水印 · 改流量表即时更新</text>`
  g += `<text x="${W - 28}" y="${H - 28}" text-anchor="end" fill="#94a3b8" font-size="10">教材/方案流量流向图风格</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function flowOdReportMarkdown(
  projectName: string,
  approaches: Approach[],
  flow: FlowScheme,
  mode: FlowDisplayMode = 'natural',
): string {
  const a = buildFlowAlignment(approaches, flow, mode)
  return [
    `# ${projectName} · 流量流向 OD 简报 · ${flow.name}`,
    '',
    `- 显示：${a.unit} · PHF=${a.phf} · 大车比 ${(a.heavyRatio * 100).toFixed(1)}%`,
    `- Σ LTR 自然 ${a.totalLTR.toFixed(0)} · 高峰 pcu ${a.totalPeakLTR.toFixed(0)}`,
    `- 同源：flowAlign / 流量编辑表`,
    '',
    '| 进口 | 方位° | L | T | R | U | ΣLTR |',
    '|------|------:|--:|--:|--:|--:|-----:|',
    ...a.rows.map(
      (r) =>
        `| ${r.approachName} | ${r.bearingDeg.toFixed(0)} | ${r.chartL.toFixed(0)} | ${r.chartT.toFixed(0)} | ${r.chartR.toFixed(0)} | ${r.U.toFixed(0)} | ${(r.chartL + r.chartT + r.chartR).toFixed(0)} |`,
    ),
  ].join('\n')
}

export function flowOdReportCsv(
  approaches: Approach[],
  flow: FlowScheme,
  mode: FlowDisplayMode = 'natural',
): string {
  const a = buildFlowAlignment(approaches, flow, mode)
  const head = 'approach,bearingDeg,L,T,R,U,sumLTR,mode'
  const rows = a.rows.map(
    (r) =>
      `${JSON.stringify(r.approachName)},${r.bearingDeg},${r.chartL},${r.chartT},${r.chartR},${r.U},${r.chartL + r.chartT + r.chartR},${a.mode}`,
  )
  return [`# unit=${a.unit} phf=${a.phf} heavy=${a.heavyRatio}`, head, ...rows].join('\n')
}
