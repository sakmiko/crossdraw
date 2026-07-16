/**
 * Clean export drawings — geometry / chart only.
 * NO title blocks, footnotes, honesty slogans, or long captions on the image.
 */
import type {
  AnalysisResult,
  Approach,
  BandCorridor,
  BandResult,
  ChannelizationScheme,
  FlowScheme,
  Mesh,
  SignalScheme,
} from '@/domain/types'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { meshToSvg } from '@/io/exportSvg'
import { roadgeeFlowDiagramSvg } from '@/ui/charts/roadgeeFlowDiagram'
import { roadgeeAnalysisPlanSvg } from '@/ui/charts/roadgeeAnalysisPlan'
import { professionalTimeSpaceSvg } from '@/ui/charts/professionalTimeSpace'
import { signalTimingDiagramSvg, controlMatrixSvg } from '@/ui/charts/professionalDiagrams'
import { corridorNetworkPreviewSvg } from '@/ui/charts/corridorNetworkPreview'

/** Strip captions / long text / honesty footnotes from SVG. Keep short numeric labels. */
export function stripDrawingText(svg: string, opts: { keepShort?: boolean } = {}): string {
  const keepShort = opts.keepShort !== false
  let out = svg
  // remove <title>
  out = out.replace(/<title>[\s\S]*?<\/title>/gi, '')
  // remove text nodes that look like footnotes / titles
  out = out.replace(
    /<text\b[^>]*>[^<]*(同源|示意|非国标|非\s|试用|工程合成|教材|说明|脚注|watermark|RoadGee|与表|与分析|比例尺|出图|报告)[^<]*<\/text>/gi,
    '',
  )
  // remove text with long Chinese captions
  out = out.replace(/<text\b[^>]*>([^<]*)<\/text>/g, (full, content: string) => {
    const t = String(content).trim()
    if (!t) return ''
    // drop pure descriptive titles
    if (/^(流量流向|服务水平|延误|排队|饱和度|相位|配时|多走廊|管控)/.test(t) && t.length <= 12) {
      return ''
    }
    if (!keepShort && t.length > 0) return ''
    if (t.length > 28) return ''
    return full
  })
  return out
}

function extractInner(svg: string): { body: string; w: number; h: number } {
  const vb = svg.match(/viewBox=["']([^"']+)["']/)
  const parts = (vb?.[1] ?? '0 0 800 600').split(/[\s,]+/).map(Number)
  const w = Math.abs(parts[2] || 800)
  const h = Math.abs(parts[3] || 600)
  const body = svg
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
  return { body: stripDrawingText(body), w, h }
}

function wrap(body: string, w: number, h: number, bg: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="${bg}"/>
  ${body}
</svg>`
}

/** Clean channelization — mesh geometry only (labels from mesh removed if long). */
export function cleanChannelPlanSvg(channel: ChannelizationScheme, mesh?: Mesh): string {
  const m = mesh ?? rebuildChannelMesh(channel)
  // drop mesh labels for clean drawing
  const cleanMesh: Mesh = { ...m, labels: [] }
  const raw = meshToSvg(cleanMesh, '')
  const { body, w, h } = extractInner(raw)
  // light paper for drawings
  return wrap(body, w, h, '#e8eef5')
}

export function cleanFlowDiagramSvg(approaches: Approach[], flow: FlowScheme, size = 640): string {
  const raw = roadgeeFlowDiagramSvg(approaches, flow, { size })
  const { body, w, h } = extractInner(raw)
  return wrap(body, w, h, '#fafafa')
}

export function cleanAnalysisPlanSvg(
  approaches: Approach[],
  analysis: AnalysisResult,
  metric: 'los' | 'delay' | 'queue' | 'vc' = 'los',
  size = 640,
): string {
  const raw = roadgeeAnalysisPlanSvg(approaches, analysis, { metric, size })
  const { body, w, h } = extractInner(raw)
  return wrap(body, w, h, '#ffffff')
}

export function cleanTimeSpaceSvg(corridor: BandCorridor, band: BandResult): string {
  const raw = professionalTimeSpaceSvg(corridor, band, { width: 1200, height: 680, theme: 'dark' })
  const { body, w, h } = extractInner(raw)
  return wrap(body, w, h, '#0b1018')
}

export function cleanSignalTimingSvg(signal: SignalScheme): string {
  const phases = signal.phases.map((ph) => ({
    name: ph.name,
    greenSec: ph.greenSec,
    yellowSec: ph.yellowSec,
    allRedSec: ph.allRedSec,
    isOverlap: ph.isOverlap,
  }))
  const raw = signalTimingDiagramSvg(phases, signal.cycleSec, { width: 900, height: 220 })
  const { body, w, h } = extractInner(raw)
  return wrap(body, w, h, '#0b1018')
}

export function cleanControlMatrixSvg(signal: SignalScheme, approaches: Approach[]): string {
  const names = approaches.map((a) => a.name)
  const ids = approaches.map((a) => a.id)
  const phases = signal.phases.map((p) => ({ name: p.name, releases: p.releases }))
  const raw = controlMatrixSvg(names, phases, ids)
  const { body, w, h } = extractInner(raw)
  return wrap(body, w, h, '#0b1018')
}

export function cleanCorridorNetworkSvg(corridor: BandCorridor, band: BandResult): string {
  const raw = corridorNetworkPreviewSvg(corridor, band, { width: 1200, height: 420 })
  const { body, w, h } = extractInner(raw)
  return wrap(body, w, h, '#0b1018')
}

export type CleanExportPack = {
  'channel-clean.svg': string
  'flow-clean.svg': string
  'analysis-los-clean.svg': string
  'timing-clean.svg': string
  'timespace-clean.svg': string
  'network-clean.svg': string
}

export function buildCleanDrawingPack(input: {
  channel: ChannelizationScheme
  approaches: Approach[]
  flow: FlowScheme
  signal: SignalScheme
  analysis: AnalysisResult
  corridor: BandCorridor
  band: BandResult
}): CleanExportPack {
  return {
    'channel-clean.svg': cleanChannelPlanSvg(input.channel),
    'flow-clean.svg': cleanFlowDiagramSvg(input.approaches, input.flow),
    'analysis-los-clean.svg': cleanAnalysisPlanSvg(input.approaches, input.analysis, 'los'),
    'timing-clean.svg': cleanSignalTimingSvg(input.signal),
    'timespace-clean.svg': cleanTimeSpaceSvg(input.corridor, input.band),
    'network-clean.svg': cleanCorridorNetworkSvg(input.corridor, input.band),
  }
}
