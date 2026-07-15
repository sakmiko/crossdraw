/**
 * Side-by-side scheme compare diagrams (比选并排配时/指标).
 * Data-linked: each card = one channel×flow×signal combination.
 */
import type { AnalysisResult, Project, SignalScheme } from '@/domain/types'
import { signalTimingDiagramSvg } from '@/ui/charts/professionalDiagrams'
import { barChartSvg, vcHeatColor } from '@/ui/charts/svgCharts'

export type SchemeSnapshot = {
  channelId: string
  flowId: string
  signalId: string
  channel: string
  flow: string
  signal: string
  cycleSec: number
  avgVc: number
  avgDelay: number
  avgQueueM: number
  los: string
  phases: { name: string; greenSec: number; yellowSec: number; allRedSec: number; isOverlap?: boolean }[]
}

export function collectSchemeSnapshots(
  project: Project,
  analyze: (
    approaches: Project['channelizationSchemes'][0]['approaches'],
    flow: Project['channelizationSchemes'][0]['flowSchemes'][0],
    signal: SignalScheme,
  ) => AnalysisResult,
): SchemeSnapshot[] {
  const out: SchemeSnapshot[] = []
  for (const ch of project.channelizationSchemes) {
    for (const fl of ch.flowSchemes) {
      for (const sg of fl.signalSchemes) {
        const r = analyze(ch.approaches, fl, sg)
        out.push({
          channelId: ch.id,
          flowId: fl.id,
          signalId: sg.id,
          channel: ch.name,
          flow: fl.name,
          signal: sg.name,
          cycleSec: sg.cycleSec,
          avgVc: r.avgVc,
          avgDelay: r.avgDelay,
          avgQueueM: r.avgQueueM,
          los: r.losFinal,
          phases: sg.phases.map((p) => ({
            name: p.name,
            greenSec: p.greenSec,
            yellowSec: p.yellowSec,
            allRedSec: p.allRedSec,
            isOverlap: p.isOverlap,
          })),
        })
      }
    }
  }
  return out
}

/** Horizontal strip of mini timing diagrams (max n). */
export function schemeTimingStripSvg(
  snaps: SchemeSnapshot[],
  opts: { max?: number; cardW?: number; theme?: 'dark' | 'light' } = {},
): string {
  const max = opts.max ?? 4
  const cardW = opts.cardW ?? 280
  const gap = 12
  const list = snaps.slice(0, max)
  if (!list.length) {
    return emptySvg(400, 120, '暂无方案')
  }
  const dark = opts.theme !== 'light'
  const bg = dark ? '#0b1018' : '#f8fafc'
  const panel = dark ? '#111827' : '#ffffff'
  const text = dark ? '#e6edf5' : '#0f172a'
  const muted = dark ? '#94a3b8' : '#64748b'
  const grid = dark ? '#1e293b' : '#e2e8f0'

  let maxH = 0
  const cards = list.map((s) => {
    const timing = signalTimingDiagramSvg(s.phases, s.cycleSec, { width: cardW - 16, height: undefined })
    const hMatch = timing.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)
    const th = hMatch ? Number(hMatch[1]) : 140
    maxH = Math.max(maxH, th)
    return { s, timing: stripShell(timing), th }
  })

  const headerH = 56
  const W = list.length * cardW + (list.length - 1) * gap + 24
  const H = headerH + maxH + 28
  let body = `<rect width="${W}" height="${H}" fill="${bg}"/>`
  body += `<text x="12" y="18" fill="${muted}" font-size="11">方案并排配时图 · 最多 ${max} 个 · 绿/黄/红与相位数据同源</text>`

  cards.forEach((c, i) => {
    const x = 12 + i * (cardW + gap)
    body += `<rect x="${x}" y="28" width="${cardW}" height="${maxH + 20}" rx="8" fill="${panel}" stroke="${grid}"/>`
    body += `<text x="${x + 10}" y="46" fill="${text}" font-size="11" font-weight="700">${escape(c.s.signal)}</text>`
    body += `<text x="${x + 10}" y="60" fill="${muted}" font-size="9">${escape(c.s.channel)} · C=${c.s.cycleSec}s · LOS ${c.s.los}</text>`
    body += `<g transform="translate(${x + 8}, 68)">${c.timing}</g>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`
}

/** Grouped metric bars for delay / vc across schemes. */
export function schemeMetricsCompareSvg(
  snaps: SchemeSnapshot[],
  opts: { width?: number; height?: number; metric?: 'delay' | 'vc' | 'queue' } = {},
): string {
  const metric = opts.metric ?? 'delay'
  const data = snaps.map((s) => {
    const value = metric === 'delay' ? s.avgDelay : metric === 'queue' ? s.avgQueueM : s.avgVc
    const color =
      metric === 'vc'
        ? vcHeatColor(s.avgVc)
        : value >= (metric === 'delay' ? 80 : 100)
          ? '#ef4444'
          : value >= (metric === 'delay' ? 55 : 60)
            ? '#eab308'
            : '#38bdf8'
    const label = s.signal.length > 8 ? s.signal.slice(0, 8) : s.signal
    return { label, value, color }
  })
  const unit = metric === 'delay' ? '延误 s' : metric === 'queue' ? '排队 m' : 'v/c'
  return barChartSvg(data, {
    width: opts.width ?? 520,
    height: opts.height ?? 180,
    unit,
  })
}

/** Compact radar-like summary as multi-series bars for one snapshot (export helper). */
export function schemeScorecardSvg(snap: SchemeSnapshot, opts: { width?: number } = {}): string {
  const width = opts.width ?? 240
  const height = 120
  const bg = '#0b1018'
  const items = [
    { k: 'v/c', v: snap.avgVc, max: 1.2 },
    { k: '延误', v: snap.avgDelay, max: 100 },
    { k: '排队', v: snap.avgQueueM, max: 150 },
  ]
  let body = `<rect width="${width}" height="${height}" fill="${bg}"/>`
  body += `<text x="8" y="14" fill="#94a3b8" font-size="9">${escape(snap.signal)} · LOS ${snap.los}</text>`
  items.forEach((it, i) => {
    const y = 28 + i * 28
    const t = Math.min(1, it.v / it.max)
    body += `<text x="8" y="${y + 12}" fill="#e2e8f0" font-size="10">${it.k}</text>`
    body += `<rect x="48" y="${y}" width="${width - 60}" height="14" rx="3" fill="#1e293b"/>`
    body += `<rect x="48" y="${y}" width="${Math.max(2, (width - 60) * t)}" height="14" rx="3" fill="${vcHeatColor(snap.avgVc)}"/>`
    body += `<text x="${width - 8}" y="${y + 11}" text-anchor="end" fill="#94a3b8" font-size="9">${it.v.toFixed(1)}</text>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>`
}

function stripShell(svg: string): string {
  return svg
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')
    .replace(/<rect[^>]*width="100%"[^>]*\/>/i, '')
}

function emptySvg(w: number, h: number, msg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#0b1018"/><text x="50%" y="50%" text-anchor="middle" fill="#8494ab" font-size="12">${msg}</text></svg>`
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
