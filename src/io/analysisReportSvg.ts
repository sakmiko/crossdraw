/**
 * Composite analysis report board as a single SVG (拼图报告).
 * Layout: title · KPI strip · flow diagram · v/c bars · lane table excerpt.
 */
import type { AnalysisResult, Approach, FlowScheme, SignalScheme } from '@/domain/types'
import { flowMovementDiagramSvg, phaseFaceDiagramSvg } from '@/ui/charts/professionalDiagrams'
import { barChartSvg, losGaugeSvg, radarChartSvg, vcHeatColor } from '@/ui/charts/svgCharts'

export function buildAnalysisReportSvg(opts: {
  projectName: string
  channelName: string
  signalName: string
  approaches: Approach[]
  flow: FlowScheme
  signal: SignalScheme
  analysis: AnalysisResult
  theme?: 'dark' | 'light'
}): string {
  const dark = opts.theme !== 'light'
  const bg = dark ? '#0b1018' : '#f8fafc'
  const panel = dark ? '#111827' : '#ffffff'
  const grid = dark ? '#1e293b' : '#e2e8f0'
  const text = dark ? '#e6edf5' : '#0f172a'
  const muted = dark ? '#94a3b8' : '#64748b'
  const W = 900
  const H = 1360

  const flowData = opts.approaches.map((a) => {
    const v = opts.flow.volumes[a.id] ?? { L: 0, T: 0, R: 0, U: 0 }
    return { name: a.name.replace('进口', ''), bearingDeg: a.bearingDeg, L: v.L, T: v.T, R: v.R }
  })

  const flowInner = stripSvgShell(recolorSvg(flowMovementDiagramSvg(flowData, { size: 400 }), dark))

  const byAp = new Map<string, { name: string; sum: number; n: number }>()
  for (const l of opts.analysis.lanes) {
    const cur = byAp.get(l.approachId) ?? { name: l.approachName, sum: 0, n: 0 }
    cur.sum += l.vc
    cur.n += 1
    byAp.set(l.approachId, cur)
  }
  const vcData = Array.from(byAp.values()).map((v) => {
    const avg = v.sum / Math.max(1, v.n)
    return { label: v.name.replace('进口', ''), value: avg, color: vcHeatColor(avg) }
  })
  const vcInner = stripSvgShell(recolorSvg(barChartSvg(vcData, { width: 400, height: 200, unit: '进口平均 v/c' }), dark))

  const delayInner = stripSvgShell(
    recolorSvg(
      barChartSvg(
        opts.analysis.lanes.slice(0, 10).map((l) => ({
          label: `${l.approachName.replace('进口', '')}${l.movement}`,
          value: l.delaySec,
          color: l.delaySec >= 80 ? '#ef4444' : l.delaySec >= 55 ? '#eab308' : '#38bdf8',
        })),
        { width: 820, height: 200, unit: '延误 s' },
      ),
      dark,
    ),
  )

  const losMap: Record<string, number> = { A: 0.15, B: 0.3, C: 0.45, D: 0.6, E: 0.8, F: 1 }
  const radarInner = stripSvgShell(
    recolorSvg(
      radarChartSvg(
        [
          { label: 'v/c', value: Math.min(1.2, opts.analysis.avgVc) / 1.2 },
          { label: '延误', value: Math.min(1, opts.analysis.avgDelay / 80) },
          { label: '排队', value: Math.min(1, opts.analysis.avgQueueM / 120) },
          { label: 'LOS', value: losMap[opts.analysis.losFinal] ?? 0.5 },
        ],
        { width: 220, height: 200 },
      ),
      dark,
    ),
  )

  const gaugeInner = stripSvgShell(
    recolorSvg(losGaugeSvg(opts.analysis.losFinal, opts.analysis.avgDelay, { width: 220, height: 120 }), dark),
  )

  const date = new Date().toISOString().slice(0, 10)
  let body = ''
  body += `<rect width="${W}" height="${H}" fill="${bg}"/>`
  body += `<rect x="24" y="20" width="${W - 48}" height="72" rx="10" fill="${panel}" stroke="${grid}"/>`
  body += `<text x="40" y="48" fill="${text}" font-size="20" font-weight="700">交叉口分析报告拼图</text>`
  body += `<text x="40" y="72" fill="${muted}" font-size="12">${escape(opts.projectName)} · ${escape(opts.channelName)} · ${escape(opts.signalName)} · ${date}</text>`
  body += `<text x="${W - 40}" y="48" text-anchor="end" fill="${muted}" font-size="11">Crossdraw</text>`

  const kpis = [
    { k: '平均 v/c', v: opts.analysis.avgVc.toFixed(3), c: vcHeatColor(opts.analysis.avgVc) },
    { k: '车均延误', v: `${opts.analysis.avgDelay.toFixed(1)} s`, c: '#38bdf8' },
    { k: '平均排队', v: `${opts.analysis.avgQueueM.toFixed(1)} m`, c: '#a78bfa' },
    { k: 'LOS', v: opts.analysis.losFinal, c: vcHeatColor(opts.analysis.avgVc) },
    { k: '周期 C', v: `${opts.signal.cycleSec} s`, c: '#94a3b8' },
    { k: '相位数', v: String(opts.signal.phases.filter((p) => !p.isOverlap).length), c: '#94a3b8' },
  ]
  kpis.forEach((item, i) => {
    const x = 24 + i * 142
    body += `<rect x="${x}" y="108" width="134" height="64" rx="8" fill="${panel}" stroke="${grid}"/>`
    body += `<text x="${x + 12}" y="132" fill="${muted}" font-size="11">${item.k}</text>`
    body += `<text x="${x + 12}" y="156" fill="${item.c}" font-size="18" font-weight="700">${item.v}</text>`
  })

  body += `<rect x="24" y="190" width="420" height="440" rx="10" fill="${panel}" stroke="${grid}"/>`
  body += `<text x="40" y="214" fill="${text}" font-size="14" font-weight="600">流量流向图</text>`
  body += `<g transform="translate(34,230)">${flowInner}</g>`

  body += `<rect x="456" y="190" width="420" height="210" rx="10" fill="${panel}" stroke="${grid}"/>`
  body += `<text x="472" y="214" fill="${text}" font-size="14" font-weight="600">综合雷达 · LOS</text>`
  body += `<g transform="translate(470,230) scale(0.85)">${radarInner}</g>`
  body += `<g transform="translate(680,250)">${gaugeInner}</g>`

  body += `<rect x="456" y="416" width="420" height="214" rx="10" fill="${panel}" stroke="${grid}"/>`
  body += `<text x="472" y="440" fill="${text}" font-size="14" font-weight="600">进口饱和度</text>`
  body += `<g transform="translate(468,448)">${vcInner}</g>`

  body += `<rect x="24" y="648" width="852" height="230" rx="10" fill="${panel}" stroke="${grid}"/>`
  body += `<text x="40" y="672" fill="${text}" font-size="14" font-weight="600">转向延误（前 10）</text>`
  body += `<g transform="translate(40,688)">${delayInner}</g>`

  const mainPhases = opts.signal.phases.filter((p) => !p.isOverlap).slice(0, 4)
  let tableTop = 896
  if (mainPhases.length) {
    body += `<rect x="24" y="888" width="852" height="168" rx="10" fill="${panel}" stroke="${grid}"/>`
    body += `<text x="40" y="910" fill="${text}" font-size="14" font-weight="600">相位灯态（与放行矩阵同源）</text>`
    mainPhases.forEach((ph, i) => {
      const face = phaseFaceDiagramSvg(
        opts.approaches.map((a) => ({ name: a.name, bearingDeg: a.bearingDeg, id: a.id })),
        { name: ph.name, releases: ph.releases },
        { size: 150 },
      )
      const inner = stripSvgShell(recolorSvg(face, dark))
      body += `<g transform="translate(${36 + i * 205}, 918)">${inner}</g>`
    })
    tableTop = 1072
  }
  body += `<rect x="24" y="${tableTop}" width="852" height="250" rx="10" fill="${panel}" stroke="${grid}"/>`
  body += `<text x="40" y="${tableTop + 24}" fill="${text}" font-size="14" font-weight="600">车道组评价明细</text>`
  const heads = ['进口', '转向', '流量', 'v/c', '延误s', '排队m']
  heads.forEach((h, i) => {
    body += `<text x="${40 + i * 130}" y="${tableTop + 52}" fill="${muted}" font-size="11" font-weight="600">${h}</text>`
  })
  opts.analysis.lanes.slice(0, 12).forEach((l, row) => {
    const y = tableTop + 76 + row * 14
    const cells = [
      l.approachName.replace('进口', ''),
      l.movement,
      String(Math.round(l.volumePeak)),
      l.vc.toFixed(2),
      l.delaySec.toFixed(1),
      l.queueM.toFixed(1),
    ]
    cells.forEach((c, i) => {
      const fill = i === 3 ? vcHeatColor(l.vc) : text
      body += `<text x="${40 + i * 130}" y="${y}" fill="${fill}" font-size="11">${escape(c)}</text>`
    })
  })

  body += `<text x="40" y="${H - 16}" fill="${muted}" font-size="10">依据：Webster/HCM 风格指标 · docs/research/05-professional-basis.md · Crossdraw 自动拼图</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`
}

function stripSvgShell(svg: string): string {
  return svg
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')
    .replace(/<rect width="100%" height="100%" fill="[^"]*"\/>/i, '')
}

function recolorSvg(svg: string, dark: boolean): string {
  if (dark) return svg
  return svg
    .split('#0a1020')
    .join('#ffffff')
    .split('#0b1018')
    .join('#ffffff')
    .split('#1e293b')
    .join('#e2e8f0')
    .split('#1c2533')
    .join('#e2e8f0')
    .split('#334155')
    .join('#cbd5e1')
    .split('#94a3b8')
    .join('#64748b')
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
