/**
 * Mode-specific center stage: only show the diagram that matters for the page.
 * Channel/xsection → mesh canvas; flow/signal/analysis/compare → live SVGs.
 * All figures read domain sources — change params, diagram updates.
 */
import { useMemo, useState, type ReactNode } from 'react'
import type {
  AnalysisResult,
  Approach,
  ChannelizationScheme,
  FlowScheme,
  Project,
  SignalScheme,
  EditorMode,
} from '@/domain/types'
import type { CrossSection } from '@/domain/types'
import { buildFlowAlignment, type FlowDisplayMode } from '@/domain/flow/flowAlign'
import { roadgeeFlowDiagramSvg, type RoadGeeFlowStyle, DEFAULT_ROADGEE_FLOW_STYLE } from '@/ui/charts/roadgeeFlowDiagram'
import { roadgeeSignalBoardSvg } from '@/ui/charts/roadgeeSignalBoard'
import { roadgeeAnalysisPlanSvg, type AnalysisPlanMetric } from '@/ui/charts/roadgeeAnalysisPlan'
import { unsignalizedPlanSvg } from '@/ui/charts/unsignalizedPlan'
import { analyzeUnsignalized } from '@/domain/analysis/unsignalized'
import { professionalCrossSectionSvg } from '@/ui/charts/crossSectionDiagram'
import { schemeMetricsCompareSvg, collectSchemeSnapshots } from '@/ui/charts/schemeCompareDiagrams'
import { analyzeIntersection } from '@/domain/analysis'
import { CanvasView, type CanvasHandle, type LayerVisibility } from '@/canvas/CanvasView'
import type { Mesh } from '@/domain/types'
import type { RefObject } from 'react'

export type ModeCenterProps = {
  mode: EditorMode
  mesh: Mesh
  canvasRef: RefObject<CanvasHandle | null>
  layerVis: LayerVisibility
  selectedApproachId?: string | null
  channel: ChannelizationScheme | null
  flow: FlowScheme | null
  signal: SignalScheme | null
  analysis: AnalysisResult | null
  project: Project
  selected: Approach | null
  xsection: CrossSection | null
  flowDisplayMode: FlowDisplayMode
  flowDiagramStyle?: RoadGeeFlowStyle
  theme: 'dark' | 'light'
  canvasHeight: number
}

function StageChrome({
  title,
  unit,
  children,
  onDownload,
}: {
  title: string
  unit?: string
  children: ReactNode
  onDownload?: () => void
}) {
  return (
    <div className="mode-stage">
      <div className="mode-stage-bar">
        <div className="mode-stage-title">
          <b>{title}</b>
          {unit ? <span className="mode-stage-unit">{unit}</span> : null}
        </div>
        {onDownload ? (
          <button type="button" className="ghost mode-stage-dl" onClick={onDownload}>
            下载图片
          </button>
        ) : null}
      </div>
      <div className="mode-stage-body">{children}</div>
    </div>
  )
}

function downloadSvg(filename: string, svg: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function ModeCenterStage(props: ModeCenterProps) {
  const {
    mode,
    mesh,
    canvasRef,
    layerVis,
    selectedApproachId,
    channel,
    flow,
    signal,
    analysis,
    project,
    selected,
    xsection,
    flowDisplayMode,
    flowDiagramStyle = DEFAULT_ROADGEE_FLOW_STYLE,
    theme,
    canvasHeight,
  } = props

  const [planMetric, setPlanMetric] = useState<AnalysisPlanMetric>('los')

  const flowSvg = useMemo(() => {
    if (!channel || !flow) return ''
    return roadgeeFlowDiagramSvg(channel.approaches, flow, {
      size: Math.min(720, Math.max(420, canvasHeight - 40)),
      mode: flowDisplayMode,
      style: flowDiagramStyle,
    })
  }, [channel, flow, flowDisplayMode, flowDiagramStyle, canvasHeight])

  const signalSvg = useMemo(() => {
    if (!channel || !signal) return ''
    const w =
      typeof window !== 'undefined'
        ? Math.min(1100, Math.max(640, window.innerWidth - (window.innerWidth > 900 ? 200 : 48)))
        : 900
    return roadgeeSignalBoardSvg(channel.approaches, signal, {
      width: w,
      faceSize: Math.min(120, Math.max(88, Math.floor(w / 8))),
    })
  }, [channel, signal, canvasHeight])

  const planSvg = useMemo(() => {
    if (!channel || !analysis) return ''
    return roadgeeAnalysisPlanSvg(channel.approaches, analysis, {
      size: Math.min(640, Math.max(400, canvasHeight - 80)),
      metric: planMetric,
    })
  }, [channel, analysis, planMetric, canvasHeight])

  const xsecSvg = useMemo(() => {
    if (!xsection || !selected) return ''
    return professionalCrossSectionSvg(xsection, selected, { theme })
  }, [xsection, selected, theme])

  const compareSvg = useMemo(() => {
    const snaps = collectSchemeSnapshots(project, analyzeIntersection)
    if (!snaps.length) return ''
    return schemeMetricsCompareSvg(snaps, { width: 640, height: Math.max(280, canvasHeight - 100) })
  }, [project, canvasHeight])

  // —— channel: intersection model ——
  if (mode === 'channel') {
    return (
      <StageChrome title="交叉口平面" unit="渠化几何 · 改参数即改图">
        <div className="canvas-shell mode-canvas">
          <CanvasView
            ref={canvasRef}
            mesh={mesh}
            selectedApproachId={selectedApproachId ?? undefined}
            layers={layerVis}
            height={canvasHeight}
          />
        </div>
      </StageChrome>
    )
  }

  // —— flow: RoadGee flow diagram ——
  if (mode === 'flow') {
    if (!channel || !flow) {
      return <StageChrome title="流量流向"><p className="hint">需要渠化与流量方案</p></StageChrome>
    }
    const align = buildFlowAlignment(channel.approaches, flow, flowDisplayMode)
    return (
      <StageChrome
        title="流量流向图"
        unit={`${align.unit} · 表图同源`}
        onDownload={() => downloadSvg('crossdraw-流量流向图.svg', flowSvg)}
      >
        <div
          className="chart-svg-host chart-svg-host--pro mode-stage-svg"
          dangerouslySetInnerHTML={{ __html: flowSvg }}
        />
      </StageChrome>
    )
  }

  // —— signal: phase faces + timing ——
  if (mode === 'signal') {
    if (!channel || !signal) {
      return <StageChrome title="信号配时"><p className="hint">需要渠化与信号方案</p></StageChrome>
    }
    return (
      <StageChrome
        title="相位灯态 · 配时条"
        unit={`C=${signal.cycleSec}s · 改相位即改图`}
        onDownload={() => downloadSvg('crossdraw-信号相位图.svg', signalSvg)}
      >
        <div
          className="chart-svg-host chart-svg-host--pro mode-stage-svg"
          dangerouslySetInnerHTML={{ __html: signalSvg }}
        />
      </StageChrome>
    )
  }

  // —— analysis: plan metrics ——
  if (mode === 'analysis') {
    if (!channel || !analysis) {
      return <StageChrome title="平面评价"><p className="hint">需要完整渠化·流量·信号</p></StageChrome>
    }
    if (signal?.unsignalized && flow) {
      const u = analyzeUnsignalized(channel.approaches, flow, signal, channel.intersectionType)
      const usvg = unsignalizedPlanSvg(channel.approaches, u, {
        size: Math.min(560, Math.max(400, canvasHeight - 20)),
      })
      return (
        <StageChrome
          title={u.mode === 'roundabout' ? '环形能力平面图' : '无信号评价平面图'}
          unit={`${u.mode} · LOS ${u.los} · 示意`}
          onDownload={() => downloadSvg('crossdraw-无信号平面.svg', usvg)}
        >
          <div
            className="chart-svg-host chart-svg-host--pro mode-stage-svg"
            dangerouslySetInnerHTML={{ __html: usvg }}
          />
        </StageChrome>
      )
    }
    const labels: [AnalysisPlanMetric, string][] = [
      ['los', '服务水平'],
      ['delay', '延误时间'],
      ['queue', '排队长度'],
      ['vc', '饱和度'],
    ]
    const exportPlanCsv = () => {
      const rows = analysis.lanes.map((l) =>
        [l.approachName, l.movement, l.volumePeak.toFixed(0), l.vc.toFixed(3), l.delaySec.toFixed(1), l.queueM.toFixed(1)].join(','),
      )
      const head = 'approach,movement,volume,vc,delay_s,queue_m'
      const blob = new Blob([[head, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `crossdraw-analysis-${planMetric}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    }
    return (
      <StageChrome
        title="平面评价图"
        unit="与分析表同源 · 无水印"
        onDownload={() => downloadSvg(`crossdraw-${planMetric}.svg`, planSvg)}
      >
        <div className="toolbar dense mode-stage-tabs">
          {labels.map(([id, lab]) => (
            <button
              key={id}
              type="button"
              className={planMetric === id ? 'primary' : 'ghost'}
              onClick={() => setPlanMetric(id)}
            >
              {lab}
            </button>
          ))}
          <button type="button" className="ghost" onClick={exportPlanCsv}>
            导出数据
          </button>
        </div>
        <div
          className="chart-svg-host chart-svg-host--pro mode-stage-svg"
          dangerouslySetInnerHTML={{ __html: planSvg }}
        />
      </StageChrome>
    )
  }

  // —— xsection: cross section figure ——
  if (mode === 'xsection') {
    if (!xsection || !selected) {
      return <StageChrome title="标准横断面"><p className="hint">请选择进口道</p></StageChrome>
    }
    return (
      <StageChrome
        title={`横断面 · ${selected.name}`}
        unit="与车道宽同源"
        onDownload={() => downloadSvg(`${selected.name}-xsection.svg`, xsecSvg)}
      >
        <div
          className="chart-svg-host chart-svg-host--pro mode-stage-svg"
          dangerouslySetInnerHTML={{ __html: xsecSvg }}
        />
      </StageChrome>
    )
  }

  // —— compare ——
  if (mode === 'compare') {
    return (
      <StageChrome
        title="方案比选图"
        unit="多方案指标"
        onDownload={compareSvg ? () => downloadSvg('crossdraw-方案比选.svg', compareSvg) : undefined}
      >
        {compareSvg ? (
          <div
            className="chart-svg-host chart-svg-host--pro mode-stage-svg"
            dangerouslySetInnerHTML={{ __html: compareSvg }}
          />
        ) : (
          <p className="hint">增加方案后显示对比图</p>
        )}
      </StageChrome>
    )
  }

  // band handled by BandPage
  return (
    <StageChrome title="交叉口平面">
      <div className="canvas-shell mode-canvas">
        <CanvasView
          ref={canvasRef}
          mesh={mesh}
          selectedApproachId={selectedApproachId ?? undefined}
          layers={layerVis}
          height={canvasHeight}
        />
      </div>
    </StageChrome>
  )
}
