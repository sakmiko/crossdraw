/**
 * Pedestrian Walk/FDW report + hi-res ring board.
 * Homology: pedTiming / pedestrianRingSvg / phase.pedestrian. Not trajectory sim.
 */
import type { Approach, SignalScheme } from '@/domain/types'
import {
  applyPedTimingToSignal,
  recommendPhasePedTiming,
  crosswalkLengthM,
} from '@/domain/signal/pedTiming'
import {
  inferPhaseKind,
  pedCrossingsOf,
  pedWalkFdw,
  phaseHasPed,
} from '@/domain/signal/pedestrian'
import { pedestrianRingSvg } from './pedestrianRing'
import { escapeXml } from './chartStandards'

function stripSvg(svg: string): string {
  return svg.replace(/^<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
}

export function professionalPedestrianBoardSvg(
  approaches: Approach[],
  signal: SignalScheme,
  opts: {
    focusPhaseId?: string | null
    width?: number
    projectName?: string
  } = {},
): string {
  const focusId = opts.focusPhaseId ?? null
  const ring = pedestrianRingSvg(approaches, signal, {
    width: 480,
    height: 360,
    focusPhaseId: focusId,
    title: focusId
      ? `行人 · ${signal.phases.find((p) => p.id === focusId)?.name ?? ''}`
      : '行人过街环图（全相位并集）',
  })

  const pedPhases = signal.phases.filter((p) => phaseHasPed(p) && !p.isOverlap)
  const W = opts.width ?? 960
  const tableRows = Math.max(1, pedPhases.length)
  const tableH = 48 + tableRows * 22 + 80
  const H = 80 + 360 + tableH + 36

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="12" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="40" fill="#0f172a" font-size="17" font-weight="700" font-family="system-ui,sans-serif">行人过街审查看板</text>`
  g += `<text x="28" y="58" fill="#64748b" font-size="12">${escapeXml(opts.projectName ?? '')} · ${escapeXml(signal.name)} · C=${signal.cycleSec}s · 含行人相位 ${pedPhases.length}</text>`
  g += `<text x="${W - 28}" y="40" text-anchor="end" fill="#94a3b8" font-size="11">Walk/FDW 工程示意 · 非轨迹仿真</text>`

  g += `<g transform="translate(24, 72)">${stripSvg(ring)}</g>`

  // side table of recommended timing
  const tx = 520
  g += `<text x="${tx}" y="88" fill="#0f172a" font-size="13" font-weight="700">相位 Walk/FDW 推算</text>`
  g += `<text x="${tx}" y="106" fill="#64748b" font-size="10">v=1.2m/s · 启动 3s · 与横道宽度同源</text>`
  const heads = ['相位', '类型', 'Walk', 'FDW', '需G']
  const xs = [tx, tx + 90, tx + 160, tx + 220, tx + 280]
  heads.forEach((h, i) => {
    g += `<text x="${xs[i]}" y="128" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })
  pedPhases.forEach((ph, i) => {
    const rec = recommendPhasePedTiming(ph, approaches)
    const kind = inferPhaseKind(ph)
    const y = 148 + i * 22
    const need = rec.walkSec + rec.fdwSec
    const short = ph.greenSec < need
    const vals = [
      ph.name,
      kind === 'pedestrian' ? '行人' : kind === 'mixed' ? '混合' : '机',
      String(rec.walkSec),
      String(rec.fdwSec),
      `${need}${short ? '!' : ''}`,
    ]
    vals.forEach((v, j) => {
      g += `<text x="${xs[j]}" y="${y}" fill="${short && j === 4 ? '#dc2626' : '#0f172a'}" font-size="11">${escapeXml(v)}</text>`
    })
  })
  if (!pedPhases.length) {
    g += `<text x="${tx}" y="148" fill="#94a3b8" font-size="12">当前方案无行人过街面</text>`
  }

  // approach lengths
  let ay = 72 + 360 + 16
  g += `<text x="28" y="${ay}" fill="#0f172a" font-size="13" font-weight="700">进口横道长度（停线宽度）</text>`
  ay += 20
  approaches.forEach((ap, i) => {
    const L = crosswalkLengthM(ap)
    const x = 28 + (i % 4) * 220
    const y = ay + Math.floor(i / 4) * 20
    g += `<text x="${x}" y="${y}" fill="#334155" font-size="11">${escapeXml(ap.name.replace('进口', ''))} L=${L.toFixed(1)}m</text>`
  })

  g += `<text x="28" y="${H - 22}" fill="#94a3b8" font-size="10">红框=独占行人 · Walk/FDW 芯片 · 一键可应用推算到相位</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function pedestrianTimingMarkdown(
  projectName: string,
  approaches: Approach[],
  signal: SignalScheme,
): string {
  const lines = [
    `# ${projectName} · 行人 Walk/FDW 简报`,
    '',
    `信号：**${signal.name}** · C=${signal.cycleSec}s`,
    '',
    '| 相位 | 类型 | Walk s | FDW s | 需G | 现状G | 控制面 |',
    '|------|------|-------:|------:|----:|------:|--------|',
  ]
  for (const ph of signal.phases) {
    if (!phaseHasPed(ph) || ph.isOverlap) continue
    const rec = recommendPhasePedTiming(ph, approaches)
    const kind = inferPhaseKind(ph)
    const need = rec.walkSec + rec.fdwSec
    const note = rec.notes[0] ?? ''
    lines.push(
      `| ${ph.name} | ${kind} | ${rec.walkSec} | ${rec.fdwSec} | ${need} | ${ph.greenSec} | ${note} |`,
    )
  }
  lines.push(
    '',
    '## 进口横道',
    '',
    '| 进口 | 长度 m |',
    '|------|-------:|',
    ...approaches.map((a) => `| ${a.name} | ${crosswalkLengthM(a).toFixed(1)} |`),
    '',
    '- 依据：横道长度/步行速度 1.2 m/s 工程近似（非完整 MUTCD/CJJ 控制器）',
  )
  return lines.join('\n')
}

export function pedestrianTimingCsv(approaches: Approach[], signal: SignalScheme): string {
  const head = 'phase,kind,walk,fdw,needG,greenSec,faces'
  const rows: string[] = []
  for (const ph of signal.phases) {
    if (!phaseHasPed(ph) || ph.isOverlap) continue
    const rec = recommendPhasePedTiming(ph, approaches)
    const kind = inferPhaseKind(ph)
    rows.push(
      `${JSON.stringify(ph.name)},${kind},${rec.walkSec},${rec.fdwSec},${rec.walkSec + rec.fdwSec},${ph.greenSec},${rec.faces.length}`,
    )
  }
  return [`# C=${signal.cycleSec}`, head, ...rows].join('\n')
}

export { applyPedTimingToSignal }
