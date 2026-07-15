import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasView, meshToPngBlob, DEFAULT_LAYERS, type CanvasHandle, type LayerVisibility, type LayerKey } from '@/canvas/CanvasView'
import { BasemapLayer } from '@/canvas/BasemapLayer'
import { rebuildChannelMesh, THEME } from '@/domain/geometry/rebuild'
import { analyzeIntersection, websterTiming } from '@/domain/analysis'
import { buildCrossSection, markStaleIfNeeded } from '@/domain/xsection/build'
import { validateProject, summarizeIssues } from '@/domain/validate'
import { detectProjectSignalIssues } from '@/domain/signal/conflicts'
import { allPhasesConflictHits } from '@/domain/signal/phaseConflictView'
import { wrapProject, serializeRtp, parseRtp } from '@/domain/rtp'
import { meshToSvg } from '@/io/exportSvg'
import { meshToDxf } from '@/io/exportDxf'
import { analysisToCsv, analysisToExcelHtml, collectCompareRows, compareSchemesCsv } from '@/io/report'
import { exportVissimCsvBundle } from '@/io/vissimCsv'
import { optimizeCorridor, measureCorridor, corridorSegments } from '@/domain/analysis/corridor'
import { downloadBlob, downloadText } from '@/io/download'
import { loadDraft, clearDraft } from '@/io/autosave'
import { persistAutosave, redo, undo, useAppStore } from '@/state/store'
import { CommandPalette } from '@/ui/common/CommandPalette'
import { ExportCenter } from '@/ui/common/ExportCenter'
import { SignalWorkspace } from '@/ui/layout/SignalWorkspace'
import { AnalysisLaneTable } from '@/ui/layout/AnalysisLaneTable'
import { FlowWorkspace } from '@/ui/layout/FlowWorkspace'
import { ChannelWorkspace } from '@/ui/layout/ChannelWorkspace'
import { BandWorkspace } from '@/ui/layout/BandWorkspace'
import { AnalysisWorkspace } from '@/ui/layout/AnalysisWorkspace'
import { PrintPreviewModal } from '@/ui/common/PrintPreview'
import { buildA4PrintSheet, printSheetHtml, type PrintPanel } from '@/io/printSheet'
import { collectCorridorKpis, corridorKpiCompareSvg, multiBandMarkdown } from '@/ui/charts/bandCorridorCompare'
import { conflictHitsMarkdown, conflictMatrixExportSvg, conflictDiagramExportSvg } from '@/ui/charts/conflictExport'
import { checkAnalysisIntegrity } from '@/domain/analysis/integrity'
import { buildFlowAlignment, flowChartsAlignWithTable, type FlowDisplayMode } from '@/domain/flow/flowAlign'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'
import { releaseMatrixAlignsWithPhases } from '@/domain/signal/releaseAlign'
import { AnalysisCharts, BandCharts, CompareCharts, CorridorCompareCharts, CrossSectionCharts, FlowCharts, SchemeCompareBoard, SignalCharts, TimingCompareCharts } from '@/ui/charts/ChartPanels'
import { ControlMatrixPanel, FlowDirectionPanel, PhaseFacePanel, SignalTimingPanel, TimeSpacePanel } from '@/ui/charts/ProfessionalPanels'
import { InteractiveTimeSpace, buildTimeSpaceExportSvg } from '@/ui/charts/InteractiveTimeSpace'
import { optimizeSignalTiming, criticalFlowRatios, TIMING_METHOD_LABELS, type TimingMethod } from '@/domain/analysis/timing'
import { compareTimingMethods, recommendTimingRow, type TimingCompareRow } from '@/domain/analysis/timingCompare'
import { vcHeatColor } from '@/ui/charts/svgCharts'
import { analysisMarkdown, bandMarkdown, exportJsonFile, exportSvgFile } from '@/io/exportCharts'
import { buildAnalysisReportSvg } from '@/io/analysisReportSvg'
import { collectSchemeSnapshots, schemeTimingStripSvg, schemeMetricsCompareSvg } from '@/ui/charts/schemeCompareDiagrams'
import { professionalCrossSectionSvg } from '@/ui/charts/crossSectionDiagram'
import {
  controlMatrixSvg,
  flowMovementDiagramSvg,
  signalTimingDiagramSvg,
  timeSpaceDiagramSvg,
} from '@/ui/charts/professionalDiagrams'
import type { EditorMode, Movement, TurnVolumes } from '@/domain/types'
import '@/ui/styles.css'

const MODES: { id: EditorMode; label: string }[] = [
  { id: 'channel', label: '渠化' },
  { id: 'flow', label: '流量' },
  { id: 'signal', label: '信号' },
  { id: 'xsection', label: '断面' },
  { id: 'analysis', label: '分析' },
  { id: 'compare', label: '比选' },
  { id: 'band', label: '绿波' },
]

export default function App() {
  const project = useAppStore((s) => s.project)
  const mode = useAppStore((s) => s.mode)
  const dirty = useAppStore((s) => s.dirty)
  const selectedApproachId = useAppStore((s) => s.selectedApproachId)
  const setMode = useAppStore((s) => s.setMode)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const selectApproach = useAppStore((s) => s.selectApproach)
  const updateApproach = useAppStore((s) => s.updateApproach)
  const setLaneCount = useAppStore((s) => s.setLaneCount)
  const setVolume = useAppStore((s) => s.setVolume)
  const setFlowParams = useAppStore((s) => s.setFlowParams)
  const setCycle = useAppStore((s) => s.setCycle)
  const updatePhaseGreen = useAppStore((s) => s.updatePhaseGreen)
  const updatePhaseTiming = useAppStore((s) => s.updatePhaseTiming)
  const addPhase = useAppStore((s) => s.addPhase)
  const addOverlapPhase = useAppStore((s) => s.addOverlapPhase)
  const resetTemplate = useAppStore((s) => s.resetTemplate)
  const loadProject = useAppStore((s) => s.loadProject)
  const markClean = useAppStore((s) => s.markClean)
  const setProjectName = useAppStore((s) => s.setProjectName)
  const duplicateChannel = useAppStore((s) => s.duplicateChannel)
  const applyWebster = useAppStore((s) => s.applyWebster)
  const applyOptimizedTiming = useAppStore((s) => s.applyOptimizedTiming)
  const setLaneWidth = useAppStore((s) => s.setLaneWidth)
  const setLaneMovements = useAppStore((s) => s.setLaneMovements)
  const setLaneVariable = useAppStore((s) => s.setLaneVariable)
  const mergeLaneGroup = useAppStore((s) => s.mergeLaneGroup)
  const splitLaneGroupAt = useAppStore((s) => s.splitLaneGroupAt)
  const togglePhaseRelease = useAppStore((s) => s.togglePhaseRelease)
  const togglePhasePedestrian = useAppStore((s) => s.togglePhasePedestrian)
  const updateBand = useAppStore((s) => s.updateBand)
  const updateBandNode = useAppStore((s) => s.updateBandNode)
  const addBandNode = useAppStore((s) => s.addBandNode)
  const removeBandNode = useAppStore((s) => s.removeBandNode)
  const optimizeBand = useAppStore((s) => s.optimizeBand)
  const optimizeAllBands = useAppStore((s) => s.optimizeAllBands)
  const setBandSegmentLength = useAppStore((s) => s.setBandSegmentLength)
  const setActiveBand = useAppStore((s) => s.setActiveBand)
  const addBandCorridor = useAppStore((s) => s.addBandCorridor)
  const duplicateBandCorridor = useAppStore((s) => s.duplicateBandCorridor)
  const removeBandCorridor = useAppStore((s) => s.removeBandCorridor)
  const renameBandCorridor = useAppStore((s) => s.renameBandCorridor)
  const updateBasemap = useAppStore((s) => s.updateBasemap)
  const setActiveChannel = useAppStore((s) => s.setActiveChannel)
  const setActiveFlow = useAppStore((s) => s.setActiveFlow)
  const setActiveSignal = useAppStore((s) => s.setActiveSignal)
  const addFlowScheme = useAppStore((s) => s.addFlowScheme)
  const addSignalScheme = useAppStore((s) => s.addSignalScheme)
  const deleteChannel = useAppStore((s) => s.deleteChannel)
  const loadTemplate = useAppStore((s) => s.loadTemplate)

  const channel = useAppStore((s) => s.getActiveChannel())
  const flow = useAppStore((s) => s.getActiveFlow())
  const signal = useAppStore((s) => s.getActiveSignal())

  const [restoreMsg, setRestoreMsg] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState<'tree' | 'canvas' | 'inspector'>('canvas')
  const [layerVis, setLayerVis] = useState<LayerVisibility>({ ...DEFAULT_LAYERS })
  const canvasRef = useRef<CanvasHandle>(null)
  const toggleLayer = (k: LayerKey) => setLayerVis((prev) => ({ ...prev, [k]: !prev[k] }))
  const [timingMethod, setTimingMethod] = useState<TimingMethod>('webster')
  const [fixedCycleOn, setFixedCycleOn] = useState(false)
  const [fixedCycleSec, setFixedCycleSec] = useState(90)
  const [timingNotes, setTimingNotes] = useState<string[]>([])
  const [timingCompare, setTimingCompare] = useState<TimingCompareRow[]>([])
  const [exportOpen, setExportOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printPaper, setPrintPaper] = useState<'A4' | 'A4-landscape'>('A4')
  const [flowDisplayMode, setFlowDisplayMode] = useState<FlowDisplayMode>('natural')
  const [focusPhaseId, setFocusPhaseId] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const d = loadDraft()
    if (d?.json) {
      setRestoreMsg(new Date(d.ts).toLocaleString())
    }
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => {
      if (useAppStore.getState().dirty) persistAutosave()
    }, 15000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveRtp()
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
      if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault()
        redo()
      }
      if (!e.ctrlKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const map: EditorMode[] = ['channel', 'flow', 'signal', 'xsection', 'analysis', 'compare', 'band']
        setMode(map[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setMode])

  const mesh = useMemo(() => {
    if (!channel)
      return rebuildChannelMesh({
        id: 'x',
        name: '',
        intersectionType: 'cross',
        approaches: [],
        display: { background: THEME.paper, northArrow: true, paperSize: 'A3' },
        flowSchemes: [],
      })
    return rebuildChannelMesh(channel, mode === 'flow' || mode === 'analysis' ? flow : null)
  }, [channel, flow, mode])

  const issues = useMemo(() => {
    return [...validateProject(project), ...detectProjectSignalIssues(project)]
  }, [project])
  const summary = summarizeIssues(issues)

  const analysis = useMemo(() => {
    if (!channel || !flow || !signal) return null
    return analyzeIntersection(channel.approaches, flow, signal)
  }, [channel, flow, signal])

  const analysisIntegrity = useMemo(
    () => (analysis ? checkAnalysisIntegrity(analysis) : null),
    [analysis],
  )
  const selected = channel?.approaches.find((a) => a.id === selectedApproachId) ?? channel?.approaches[0] ?? null

  function saveRtp() {
    const file = wrapProject(project)
    downloadText(`${project.name || 'project'}.rtp`, serializeRtp(file), 'application/json')
    markClean()
    clearDraft()
  }

  async function exportPng() {
    const blob = await meshToPngBlob(mesh, 2)
    downloadBlob(`${project.name}.png`, blob)
  }

  function exportSvg() {
    downloadText(`${project.name}.svg`, meshToSvg(mesh, project.name), 'image/svg+xml')
  }

  function exportDxf() {
    downloadText(`${project.name}.dxf`, meshToDxf(mesh), 'application/dxf')
  }

  function onOpenFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const pf = parseRtp(String(reader.result))
        loadProject(pf.project)
        clearDraft()
        setRestoreMsg(null)
      } catch (e) {
        alert(String(e))
      }
    }
    reader.readAsText(file)
  }

  function restoreDraft() {
    const d = loadDraft()
    if (!d) return
    try {
      loadProject(parseRtp(d.json).project)
      setRestoreMsg(null)
    } catch (e) {
      alert(String(e))
    }
  }

  function runWebster() {
    if (!channel || !flow || !signal) return
    const useFixed = fixedCycleOn || timingMethod === 'fixed-cycle'
    const r = optimizeSignalTiming(channel.approaches, flow, signal, {
      method: useFixed && timingMethod === 'webster' ? 'webster' : useFixed && timingMethod === 'equal' ? 'equal' : useFixed && timingMethod === 'hcm-delay' ? 'hcm-delay' : useFixed ? 'fixed-cycle' : timingMethod,
      targetVc: project.settings.targetVc,
      startLoss: signal.startLossSec,
      fixedCycle: useFixed ? fixedCycleSec : undefined,
    })
    applyOptimizedTiming(r.appliedPhases, r.cycleSec)
    setTimingNotes(r.notes)
  }

  function runTimingCompare() {
    if (!channel || !flow || !signal) return
    const rows = compareTimingMethods(channel.approaches, flow, signal, {
      targetVc: project.settings.targetVc,
      fixedCycle: fixedCycleSec,
      forceFixedCycle: false,
    })
    setTimingCompare(rows)
    const rec = recommendTimingRow(rows)
    if (rec) {
      setTimingNotes([
        `比选完成：推荐「${rec.label}」C=${rec.cycleSec}s · v/c=${rec.avgVc.toFixed(3)} · 延误=${rec.avgDelay.toFixed(1)}s · LOS ${rec.los}`,
        ...rec.notes.slice(0, 2),
      ])
    }
  }

  function applyTimingCompareRow(row: TimingCompareRow) {
    if (!channel || !flow || !signal) return
    setTimingMethod(row.method)
    const useFixed = row.method === 'fixed-cycle'
    if (useFixed) {
      setFixedCycleOn(true)
      setFixedCycleSec(row.cycleSec)
    }
    const r = optimizeSignalTiming(channel.approaches, flow, signal, {
      method: row.method,
      targetVc: project.settings.targetVc,
      startLoss: signal.startLossSec,
      fixedCycle: useFixed || fixedCycleOn ? row.cycleSec : row.method === 'equal' ? row.cycleSec : undefined,
    })
    applyOptimizedTiming(r.appliedPhases, r.cycleSec)
    setTimingNotes([`已应用比选方案：${row.label}`, ...r.notes])
  }



  function collectPrintPanels(): PrintPanel[] {
    const panels: PrintPanel[] = []
    if (signal) {
      panels.push({
        id: 'timing',
        title: '信号配时图',
        svg: signalTimingDiagramSvg(
          signal.phases.map((p) => ({
            name: p.name,
            greenSec: p.greenSec,
            yellowSec: p.yellowSec,
            allRedSec: p.allRedSec,
            isOverlap: p.isOverlap,
          })),
          signal.cycleSec || 90,
        ),
      })
    }
    if (channel && signal) {
      panels.push({
        id: 'control',
        title: '放行管控图',
        svg: controlMatrixSvg(
          channel.approaches.map((x) => x.name),
          signal.phases.map((p) => ({ name: p.name, releases: p.releases })),
          channel.approaches.map((x) => x.id),
        ),
      })
      panels.push({
        id: 'conflict',
        title: '冲突矩阵',
        svg: conflictMatrixExportSvg(
          channel.approaches,
          signal,
          focusPhaseId ?? signal.phases[0]?.id ?? null,
        ),
      })
    }
    if (channel && flow) {
      panels.push({
        id: 'flow',
        title: '流量流向图',
        svg: flowMovementDiagramSvg(
          channel.approaches.map((ap) => {
            const v = flow.volumes[ap.id] ?? { L: 0, T: 0, R: 0, U: 0 }
            return { name: ap.name, bearingDeg: ap.bearingDeg, L: v.L, T: v.T, R: v.R }
          }),
        ),
      })
    }
    // fill remaining slots: analysis board or band
    if (panels.length < 4 && analysis && channel && flow && signal) {
      panels.push({
        id: 'board',
        title: '运行评价拼图',
        svg: buildAnalysisReportSvg({
          projectName: project.name,
          channelName: channel.name,
          signalName: signal.name,
          approaches: channel.approaches,
          flow,
          signal,
          analysis,
          theme: 'light',
        }),
      })
    }
    if (panels.length < 4 && project.bandCorridor.nodes.length >= 2) {
      panels.push({
        id: 'band',
        title: '绿波时距图',
        svg: timeSpaceDiagramSvg(
          project.bandCorridor.nodes.map((n) => ({
            name: n.name,
            distanceM: n.distanceM,
            greenRatio: n.greenRatio,
            offsetSec: n.offsetSec,
            cycleSec: n.cycleSec,
          })),
          project.bandCorridor.speedKmh,
        ),
      })
    }
    return panels.slice(0, 4)
  }

  function openPrintPreview() {
    setPrintOpen(true)
  }

  function exportProfessionalDiagrams() {
    if (!channel || !flow || !signal) return
    const timing = signalTimingDiagramSvg(
      signal.phases.map((p) => ({
        name: p.name,
        greenSec: p.greenSec,
        yellowSec: p.yellowSec,
        allRedSec: p.allRedSec,
        isOverlap: p.isOverlap,
      })),
      signal.cycleSec || 90,
    )
    exportSvgFile(`${project.name}-timing.svg`, timing)
    exportSvgFile(
      `${project.name}-control.svg`,
      controlMatrixSvg(
        channel.approaches.map((x) => x.name),
        signal.phases.map((p) => ({ name: p.name, releases: p.releases })),
        channel.approaches.map((x) => x.id),
      ),
    )
    exportSvgFile(
      `${project.name}-flow-arrows.svg`,
      flowMovementDiagramSvg(
        channel.approaches.map((ap) => {
          const v = flow.volumes[ap.id] ?? { L: 0, T: 0, R: 0, U: 0 }
          return { name: ap.name, bearingDeg: ap.bearingDeg, L: v.L, T: v.T, R: v.R }
        }),
      ),
    )
    exportSvgFile(
      `${project.name}-timespace.svg`,
      timeSpaceDiagramSvg(
        project.bandCorridor.nodes.map((n) => ({
          name: n.name,
          distanceM: n.distanceM,
          greenRatio: n.greenRatio,
          offsetSec: n.offsetSec,
          cycleSec: n.cycleSec,
        })),
        project.bandCorridor.speedKmh,
      ),
    )
    if (channel) {
      exportSvgFile(
        `${project.name}-conflict.svg`,
        conflictMatrixExportSvg(channel.approaches, signal, focusPhaseId ?? signal.phases[0]?.id),
      )
      downloadText(
        `${project.name}-conflict.md`,
        conflictHitsMarkdown(project.name, channel.approaches, signal),
        'text/markdown',
      )
    }
    if (analysis) {
      exportJsonFile(`${project.name}-analysis.json`, analysis)
      downloadText(
        `${project.name}-report.md`,
        analysisMarkdown(project.name, {
          avgVc: analysis.avgVc,
          avgDelay: analysis.avgDelay,
          avgQueueM: analysis.avgQueueM,
          losFinal: analysis.losFinal,
          cycleSec: signal.cycleSec,
          notes: ['依据 docs/research/05-professional-basis.md'],
        }),
        'text/markdown',
      )
    }
  }

  const band = useMemo(() => measureCorridor(project.bandCorridor), [project.bandCorridor])

  const xsection = selected ? buildCrossSection(selected) : null

  return (
    <div className="app" data-pane={mobilePane}>
      <nav className="mobile-nav" aria-label="移动端面板">
        <button type="button" className={mobilePane === 'tree' ? 'active' : ''} onClick={() => setMobilePane('tree')}>方案</button>
        <button type="button" className={mobilePane === 'canvas' ? 'active' : ''} onClick={() => setMobilePane('canvas')}>画布</button>
        <button type="button" className={mobilePane === 'inspector' ? 'active' : ''} onClick={() => setMobilePane('inspector')}>参数</button>
      </nav>
      <header className="topbar">
        <div className="brand">
          <div className="brand-badge" />
          <div>
            Crossdraw
            <small>LOCAL INTERSECTION DESIGN</small>
          </div>
        </div>
        <div className="topbar-divider" />
        <input
          className="project-name"
          value={project.name}
          onChange={(e) => setProjectName(e.target.value)}
          aria-label="项目名称"
        />
        <div className="toolbar">
          <div className="template-menu" role="group" aria-label="路口类型">
            <button type="button" onClick={() => loadTemplate('cross')}>十字</button>
            <button type="button" onClick={() => loadTemplate('t')}>T型</button>
            <button type="button" onClick={() => loadTemplate('y')}>Y型</button>
            <button type="button" onClick={() => loadTemplate('skewed')}>斜交</button>
            <button type="button" onClick={() => loadTemplate('roundabout')}>环形</button>
          </div>
          <label style={{ margin: 0 }}>
            <span className="hint">打开</span>
            <input
              type="file"
              accept=".rtp,application/json"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && onOpenFile(e.target.files[0])}
            />
            <button type="button" onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()}>
              打开 .rtp
            </button>
          </label>
          <button type="button" className="primary" onClick={saveRtp}>保存</button>
          <button type="button" onClick={() => undo()}>撤销</button>
          <button type="button" onClick={() => redo()}>重做</button>
          <div className="toolbar-secondary">
            <button type="button" className="primary" onClick={() => setExportOpen(true)}>
              导出中心
            </button>
            <button type="button" onClick={() => openPrintPreview()}>
              打印拼版
            </button>
            <button type="button" onClick={exportPng}>PNG</button>
            <button type="button" onClick={exportSvg}>SVG</button>
            <button type="button" onClick={exportDxf}>DXF</button>
          </div>
          <button type="button" onClick={() => duplicateChannel()}>复制</button>
          <button type="button" onClick={() => setPaletteOpen(true)}>命令 ⌘K</button>
        </div>
        <div className="topbar-end">
          <button type="button" className="primary" onClick={saveRtp}>保存</button>
          <div className="theme-toggle" role="group" aria-label="主题">
            <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>深色</button>
            <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>浅色</button>
          </div>
          <div className="hint">
            {dirty ? '未保存' : '已保存'}
          </div>
        </div>
      </header>

      <div className="main">
        <aside className="side scheme-tree">
          <div className="side-head">
            <div className="section-title" style={{ margin: 0 }}>方案树</div>
            <span className="side-count">{project.channelizationSchemes.length} 渠化</span>
          </div>
          <div className="tree-actions">
            <button type="button" onClick={() => duplicateChannel()}>+渠化</button>
            <button type="button" onClick={() => addFlowScheme()}>+流量</button>
            <button type="button" onClick={() => addSignalScheme()}>+信号</button>
          </div>
          <div className="tree-scroll">
          {project.channelizationSchemes.map((ch) => (
            <div
              key={ch.id}
              className={`tree-item tree-channel ${ch.id === channel?.id ? 'active' : ''}`}
              onClick={() => setActiveChannel(ch.id)}
            >
              <div className="tree-row">
                <strong className="tree-name">{ch.name}</strong>
                <span className="tree-badge">{ch.intersectionType}</span>
              </div>
              <div className="hint">{ch.approaches.length} 进口 · {ch.flowSchemes.length} 流量方案</div>
              {ch.id === channel?.id && project.channelizationSchemes.length > 1 && (
                <button
                  type="button"
                  className="ghost tree-del"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteChannel(ch.id)
                  }}
                >
                  删除
                </button>
              )}
              {ch.flowSchemes.map((fl) => (
                <div
                  key={fl.id}
                  className={`tree-child tree-flow ${fl.id === flow?.id && ch.id === channel?.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveChannel(ch.id)
                    setActiveFlow(fl.id)
                  }}
                >
                  <span className="tree-dot" />
                  <span className="tree-child-label">
                    流量 · {fl.name}
                    {fl.id === flow?.id && ch.id === channel?.id ? <em>当前</em> : null}
                  </span>
                  {fl.signalSchemes.map((sg) => (
                    <div
                      key={sg.id}
                      className={`tree-child tree-signal ${sg.id === signal?.id && fl.id === flow?.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveChannel(ch.id)
                        setActiveFlow(fl.id)
                        setActiveSignal(sg.id)
                      }}
                    >
                      <span className="tree-dot signal" />
                      <span className="tree-child-label">
                        信号 · {sg.name}
                        <span className="tree-meta">C={sg.cycleSec}s</span>
                        {sg.id === signal?.id && fl.id === flow?.id ? <em>当前</em> : null}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          </div>
          <div className="section-title">进口道</div>
          <div className="tree-scroll tree-scroll-sm">
          {channel?.approaches.map((ap) => (
            <div
              key={ap.id}
              className={`tree-item tree-approach ${selected?.id === ap.id ? 'active' : ''}`}
              onClick={() => selectApproach(ap.id)}
            >
              <div className="tree-row">
                <span className="tree-name">{ap.name}</span>
                <span className="tree-meta">{ap.bearingDeg}°</span>
              </div>
              <div className="hint">{ap.entryLanes.length} 车道</div>
            </div>
          ))}
          </div>
          {restoreMsg && (
            <div className="card">
              <h3>发现自动保存</h3>
              <p className="hint">{restoreMsg}</p>
              <button type="button" className="primary" onClick={restoreDraft}>恢复</button>
              <button type="button" className="ghost" onClick={() => { clearDraft(); setRestoreMsg(null) }}>丢弃</button>
            </div>
          )}
          <div className="card">
            <h3>提示</h3>
            <p className="hint">本地无限保存 · 方案上限 {project.settings.maxSchemes} · Ctrl+K 命令 · 1–6 切换模式</p>
          </div>
        </aside>

        <main className="center">
          <div className="breadcrumb">
            <b>项目</b><span className="sep">/</span>
            <span>{project.name}</span><span className="sep">/</span>
            <span>{channel?.name ?? '—'}</span><span className="sep">/</span>
            <span>{MODES.find((m) => m.id === mode)?.label}</span>
          </div>
          <div className="stage-bar">
            <span className="hint">平移 · 缩放 · 1–7 · Ctrl+K</span>
            <button type="button" className="ghost" onClick={() => canvasRef.current?.fitView()}>适应窗口</button>
            <span className="legend layer-toggles" style={{ margin: 0 }}>
              {([
                ['ROAD', '路面', '#4b5563'],
                ['MARKING', '标线', '#f8fafc'],
                ['ISLAND', '岛', '#4ade80'],
                ['FLOW', '流量', '#38bdf8'],
                ['ANNO', '标注', '#94a3b8'],
                ['FRAME', '图框', '#64748b'],
              ] as [LayerKey, string, string][]).map(([k, lab, col]) => (
                <button
                  key={k}
                  type="button"
                  className={`layer-chip ${layerVis[k] ? 'on' : 'off'}`}
                  onClick={() => toggleLayer(k)}
                  title={`图层 ${lab}`}
                >
                  <span className="legend-swatch" style={{ background: col }} />
                  {lab}
                </button>
              ))}
            </span>
            <span className={`pill ${summary.block ? 'block' : summary.warn ? 'warn' : 'ok'}`}>
              {summary.block ? `BLOCK ${summary.block}` : summary.warn ? `WARN ${summary.warn}` : 'OK'}
            </span>
            {analysis && (
              <span className="pill ok">LOS {analysis.losFinal} · v/c {analysis.avgVc.toFixed(2)} · 延误 {analysis.avgDelay.toFixed(1)}s</span>
            )}
          </div>
          <div className="canvas-shell">
            {project.settings.basemap?.enabled ? (
              <BasemapLayer
                enabled
                latitude={project.settings.basemap.latitude}
                longitude={project.settings.basemap.longitude}
                opacity={project.settings.basemap.opacity ?? 0.55}
              />
            ) : null}
            <CanvasView
              ref={canvasRef}
              mesh={mesh}
              selectedApproachId={selected?.id}
              layers={layerVis}
              height={typeof window !== 'undefined' && window.innerWidth < 720 ? Math.max(320, window.innerHeight - 160) : window.innerHeight - 180}
            />
          </div>
        </main>

        <aside className="right">
          <div className="mode-hierarchy" aria-label="当前编辑层次">
            <span className="mh-step">工程</span>
            <span className="mh-sep">/</span>
            <span className="mh-step">方案</span>
            <span className="mh-sep">/</span>
            <span className="mh-step active">
              {{
                channel: '渠化',
                flow: '流量',
                signal: '信号',
                xsection: '断面',
                analysis: '分析',
                compare: '比选',
                band: '绿波',
              }[mode] ?? mode}
            </span>
            <span className="mh-hint">层次渐进 · 数据向下联动</span>
          </div>
          <div className="mode-rail" role="tablist" aria-label="编辑模式">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                className={mode === m.id ? 'active' : ''}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'channel' && (
            <ChannelWorkspace
              project={project}
              selected={selected}
              updateBasemap={updateBasemap}
              updateApproach={updateApproach}
              setLaneCount={setLaneCount}
              setLaneWidth={setLaneWidth}
              setLaneMovements={setLaneMovements}
              setLaneVariable={setLaneVariable}
              mergeLaneGroup={mergeLaneGroup}
              splitLaneGroupAt={splitLaneGroupAt}
            />
          )}

          {mode === 'flow' && flow && channel && (
            <FlowWorkspace
              channel={channel}
              flow={flow}
              displayMode={flowDisplayMode}
              onDisplayMode={setFlowDisplayMode}
              onFlowParams={setFlowParams}
              onVolume={setVolume}
            />
          )}

          {mode === 'signal' && signal && (
            <SignalWorkspace
              projectName={project.name}
              signal={signal}
              channel={channel}
              flow={flow}
              focusPhaseId={focusPhaseId}
              onFocusPhase={setFocusPhaseId}
              timingMethod={timingMethod}
              onTimingMethod={setTimingMethod}
              fixedCycleOn={fixedCycleOn}
              onFixedCycleOn={setFixedCycleOn}
              fixedCycleSec={fixedCycleSec}
              onFixedCycleSec={setFixedCycleSec}
              timingCompare={timingCompare}
              timingNotes={timingNotes}
              onCycle={setCycle}
              onUpdatePhaseTiming={updatePhaseTiming}
              onToggleRelease={togglePhaseRelease}
              onTogglePedestrian={togglePhasePedestrian}
              onAddPhase={addPhase}
              onAddOverlap={addOverlapPhase}
              onRunOptimize={runWebster}
              onRunCompare={runTimingCompare}
              onApplyCompareRow={applyTimingCompareRow}
            />
          )}

          {mode === 'xsection' && xsection && selected && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>横断面 · {selected.name}</h2>
                <span className="hint">
                  总宽 {xsection.components.reduce((s, c) => s + c.widthM, 0).toFixed(2)} m
                  {markStaleIfNeeded(xsection, selected).stale ? ' · 参数已变需重绘' : ' · 已同步渠化'}
                </span>
              </div>
              <div className="metric-grid band-kpi" style={{ marginTop: 8 }}>
                <div className="metric">
                  <div className="label">总宽 B</div>
                  <div className="value">{xsection.components.reduce((s, c) => s + c.widthM, 0).toFixed(2)}<small> m</small></div>
                </div>
                <div className="metric">
                  <div className="label">进口车道</div>
                  <div className="value">{selected.entryLanes.length}</div>
                </div>
                <div className="metric">
                  <div className="label">出口车道</div>
                  <div className="value">{selected.exitLanes.length}</div>
                </div>
                <div className="metric">
                  <div className="label">中分带</div>
                  <div className="value">{selected.median.widthM.toFixed(1)}<small> m</small></div>
                </div>
              </div>
              <div className="xsection" style={{ marginTop: 8 }}>
                {xsection.components.map((c, i) => (
                  <div key={i} style={{ flex: c.widthM, background: c.color }} title={`${c.label} ${c.widthM}m`}>
                    {c.widthM >= 2 ? `${c.label} ${c.widthM}m` : ''}
                  </div>
                ))}
              </div>
              <CrossSectionCharts section={xsection} approach={selected} />
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    exportSvgFile(
                      `${project.name}-${selected.name}-xsection.svg`,
                      professionalCrossSectionSvg(xsection, selected, { theme }),
                    )
                  }}
                >
                  导出标准断面图
                </button>
              </div>
              <p className="hint">修改渠化车道宽/中分带/人行道后，本图与 KPI 立即联动刷新。</p>
            </div>
          )}

          {mode === 'analysis' && analysis && analysisIntegrity && (
            <AnalysisWorkspace
              project={project}
              analysis={analysis}
              analysisIntegrity={analysisIntegrity}
              channel={channel}
              flow={flow}
              signal={signal}
              theme={theme}
              onOpenCompare={() => setMode('compare')}
              onExportProPack={exportProfessionalDiagrams}
            />
          )}

          
          {mode === 'compare' && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>方案比选</h2>
                <span className="hint">渠化 × 流量 × 信号 组合评价</span>
              </div>
              <p className="hint">
                对方案树中全部渠化/流量/信号组合运行同一评价模型；点击行可激活对应方案。
              </p>
              <CompareCharts
                rows={collectCompareRows(project, analyzeIntersection).map((r) => ({
                  label: `${r.channel}/${r.signal}`,
                  avgVc: r.avgVc,
                  avgDelay: r.avgDelay,
                  los: r.los,
                }))}
              />
              <SchemeCompareBoard project={project} />
              <div className="table-wrap" style={{ marginTop: 10 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>渠化</th>
                      <th>流量</th>
                      <th>信号</th>
                      <th>v/c</th>
                      <th>延误</th>
                      <th>LOS</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectCompareRows(project, analyzeIntersection).map((r, i) => (
                      <tr key={i}>
                        <td>{r.channel}</td>
                        <td>{r.flow}</td>
                        <td>{r.signal}</td>
                        <td>
                          <span className="vc-chip" style={{ background: vcHeatColor(r.avgVc) }}>{r.avgVc.toFixed(2)}</span>
                        </td>
                        <td>{r.avgDelay.toFixed(1)}</td>
                        <td>
                          <span className={`los-badge los-${r.los}`}>{r.los}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => {
                              const ch = project.channelizationSchemes.find((c) => c.name === r.channel)
                              if (!ch) return
                              setActiveChannel(ch.id)
                              const fl = ch.flowSchemes.find((f) => f.name === r.flow)
                              if (fl) {
                                setActiveFlow(fl.id)
                                const sg = fl.signalSchemes.find((s) => s.name === r.signal)
                                if (sg) setActiveSignal(sg.id)
                              }
                              setMode('analysis')
                            }}
                          >
                            打开
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const rows = collectCompareRows(project, analyzeIntersection)
                    downloadText(`${project.name}-compare.csv`, compareSchemesCsv(rows), 'text/csv')
                  }}
                >
                  导出比选 CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rows = collectCompareRows(project, analyzeIntersection)
                    exportJsonFile(`${project.name}-compare.json`, rows)
                  }}
                >
                  导出比选 JSON
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    const snaps = collectSchemeSnapshots(project, analyzeIntersection)
                    exportSvgFile(
                      `${project.name}-compare-timing.svg`,
                      schemeTimingStripSvg(snaps, { max: 4, theme }),
                    )
                    exportSvgFile(
                      `${project.name}-compare-delay.svg`,
                      schemeMetricsCompareSvg(snaps, { metric: 'delay' }),
                    )
                    exportSvgFile(
                      `${project.name}-compare-vc.svg`,
                      schemeMetricsCompareSvg(snaps, { metric: 'vc' }),
                    )
                  }}
                >
                  导出并排配时图
                </button>
              </div>
              <p className="hint">快捷键 6 · 从分析页迁出的独立比选工作区</p>
            </div>
          )}

          {mode === 'band' && (
            <BandWorkspace
              project={project}
              band={band}
              theme={theme}
              updateBand={updateBand}
              updateBandNode={updateBandNode}
              addBandNode={addBandNode}
              removeBandNode={removeBandNode}
              optimizeBand={optimizeBand}
              optimizeAllBands={optimizeAllBands}
              setBandSegmentLength={setBandSegmentLength}
              setActiveBand={setActiveBand}
              addBandCorridor={addBandCorridor}
              duplicateBandCorridor={duplicateBandCorridor}
              removeBandCorridor={removeBandCorridor}
              renameBandCorridor={renameBandCorridor}
            />
          )}


          <div className="card">
            <h3>校验</h3>
            {issues.length === 0 && <p className="hint">无问题</p>}
            {issues.slice(0, 10).map((i) => (
              <div key={i.id} className={`pill ${i.level}`} style={{ display: 'flex', marginBottom: 6 }}>
                {i.level.toUpperCase()} · {i.message}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="status">
        <span>Crossdraw v0.5.42</span>
        <span>Mesh polys {mesh.polygons.length}</span>
        <span>
          bbox {(mesh.bbox.maxX - mesh.bbox.minX) | 0}×{(mesh.bbox.maxY - mesh.bbox.minY) | 0} m
        </span>
        <span style={{ marginLeft: 'auto' }}>sakmiko/crossdraw · GPLv3</span>
      </footer>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <PrintPreviewModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        panels={printOpen ? collectPrintPanels() : []}
        projectName={project.name}
        schemeName={channel?.name ?? '—'}
        paper={printPaper}
        onPaperChange={setPrintPaper}
        onExportSvg={(svg) => exportSvgFile(`${project.name}-print-a4.svg`, svg)}
        onExportHtml={(html) => downloadText(`${project.name}-print-a4.html`, html, 'text/html')}
      />
      <ExportCenter
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        currentMode={mode}
        ctx={{
          hasChannel: !!channel,
          hasFlow: !!flow,
          hasSignal: !!signal,
          hasAnalysis: !!analysis,
          hasSelected: !!selected,
          hasBand: project.bandCorridor.nodes.length >= 2,
          timingClosed: signal ? buildSignalTimingAlignment(signal).closed : undefined,
          flowAligned: flow && channel ? flowChartsAlignWithTable(channel.approaches, flow, flowDisplayMode).ok : undefined,
          analysisOk: analysisIntegrity ? analysisIntegrity.ok : undefined,
        }}
        handlers={{
          'project-rtp': () => saveRtp(),
          'mesh-png': () => exportPng(),
          'mesh-svg': () => exportSvg(),
          'mesh-dxf': () => exportDxf(),
          'xsection-svg': () => {
            if (!xsection || !selected) return
            exportSvgFile(
              `${project.name}-${selected.name}-xsection.svg`,
              professionalCrossSectionSvg(xsection, selected, { theme }),
            )
          },
          'timing-svg': () => {
            if (!signal) return
            exportSvgFile(
              `${project.name}-timing.svg`,
              signalTimingDiagramSvg(
                signal.phases.map((p) => ({
                  name: p.name,
                  greenSec: p.greenSec,
                  yellowSec: p.yellowSec,
                  allRedSec: p.allRedSec,
                  isOverlap: p.isOverlap,
                })),
                signal.cycleSec || 90,
              ),
            )
          },
          'conflict-matrix-svg': () => {
            if (!channel || !signal) return
            exportSvgFile(
              `${project.name}-conflict.svg`,
              conflictMatrixExportSvg(channel.approaches, signal, focusPhaseId ?? signal.phases[0]?.id),
            )
            exportSvgFile(
              `${project.name}-conflict-points.svg`,
              conflictDiagramExportSvg(channel.approaches, signal, focusPhaseId ?? signal.phases[0]?.id),
            )
            downloadText(
              `${project.name}-conflict.md`,
              conflictHitsMarkdown(project.name, channel.approaches, signal),
              'text/markdown',
            )
          },
          'control-svg': () => {
            if (!channel || !signal) return
            exportSvgFile(
              `${project.name}-control.svg`,
              controlMatrixSvg(
                channel.approaches.map((x) => x.name),
                signal.phases.map((p) => ({ name: p.name, releases: p.releases })),
                channel.approaches.map((x) => x.id),
              ),
            )
          },
          'flow-dir-svg': () => {
            if (!channel || !flow) return
            exportSvgFile(
              `${project.name}-flow-arrows.svg`,
              flowMovementDiagramSvg(
                channel.approaches.map((ap) => {
                  const v = flow.volumes[ap.id] ?? { L: 0, T: 0, R: 0, U: 0 }
                  return { name: ap.name, bearingDeg: ap.bearingDeg, L: v.L, T: v.T, R: v.R }
                }),
              ),
            )
          },
          'pro-pack': () => exportProfessionalDiagrams(),
          'print-a4': () => openPrintPreview(),
          'analysis-board': () => {
            if (!channel || !flow || !signal || !analysis) return
            exportSvgFile(
              `${project.name}-analysis-board.svg`,
              buildAnalysisReportSvg({
                projectName: project.name,
                channelName: channel.name,
                signalName: signal.name,
                approaches: channel.approaches,
                flow,
                signal,
                analysis,
                theme,
              }),
            )
            downloadText(
              `${project.name}-report.md`,
              analysisMarkdown(project.name, {
                avgVc: analysis.avgVc,
                avgDelay: analysis.avgDelay,
                avgQueueM: analysis.avgQueueM,
                losFinal: analysis.losFinal,
                cycleSec: signal.cycleSec,
                notes: ['导出中心 · 分析拼图'],
              }),
              'text/markdown',
            )
          },
          'analysis-csv': () => {
            if (!analysis) return
            downloadText(`${project.name}-analysis.csv`, analysisToCsv(analysis), 'text/csv')
          },
          'analysis-xls': () => {
            if (!analysis) return
            downloadText(
              `${project.name}-analysis.xls`,
              analysisToExcelHtml(project.name, analysis),
              'application/vnd.ms-excel',
            )
          },
          'analysis-json': () => {
            if (!analysis) return
            exportJsonFile(`${project.name}-analysis.json`, analysis)
          },
          'vissim-csv': () => {
            if (!channel || !flow || !signal) return
            const b = exportVissimCsvBundle(channel.approaches, flow, signal)
            downloadText(`${project.name}-vissim-links.csv`, b.links, 'text/csv')
            downloadText(`${project.name}-vissim-routes.csv`, b.routes, 'text/csv')
            downloadText(`${project.name}-vissim-volumes.csv`, b.volumes, 'text/csv')
            downloadText(`${project.name}-vissim-signal.csv`, b.signal, 'text/csv')
          },
          'compare-csv': () => {
            const rows = collectCompareRows(project, analyzeIntersection)
            downloadText(`${project.name}-compare.csv`, compareSchemesCsv(rows), 'text/csv')
          },
          'compare-json': () => {
            exportJsonFile(`${project.name}-compare.json`, collectCompareRows(project, analyzeIntersection))
          },
          'compare-timing-svg': () => {
            const snaps = collectSchemeSnapshots(project, analyzeIntersection)
            exportSvgFile(`${project.name}-compare-timing.svg`, schemeTimingStripSvg(snaps, { max: 4, theme }))
            exportSvgFile(`${project.name}-compare-delay.svg`, schemeMetricsCompareSvg(snaps, { metric: 'delay' }))
            exportSvgFile(`${project.name}-compare-vc.svg`, schemeMetricsCompareSvg(snaps, { metric: 'vc' }))
          },
          'band-multi-compare': () => {
            const rows = collectCorridorKpis(project.bandCorridors ?? [project.bandCorridor])
            exportSvgFile(`${project.name}-band-multi.svg`, corridorKpiCompareSvg(rows))
            exportJsonFile(`${project.name}-band-multi.json`, {
              corridors: project.bandCorridors ?? [project.bandCorridor],
              kpis: rows.map(({ result, ...rest }) => rest),
            })
            downloadText(`${project.name}-band-multi.md`, multiBandMarkdown(project.name, rows), 'text/markdown')
          },
          'band-pack': () => {
            exportSvgFile(
              `${project.name}-timespace.svg`,
              buildTimeSpaceExportSvg(project.bandCorridor, band, theme),
            )
            exportJsonFile(`${project.name}-band.json`, { corridor: project.bandCorridor, result: band })
            downloadText(
              `${project.name}-band.md`,
              bandMarkdown(project.name, project.bandCorridor.name, {
                method: String(band.method),
                speedKmh: project.bandCorridor.speedKmh,
                halfCycleDistanceM: band.halfCycleDistanceM,
                bandwidthRatio: band.bandwidthRatio,
                bandwidthSec: band.bandwidthSec,
                forwardSec: band.forwardBandwidthSec ?? band.bandwidthSec,
                backwardSec: band.backwardBandwidthSec ?? 0,
                standardSpeedKmh: band.standardSpeedKmh,
                nodes: project.bandCorridor.nodes,
              }),
              'text/markdown',
            )
          },
        }}
      />
    </div>
  )
}
