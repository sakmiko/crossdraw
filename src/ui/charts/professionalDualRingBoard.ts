/**
 * Dual-ring review board: KPI + barrier table + dual-ring bar diagram.
 * Homology: buildDualRingAlignment / dualRingDiagramSvg. NEMA-style schematic only.
 */
import type { SignalScheme } from '@/domain/types'
import {
  buildDualRingAlignment,
  dualRingSummaryText,
} from '@/domain/signal/dualRing'
import { dualRingDiagramSvg } from './dualRingDiagram'
import { dualRingPhaseNumberSvg } from './phaseNumberDiagram'
import { escapeXml } from './chartStandards'

function stripSvg(svg: string): string {
  return svg.replace(/^<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
}

export function professionalDualRingBoardSvg(
  signal: SignalScheme,
  opts: { width?: number; projectName?: string } = {},
): string {
  const W = opts.width ?? 960
  const align = buildDualRingAlignment(signal)
  const diagram = dualRingDiagramSvg(signal, { width: 880, height: 160 })
  const numbers = dualRingPhaseNumberSvg(signal, 420)

  const tableH = 48 + Math.max(1, align.stages.length) * 22 + 24
  const H = 90 + 170 + 140 + tableH + 40

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="12" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="40" fill="#0f172a" font-size="17" font-weight="700" font-family="system-ui,sans-serif">双环栏审查看板</text>`
  g += `<text x="28" y="58" fill="#64748b" font-size="12">${escapeXml(opts.projectName ?? '')} · ${escapeXml(signal.name)} · ${escapeXml(dualRingSummaryText(align))}</text>`
  g += `<text x="${W - 28}" y="40" text-anchor="end" fill="#94a3b8" font-size="11">NEMA 风格示意 · 非完整控制器</text>`

  const chips: [string, string, string][] = [
    ['启用', align.enabled ? '是' : '否', align.enabled ? '#16a34a' : '#94a3b8'],
    ['C', `${align.cycleSec}s`, '#0369a1'],
    ['阶段Σ', `${align.stageSumSec.toFixed(1)}s`, align.closed ? '#16a34a' : '#dc2626'],
    ['闭合', align.closed ? '✓' : `Δ${align.balanceSec.toFixed(1)}s`, align.closed ? '#16a34a' : '#dc2626'],
    ['R1/R2', `${align.ring1Count}/${align.ring2Count}`, '#7c3aed'],
  ]
  chips.forEach((c, i) => {
    const x = 28 + i * 170
    g += `<rect x="${x}" y="70" width="158" height="32" rx="6" fill="#f8fafc" stroke="${c[2]}"/>`
    g += `<text x="${x + 10}" y="91" fill="#64748b" font-size="10">${c[0]}</text>`
    g += `<text x="${x + 148}" y="91" text-anchor="end" fill="${c[2]}" font-size="13" font-weight="700">${escapeXml(c[1])}</text>`
  })

  g += `<g transform="translate(28, 116)">${stripSvg(diagram)}</g>`
  g += `<g transform="translate(${W - 460}, 290) scale(0.95)">${stripSvg(numbers)}</g>`

  const ty = 290
  g += `<text x="28" y="${ty}" fill="#0f172a" font-size="13" font-weight="700">屏障阶段明细</text>`
  const heads = ['屏障', 'R1 Σs', 'R2 Σs', '阶段 s', 'R1 相位', 'R2 相位']
  const xs = [28, 90, 160, 230, 310, 520]
  heads.forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${ty + 22}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })
  if (!align.stages.length) {
    g += `<text x="28" y="${ty + 48}" fill="#94a3b8" font-size="12">未启用或无 R1/R2 归属相位</text>`
  } else {
    align.stages.forEach((st, i) => {
      const y = ty + 44 + i * 22
      const vals = [
        `B${st.barrierIndex}`,
        st.ring1SumSec.toFixed(1),
        st.ring2SumSec.toFixed(1),
        st.stageSec.toFixed(1),
        st.ring1.map((p) => p.name).join(',') || '—',
        st.ring2.map((p) => p.name).join(',') || '—',
      ]
      vals.forEach((v, j) => {
        g += `<text x="${xs[j]}" y="${y}" fill="#0f172a" font-size="11">${escapeXml(v)}</text>`
      })
    })
  }

  g += `<text x="28" y="${H - 22}" fill="#94a3b8" font-size="10">阶段时间 = max(R1,R2)；Σ阶段 ≈ C 为闭合 · 绿/黄/全红与相位字段同源</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function dualRingBoardMarkdown(projectName: string, signal: SignalScheme): string {
  const a = buildDualRingAlignment(signal)
  return [
    `# ${projectName} · 双环栏简报 · ${signal.name}`,
    '',
    `- ${dualRingSummaryText(a)}`,
    `- C=${a.cycleSec}s · 阶段Σ=${a.stageSumSec.toFixed(2)}s · 闭合=${a.closed ? '是' : '否'} · 差=${a.balanceSec.toFixed(2)}s`,
    '',
    '| 屏障 | R1 Σ | R2 Σ | 阶段 | R1 | R2 |',
    '|-----:|-----:|-----:|-----:|----|----|',
    ...a.stages.map(
      (st) =>
        `| B${st.barrierIndex} | ${st.ring1SumSec.toFixed(1)} | ${st.ring2SumSec.toFixed(1)} | ${st.stageSec.toFixed(1)} | ${st.ring1.map((p) => p.name).join('·') || '—'} | ${st.ring2.map((p) => p.name).join('·') || '—'} |`,
    ),
    '',
    ...a.notes.map((n) => `- ${n}`),
    '',
    '- 诚实边界：NEMA 风格工程示意，非完整 dual-entry 控制器 / 屏障转移引擎',
  ].join('\n')
}

export function dualRingBoardCsv(signal: SignalScheme): string {
  const a = buildDualRingAlignment(signal)
  const head = 'barrier,ring1Sum,ring2Sum,stageSec,ring1Phases,ring2Phases'
  const rows = a.stages.map(
    (st) =>
      `${st.barrierIndex},${st.ring1SumSec},${st.ring2SumSec},${st.stageSec},${JSON.stringify(st.ring1.map((p) => p.name).join('|'))},${JSON.stringify(st.ring2.map((p) => p.name).join('|'))}`,
  )
  return [
    `# enabled=${a.enabled} C=${a.cycleSec} stageSum=${a.stageSumSec} closed=${a.closed}`,
    head,
    ...rows,
  ].join('\n')
}
