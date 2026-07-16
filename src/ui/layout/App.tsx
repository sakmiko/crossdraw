import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasView, meshToPngBlob, DEFAULT_LAYERS, type CanvasHandle, type LayerVisibility, type LayerKey } from '@/canvas/CanvasView'
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
import { buildVissimInpxPack } from '@/io/vissimInpx'
import { buildMultiPageReportHtml } from '@/io/multiPageReport'
import { pedestrianRingSvg } from '@/ui/charts/pedestrianRing'
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
import { BandPage } from '@/ui/layout/BandPage'
import { LeftNav, NAV_ITEMS } from '@/ui/layout/LeftNav'
import { ModeCenterStage } from '@/ui/layout/ModeCenterStage'
import { SchemeSwitcher } from '@/ui/layout/SchemeSwitcher'
import { Icon, IconLabel, MODE_ICONS } from '@/ui/icons/Icons'
import { AnalysisWorkspace } from '@/ui/layout/AnalysisWorkspace'
import { CompareWorkspace } from '@/ui/layout/CompareWorkspace'
import { XSectionWorkspace } from '@/ui/layout/XSectionWorkspace'
import { PrintPreviewModal } from '@/ui/common/PrintPreview'
import { buildA4PrintSheet, printSheetHtml, type PrintPanel } from '@/io/printSheet'
import { collectCorridorKpis, corridorKpiCompareSvg, multiBandMarkdown } from '@/ui/charts/bandCorridorCompare'
import { conflictHitsMarkdown, conflictMatrixExportSvg, conflictDiagramExportSvg } from '@/ui/charts/conflictExport'
import { professionalConflictBoardSvg, conflictBoardCsv } from '@/ui/charts/professionalConflictBoard'
import { downloadVissimPack, vissimPackSummaryMarkdown } from '@/io/vissimPackDownload' 
import { checkAnalysisIntegrity } from '@/domain/analysis/integrity'
import { buildFlowAlignment, flowChartsAlignWithTable, type FlowDisplayMode } from '@/domain/flow/flowAlign'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'
import { releaseMatrixAlignsWithPhases } from '@/domain/signal/releaseAlign'
import { AnalysisCharts, BandCharts, CompareCharts, CorridorCompareCharts, CrossSectionCharts, FlowCharts, SchemeCompareBoard, SignalCharts, TimingCompareCharts } from '@/ui/charts/ChartPanels'
import { ControlMatrixPanel, FlowDirectionPanel, PhaseFacePanel, SignalTimingPanel, TimeSpacePanel } from '@/ui/charts/ProfessionalPanels'
import { InteractiveTimeSpace, buildTimeSpaceExportSvg } from '@/ui/charts/InteractiveTimeSpace'
import {
  professionalTimeSpaceSvg,
  timeSpaceReportMarkdown,
  timeSpaceReportCsv,
} from '@/ui/charts/professionalTimeSpace' 
import { optimizeSignalTiming, criticalFlowRatios, TIMING_METHOD_LABELS, type TimingMethod } from '@/domain/analysis/timing'
import {
  runAutoTimingPack,
  generateProtectedPhases,
  clearPhaseGreens,
  computeSchemeY,
  autoTimingMarkdown,
  type AutoTimingDesign,
} from '@/domain/signal/autoTimingPack'
import { compareTimingMethods, recommendTimingRow, type TimingCompareRow } from '@/domain/analysis/timingCompare'
import { vcHeatColor } from '@/ui/charts/svgCharts'
import { analysisMarkdown, bandMarkdown, exportJsonFile, exportSvgFile } from '@/io/exportCharts'
import { buildAnalysisReportSvg } from '@/io/analysisReportSvg'
import { collectSchemeSnapshots, schemeTimingStripSvg, schemeMetricsCompareSvg } from '@/ui/charts/schemeCompareDiagrams'
import { professionalCrossSectionSvg } from '@/ui/charts/crossSectionDiagram'
import { buildSectionReport, componentsForDiagram, sectionReportCsv, sectionReportMarkdown } from '@/domain/xsection/report'
import {
  controlMatrixSvg,
  flowMovementDiagramSvg,
  signalTimingDiagramSvg,
  timeSpaceDiagramSvg,
} from '@/ui/charts/professionalDiagrams'
import { roadgeeFlowDiagramSvg, DEFAULT_ROADGEE_FLOW_STYLE } from '@/ui/charts/roadgeeFlowDiagram'
import {
  professionalFlowReportSvg,
  flowOdReportMarkdown,
  flowOdReportCsv,
} from '@/ui/charts/professionalFlowReport' 
import { roadgeeAnalysisPlanSvg } from '@/ui/charts/roadgeeAnalysisPlan'
import {
  professionalAnalysisPlanPackSvg,
  analysisPlanPackMarkdown,
  analysisPlanPackCsv,
} from '@/ui/charts/professionalAnalysisPlanPack' 
import { unsignalizedPlanSvg, unsignalizedLegsCsv } from '@/ui/charts/unsignalizedPlan'
import { schemeScorecardSvg, kpisFromCompareRows } from '@/ui/charts/schemeScorecard'
import { schemeDeltas, schemeDeltaMarkdown } from '@/domain/analysis/schemeDiff'
import { analyzeUnsignalized, unsignalizedMarkdown } from '@/domain/analysis/unsignalized'
import { signalControlBoardSvg } from '@/ui/charts/signalControlBoard'
import { computeSaturationKpi, previewOptimize, saturationKpiMarkdown, optimizeDeltaMarkdown } from '@/domain/signal/saturationKpi'
import { corridorNetworkPreviewSvg } from '@/ui/charts/corridorNetworkPreview'
import { maxbandReportDiagramSvg } from '@/ui/charts/maxbandReportDiagram'
import { buildMaxbandReport, maxbandReportMarkdown, maxbandReportCsv } from '@/domain/analysis/maxbandReport'
import { roadgeeSignalBoardSvg } from '@/ui/charts/roadgeeSignalBoard'
import type { EditorMode, Movement, TurnVolumes } from '@/domain/types'
import '@/ui/styles.css'

const MODES = NAV_ITEMS.map((m) => ({ id: m.id, label: m.label }))

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
  const setExitLaneCount = useAppStore((s) => s.setExitLaneCount)
  const setVolume = useAppStore((s) => s.setVolume)
  const setMultimodalVolume = useAppStore((s) => s.setMultimodalVolume)
  const setFlowParams = useAppStore((s) => s.setFlowParams)
  const setLaneSatFlow = useAppStore((s) => s.setLaneSatFlow)
  const setCycle = useAppStore((s) => s.setCycle)
  const updatePhaseGreen = useAppStore((s) => s.updatePhaseGreen)
  const updatePhaseTiming = useAppStore((s) => s.updatePhaseTiming)
  const addPhase = useAppStore((s) => s.addPhase)
  const addOverlapPhase = useAppStore((s) => s.addOverlapPhase)
  const addPedestrianPhase = useAppStore((s) => s.addPedestrianPhase)
  const setDualRingEnabled = useAppStore((s) => s.setDualRingEnabled)
  const autoAssignDualRings = useAppStore((s) => s.autoAssignDualRings)
  const setPhaseRing = useAppStore((s) => s.setPhaseRing)
  const setPhaseBarrier = useAppStore((s) => s.setPhaseBarrier)
  const balanceDualRingBarriers = useAppStore((s) => s.balanceDualRingBarriers)
  const closeDualRingCycle = useAppStore((s) => s.closeDualRingCycle)
  const resetTemplate = useAppStore((s) => s.resetTemplate)
  const loadProject = useAppStore((s) => s.loadProject)
  const markClean = useAppStore((s) => s.markClean)
  const setProjectName = useAppStore((s) => s.setProjectName)
  const duplicateChannel = useAppStore((s) => s.duplicateChannel)
  const applyWebster = useAppStore((s) => s.applyWebster)
  const applyOptimizedTiming = useAppStore((s) => s.applyOptimizedTiming)
  const replaceSignalScheme = useAppStore((s) => s.replaceSignalScheme)
  const setSignalMeta = useAppStore((s) => s.setSignalMeta)
  const setLaneWidth = useAppStore((s) => s.setLaneWidth)
  const setLaneMovements = useAppStore((s) => s.setLaneMovements)
  const setLaneVariable = useAppStore((s) => s.setLaneVariable)
  const mergeLaneGroup = useAppStore((s) => s.mergeLaneGroup)
  const splitLaneGroupAt = useAppStore((s) => s.splitLaneGroupAt)
  const togglePhaseRelease = useAppStore((s) => s.togglePhaseRelease)
  const togglePhasePedestrian = useAppStore((s) => s.togglePhasePedestrian)
  const setPhasePedExclusive = useAppStore((s) => s.setPhasePedExclusive)
  const updateBand = useAppStore((s) => s.updateBand)
  const updateBandNode = useAppStore((s) => s.updateBandNode)
  const addBandNode = useAppStore((s) => s.addBandNode)
  const removeBandNode = useAppStore((s) => s.removeBandNode)
  const optimizeBand = useAppStore((s) => s.optimizeBand)
  const applyProgressiveOffsets = useAppStore((s) => s.applyProgressiveOffsets)
  const applyPedTiming = useAppStore((s) => s.applyPedTiming)
  const allocateBarrierGreens = useAppStore((s) => s.allocateBarrierGreens)
  const optimizeAllBands = useAppStore((s) => s.optimizeAllBands)
  const setBandSegmentLength = useAppStore((s) => s.setBandSegmentLength)
  const setActiveBand = useAppStore((s) => s.setActiveBand)
  const addBandCorridor = useAppStore((s) => s.addBandCorridor)
  const duplicateBandCorridor = useAppStore((s) => s.duplicateBandCorridor)
  const removeBandCorridor = useAppStore((s) => s.removeBandCorridor)
  const renameBandCorridor = useAppStore((s) => s.renameBandCorridor)
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

    const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState<'tree' | 'canvas' | 'inspector'>('canvas')
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try {
      return localStorage.getItem('crossdraw-nav-collapsed') === '1'
    } catch {
      return false
    }
  })
  const toggleNavCollapsed = () => {
    setNavCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem('crossdraw-nav-collapsed', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }
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
  const [designTargetVc, setDesignTargetVc] = useState(0.9)
  const [designStartLoss, setDesignStartLoss] = useState(3)
  const [designPhf, setDesignPhf] = useState(0.95)
  const [designCycleSec, setDesignCycleSec] = useState(90)
  const [designLockCycle, setDesignLockCycle] = useState(false)
  const [yReportText, setYReportText] = useState('')
  const [flowDiagramStyle, setFlowDiagramStyle] = useState(() => ({ ...DEFAULT_ROADGEE_FLOW_STYLE }))
  const [focusPhaseId, setFocusPhaseId] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Silent autosave: restore draft on boot without prompt; persist on every dirty change (debounced).
  useEffect(() => {
    const d = loadDraft()
    if (d?.json) {
      try {
        const file = parseRtp(d.json)
        loadProject(file.project)
        markClean()
      } catch {
        /* ignore corrupt draft */
      }
    }
  }, [loadProject, markClean])

  useEffect(() => {
    if (!dirty) return
    const t = window.setTimeout(() => {
      persistAutosave()
      // keep dirty=true until explicit file export; draft is always current
    }, 400)
    return () => clearTimeout(t)
  }, [dirty, project])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        persistAutosave()
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
        persistAutosave()
      } catch (e) {
        alert(String(e))
      }
    }
    reader.readAsText(file)
  }

  
  function runWebster() {
    if (!channel || !flow || !signal) return
    const useFixed = fixedCycleOn || timingMethod === 'fixed-cycle'
    const r = optimizeSignalTiming(channel.approaches, flow, signal, {
      method: useFixed && timingMethod === 'webster' ? 'webster' : useFixed && timingMethod === 'equal' ? 'equal' : useFixed && timingMethod === 'hcm-delay' ? 'hcm-delay' : useFixed ? 'fixed-cycle' : timingMethod,
      targetVc: designTargetVc,
      startLoss: designStartLoss,
      fixedCycle: designLockCycle ? designCycleSec : useFixed ? fixedCycleSec : undefined,
    })
    applyOptimizedTiming(r.appliedPhases, r.cycleSec)
    setTimingNotes(r.notes)
  }

  function buildDesign(): AutoTimingDesign {
    return {
      targetVc: designTargetVc,
      startLossSec: designStartLoss,
      designPhf,
      designCycleSec,
      lockCycle: designLockCycle,
      method: timingMethod,
    }
  }

  function onComputeY() {
    if (!channel || !flow || !signal) return
    const y = computeSchemeY(channel.approaches, flow, signal)
    const lines = [
      `Y = ${y.Y.toFixed(3)}${y.dualRing ? '（双环）' : ''}`,
      ...y.phaseRows.map((r) => `  ${r.phase}: y=${r.y.toFixed(3)} V=${Math.round(r.volume)} (${(r.share * 100).toFixed(1)}%)`),
      ...y.notes,
    ]
    setYReportText(lines.join('\n'))
    setTimingNotes(y.notes)
  }

  function onGenerateScheme() {
    if (!channel || !signal) return
    const gen = generateProtectedPhases(channel.approaches, signal)
    replaceSignalScheme(gen)
    setTimingNotes(['已生成保护相位方案（每进口一相位）· 工程示意', `C=${gen.cycleSec}s · 相位 ${gen.phases.length}`])
    setYReportText('')
  }

  function onClearScheme() {
    if (!signal) return
    const cleared = clearPhaseGreens(signal, 8)
    replaceSignalScheme(cleared)
    setTimingNotes(['已清空绿灯至最小绿（保留相位结构/放行）', `C=${cleared.cycleSec}s`])
  }

  function onExportAutoTimingReport() {
    if (!channel || !flow || !signal) return
    const r = runAutoTimingPack(channel.approaches, flow, signal, buildDesign())
    downloadText(`${project.name}-自动配时.md`, autoTimingMarkdown(project.name, r), 'text/markdown')
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
      targetVc: designTargetVc,
      startLoss: designStartLoss,
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

  // RoadGee-style: green-wave is a dedicated full page (multi-intersection)
  if (mode === 'band') {
    return (
      <div className={`app app--band ${navCollapsed ? 'nav-collapsed' : 'nav-expanded'}`} data-pane={mobilePane}>
        <div className="band-with-nav">
        <LeftNav
          mode={mode}
          collapsed={navCollapsed}
          onToggleCollapsed={toggleNavCollapsed}
          onSelect={(m) => setMode(m)}
        />
        <div className="band-with-nav-main">
        <BandPage
          project={project}
          band={band}
          theme={theme}
          onBackToIntersection={() => setMode('channel')}
          updateBand={updateBand}
          updateBandNode={updateBandNode}
          addBandNode={addBandNode}
          removeBandNode={removeBandNode}
          optimizeBand={optimizeBand}
          optimizeAllBands={optimizeAllBands}
          onProgressiveOffsets={applyProgressiveOffsets}
          setBandSegmentLength={setBandSegmentLength}
          setActiveBand={setActiveBand}
          addBandCorridor={addBandCorridor}
          duplicateBandCorridor={duplicateBandCorridor}
          removeBandCorridor={removeBandCorridor}
          renameBandCorridor={renameBandCorridor}
        />
        </div>
        </div>
        <footer className="status">
          <span>Crossdraw v0.5.93 · 绿波专页</span>
          <span>{project.bandCorridor.name}</span>
          <span>带宽比 {(band.bandwidthRatio * 100).toFixed(1)}%</span>
          <span style={{ marginLeft: 'auto' }}>← 交叉口设计 返回单点编辑</span>
        </footer>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    )
  }

  return (
    <div className={`app shell shell--${mode} ${navCollapsed ? 'nav-collapsed' : 'nav-expanded'}`} data-pane={mobilePane}>
      <nav className="mobile-nav" aria-label="移动端面板">
        <button type="button" className={mobilePane === 'tree' ? 'active' : ''} onClick={() => setMobilePane('inspector')}><Icon name="params" size={14} /><span>参数</span></button>
        <button type="button" className={mobilePane === 'canvas' ? 'active' : ''} onClick={() => setMobilePane('canvas')}><Icon name="canvas" size={14} /><span>图示</span></button>
        <button type="button" className={mobilePane === 'inspector' ? 'active' : ''} onClick={() => setMobilePane('inspector')}><Icon name="params" size={14} /><span>详情</span></button>
      </nav>
      <header className="topbar">
        <div className="brand">
          <div className="brand-badge" aria-hidden />
          <div className="brand-text">
            <span className="brand-name">Crossdraw</span>
            <span className="brand-ver">v0.5.93</span>
          </div>
        </div>
        <div className="topbar-divider" />
        <input
          className="project-name"
          value={project.name}
          onChange={(e) => setProjectName(e.target.value)}
          aria-label="项目名称"
        />
        <div className="topbar-main">
          <div className="menu-group">
            <details className="menu-dropdown">
              <summary><Icon name="plus" size={15} /><span>新建</span></summary>
              <div className="menu-panel" role="menu">
                <button type="button" role="menuitem" onClick={() => loadTemplate('cross')}><Icon name="templateCross" size={15} /><span>十字交叉口</span></button>
                <button type="button" role="menuitem" onClick={() => loadTemplate('t')}><Icon name="templateT" size={15} /><span>T 型</span></button>
                <button type="button" role="menuitem" onClick={() => loadTemplate('y')}><Icon name="templateY" size={15} /><span>Y 型</span></button>
                <button type="button" role="menuitem" onClick={() => loadTemplate('skewed')}><Icon name="templateSkew" size={15} /><span>斜交</span></button>
                <button type="button" role="menuitem" onClick={() => loadTemplate('five' as any)}><Icon name="templateCross" size={15} /><span>五路</span></button>
                <button type="button" role="menuitem" onClick={() => loadTemplate('roundabout')}><Icon name="templateRa" size={15} /><span>环形</span></button>
              </div>
            </details>
            <details className="menu-dropdown">
              <summary><Icon name="folder" size={15} /><span>文件</span></summary>
              <div className="menu-panel" role="menu">
                <label className="menu-file">
                  <Icon name="file" size={15} /><span>打开 .rtp</span>
                  <input
                    type="file"
                    accept=".rtp,application/json"
                    hidden
                    onChange={(e) => e.target.files?.[0] && onOpenFile(e.target.files[0])}
                  />
                </label>
                <button type="button" role="menuitem" onClick={saveRtp}><Icon name="save" size={15} /><span>导出工程文件</span></button>
                <button type="button" role="menuitem" onClick={() => duplicateChannel()}><Icon name="copy" size={15} /><span>复制渠化方案</span></button>
              </div>
            </details>
            <details className="menu-dropdown">
              <summary><Icon name="export" size={15} /><span>导出</span></summary>
              <div className="menu-panel" role="menu">
                <button type="button" role="menuitem" className="primary" onClick={() => setExportOpen(true)}><Icon name="export" size={15} /><span>导出中心…</span></button>
                <button type="button" role="menuitem" onClick={() => openPrintPreview()}><Icon name="print" size={15} /><span>打印拼版</span></button>
                <hr className="menu-sep" />
                <button type="button" role="menuitem" onClick={exportPng}>画布 PNG</button>
                <button type="button" role="menuitem" onClick={exportSvg}>画布 SVG</button>
                <button type="button" role="menuitem" onClick={exportDxf}>画布 DXF</button>
              </div>
            </details>
          </div>
          <SchemeSwitcher
            project={project}
            channel={channel}
            flow={flow}
            signal={signal}
            onChannel={setActiveChannel}
            onFlow={setActiveFlow}
            onSignal={setActiveSignal}
            onAddChannel={() => duplicateChannel()}
            onAddFlow={() => addFlowScheme()}
            onAddSignal={() => addSignalScheme()}
          />
          <div className="topbar-actions">
            <button type="button" className="ghost" onClick={() => undo()} title="撤销"><Icon name="undo" size={16} /><span>撤销</span></button>
            <button type="button" className="ghost" onClick={() => redo()} title="重做"><Icon name="redo" size={16} /><span>重做</span></button>
            <button type="button" className="ghost" onClick={() => setPaletteOpen(true)} title="命令面板"><Icon name="command" size={16} /><span>⌘K</span></button>
          </div>
        </div>
        <div className="topbar-end">
          <div className="theme-toggle" role="group" aria-label="主题">
            <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} title="深色"><Icon name="moon" size={15} /></button>
            <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} title="浅色"><Icon name="sun" size={15} /></button>
          </div>
        </div>
      </header>

      <div className="main">
        <LeftNav
          mode={mode}
          collapsed={navCollapsed}
          onToggleCollapsed={toggleNavCollapsed}
          onSelect={(m) => setMode(m)}
        />
        <main className="center center--mode page-fill">
          <div className="page-fill-head">
            <div className="breadcrumb">
              <b>项目</b><span className="sep">/</span>
              <span>{project.name}</span><span className="sep">/</span>
              <span>{channel?.name ?? '—'}</span><span className="sep">/</span>
              <span>{MODES.find((m) => m.id === mode)?.label}</span>
            </div>
            {(mode === 'channel' || mode === 'xsection') && channel && (
              <div className="approach-strip" role="tablist" aria-label="进口道">
                {channel.approaches.map((ap) => (
                  <button
                    key={ap.id}
                    type="button"
                    role="tab"
                    aria-selected={selected?.id === ap.id}
                    className={`approach-chip ${selected?.id === ap.id ? 'active' : ''}`}
                    onClick={() => selectApproach(ap.id)}
                  >
                    {ap.name.replace('进口', '') || ap.name}
                    <small>{ap.entryLanes.length}车道</small>
                  </button>
                ))}
                {mode === 'channel' && (
                  <>
                    <button type="button" className="ghost approach-chip-tool" onClick={() => canvasRef.current?.fitView()}>
                      <Icon name="fit" size={14} /><span>适应</span>
                    </button>
                    {(['ROAD', 'MARKING', 'ISLAND', 'FLOW'] as LayerKey[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={`layer-chip ${layerVis[k] ? 'on' : 'off'}`}
                        onClick={() => toggleLayer(k)}
                      >
                        {k === 'ROAD' ? '路面' : k === 'MARKING' ? '标线' : k === 'ISLAND' ? '岛' : '流量'}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className={`page-fill-body page-fill-body--${mode}`}>
            <div className="page-fill-stage">
              <ModeCenterStage
                mode={mode}
                mesh={mesh}
                canvasRef={canvasRef}
                layerVis={layerVis}
                selectedApproachId={selected?.id}
                channel={channel}
                flow={flow}
                signal={signal}
                analysis={analysis}
                project={project}
                selected={selected}
                xsection={xsection}
                flowDisplayMode={flowDisplayMode}
                flowDiagramStyle={flowDiagramStyle}
                theme={theme}
                canvasHeight={
                  typeof window !== 'undefined'
                    ? Math.max(
                        240,
                        Math.floor(
                          window.innerHeight *
                            (mode === 'signal' ? 0.42 : mode === 'channel' ? 0.55 : mode === 'flow' ? 0.4 : 0.4),
                        ),
                      )
                    : 400
                }
              />
            </div>
            <div className="page-fill-params">
              {mode === 'channel' && (
                <ChannelWorkspace
                  project={project}
                  selected={selected}
                  updateApproach={updateApproach}
                  setLaneCount={setLaneCount}
                  setExitLaneCount={setExitLaneCount}
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
                  onMultimodal={setMultimodalVolume}
                  onLaneSatFlow={setLaneSatFlow}
                  diagramStyle={flowDiagramStyle}
                  onDiagramStyle={(p) => setFlowDiagramStyle((s) => ({ ...s, ...p }))}
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
                  onSetPedExclusive={setPhasePedExclusive}
                  onAddPhase={addPhase}
                  onAddOverlap={addOverlapPhase}
                  onAddPedPhase={addPedestrianPhase}
                  onSetDualRing={setDualRingEnabled}
                  onAutoAssignDualRings={autoAssignDualRings}
                  onSetPhaseRing={setPhaseRing}
                  onSetPhaseBarrier={setPhaseBarrier}
                  onBalanceDualRing={balanceDualRingBarriers}
                  onCloseDualRingCycle={closeDualRingCycle}
                  onApplyPedTiming={applyPedTiming}
                  onAllocateBarrierGreens={allocateBarrierGreens}
                  onRunOptimize={runWebster}
                  onRunCompare={runTimingCompare}
                  onApplyCompareRow={applyTimingCompareRow}
                  designTargetVc={designTargetVc}
                  onDesignTargetVc={setDesignTargetVc}
                  designStartLoss={designStartLoss}
                  onDesignStartLoss={(v) => {
                    setDesignStartLoss(v)
                    setSignalMeta({ startLossSec: v })
                  }}
                  designPhf={designPhf}
                  onDesignPhf={setDesignPhf}
                  designCycleSec={designCycleSec}
                  onDesignCycleSec={setDesignCycleSec}
                  designLockCycle={designLockCycle}
                  onDesignLockCycle={setDesignLockCycle}
                  onComputeY={onComputeY}
                  onGenerateScheme={onGenerateScheme}
                  onClearScheme={onClearScheme}
                  onExportAutoTimingReport={onExportAutoTimingReport}
                  yReportText={yReportText}
                  onToggleUnsignalized={(v) => setSignalMeta({ unsignalized: v })}
                />
              )}
              {mode === 'xsection' && xsection && selected && (
                <XSectionWorkspace
                  projectName={project.name}
                  selected={selected}
                  xsection={xsection}
                  theme={theme}
                  onUpdateApproach={updateApproach}
                />
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
                  onToggleUnsignalized={(v) => setSignalMeta({ unsignalized: v })}
                />
              )}
              {mode === 'compare' && (
                <CompareWorkspace
                  project={project}
                  theme={theme}
                  onActivateScheme={(channelName, flowName, signalName) => {
                    const ch = project.channelizationSchemes.find((c) => c.name === channelName)
                    if (!ch) return
                    setActiveChannel(ch.id)
                    const fl = ch.flowSchemes.find((f) => f.name === flowName)
                    if (fl) {
                      setActiveFlow(fl.id)
                      const sg = fl.signalSchemes.find((s) => s.name === signalName)
                      if (sg) setActiveSignal(sg.id)
                    }
                    setMode('analysis')
                  }}
                />
              )}
            </div>
          </div>
        </main>

      </div>

      <footer className="status">
        <span>Crossdraw v0.5.93</span>
        <span>Mesh {mesh.polygons.length}p/{mesh.polylines.length}l</span>
        <span>
          bbox {(mesh.bbox.maxX - mesh.bbox.minX) | 0}×{(mesh.bbox.maxY - mesh.bbox.minY) | 0} m
        </span>
        <span className="status-issues">
          校验 {issues.filter((x) => x.level === 'block').length}禁/{issues.filter((x) => x.level === 'warn').length}警
        </span>
        {signal && (
          <span>
            C={signal.cycleSec}s
            {buildSignalTimingAlignment(signal).closed ? ' · 闭合✓' : ' · 未闭合'}
          </span>
        )}
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
          'xsection-report-md': () => {
            if (!selected) return
            const rep = buildSectionReport(selected)
            downloadText(`${project.name}-${selected.name}-xsection.md`, sectionReportMarkdown(project.name, rep), 'text/markdown')
          },
          'xsection-report-csv': () => {
            if (!selected) return
            const rep = buildSectionReport(selected)
            downloadText(`${project.name}-${selected.name}-xsection.csv`, sectionReportCsv(rep), 'text/csv')
          },
          'xsection-svg': () => {
            if (!xsection || !selected) return
            exportSvgFile(
              `${project.name}-${selected.name}-xsection.svg`,
              professionalCrossSectionSvg(xsection, selected, {
                theme,
                componentsOverride: componentsForDiagram(selected, xsection),
              }),
            )
          },
          'roadgee-signal-board': () => {
            if (!channel || !signal) return
            exportSvgFile(
              `${project.name}-信号相位图.svg`,
              roadgeeSignalBoardSvg(channel.approaches, signal, { width: 800 }),
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
          'roadgee-flow-svg': () => {
            if (!channel || !flow) return
            exportSvgFile(
              `${project.name}-流量流向图.svg`,
              roadgeeFlowDiagramSvg(channel.approaches, flow, {
                size: 720,
                mode: flowDisplayMode,
                style: flowDiagramStyle,
              }),
            )
          },
          'flow-report-hires-svg': () => {
            if (!channel || !flow) return
            exportSvgFile(
              `${project.name}-流量流向报告.svg`,
              professionalFlowReportSvg(channel.approaches, flow, {
                size: 900,
                mode: flowDisplayMode,
                style: flowDiagramStyle,
              }),
            )
          },
          'flow-od-md': () => {
            if (!channel || !flow) return
            downloadText(
              `${project.name}-OD.md`,
              flowOdReportMarkdown(project.name, channel.approaches, flow, flowDisplayMode),
              'text/markdown',
            )
          },
          'flow-od-csv': () => {
            if (!channel || !flow) return
            downloadText(
              `${project.name}-OD.csv`,
              flowOdReportCsv(channel.approaches, flow, flowDisplayMode),
              'text/csv',
            )
          },
          'analysis-plan-pack-svg': () => {
            if (!channel || !analysis) return
            exportSvgFile(
              `${project.name}-评价平面图合集.svg`,
              professionalAnalysisPlanPackSvg(channel.approaches, analysis, {
                cellSize: 440,
                projectName: project.name,
                channelName: channel.name,
                signalName: signal?.name,
              }),
            )
          },
          'analysis-plan-pack-md': () => {
            if (!analysis) return
            downloadText(
              `${project.name}-评价合集.md`,
              analysisPlanPackMarkdown(project.name, analysis, {
                channel: channel?.name,
                signal: signal?.name,
              }),
              'text/markdown',
            )
          },
          'analysis-plan-pack-csv': () => {
            if (!analysis) return
            downloadText(`${project.name}-评价车道.csv`, analysisPlanPackCsv(analysis), 'text/csv')
          },
          'roadgee-plan-los': () => {
            if (!channel || !analysis) return
            exportSvgFile(
              `${project.name}-服务水平.svg`,
              roadgeeAnalysisPlanSvg(channel.approaches, analysis, { size: 720, metric: 'los' }),
            )
          },
          'roadgee-plan-delay': () => {
            if (!channel || !analysis) return
            exportSvgFile(
              `${project.name}-延误时间.svg`,
              roadgeeAnalysisPlanSvg(channel.approaches, analysis, { size: 720, metric: 'delay' }),
            )
          },
          'roadgee-plan-queue': () => {
            if (!channel || !analysis) return
            exportSvgFile(
              `${project.name}-排队长度.svg`,
              roadgeeAnalysisPlanSvg(channel.approaches, analysis, { size: 720, metric: 'queue' }),
            )
          },
          'roadgee-plan-vc': () => {
            if (!channel || !analysis) return
            exportSvgFile(
              `${project.name}-饱和度.svg`,
              roadgeeAnalysisPlanSvg(channel.approaches, analysis, { size: 720, metric: 'vc' }),
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
          'conflict-board-svg': () => {
            if (!channel || !signal) return
            exportSvgFile(
              `${project.name}-冲突审查看板.svg`,
              professionalConflictBoardSvg(channel.approaches, signal, {
                phaseId: focusPhaseId ?? signal.phases[0]?.id,
                projectName: project.name,
                width: 1000,
              }),
            )
          },
          'conflict-board-csv': () => {
            if (!channel || !signal) return
            downloadText(
              `${project.name}-conflict.csv`,
              conflictBoardCsv(channel.approaches, signal),
              'text/csv',
            )
          },
          'vissim-pack-oneclick': () => {
            if (!channel || !flow || !signal) return
            downloadVissimPack(project.name, channel.approaches, flow, signal)
          },
          'vissim-csv': () => {
            if (!channel || !flow || !signal) return
            const b = exportVissimCsvBundle(channel.approaches, flow, signal)
            downloadText(`${project.name}-vissim-links.csv`, b.links, 'text/csv')
            downloadText(`${project.name}-vissim-routes.csv`, b.routes, 'text/csv')
            downloadText(`${project.name}-vissim-volumes.csv`, b.volumes, 'text/csv')
            downloadText(`${project.name}-vissim-signal.csv`, b.signal, 'text/csv')
          },
          'vissim-inpx': () => {
            if (!channel || !flow || !signal) return
            const pack = buildVissimInpxPack(project.name, channel.approaches, flow, signal)
            downloadText(`${project.name}-vissim-README.md`, pack.readme, 'text/markdown')
            downloadText(`${project.name}.inpx.xml`, pack.xml, 'application/xml')
            downloadText(`${project.name}-vissim-summary.json`, pack.json, 'application/json')
            downloadText(`${project.name}-vissim-links.csv`, pack.bundle.links, 'text/csv')
            downloadText(`${project.name}-vissim-routes.csv`, pack.bundle.routes, 'text/csv')
            downloadText(`${project.name}-vissim-volumes.csv`, pack.bundle.volumes, 'text/csv')
            downloadText(`${project.name}-vissim-signal.csv`, pack.bundle.signal, 'text/csv')
          },
          'multi-page-report': () => {
            if (!channel || !flow || !signal || !analysis) return
            const html = buildMultiPageReportHtml({
              project,
              channel,
              flow,
              signal,
              analysis,
              bandCorridor: project.bandCorridor,
            })
            downloadText(`${project.name}-report.html`, html, 'text/html')
          },
          'ped-ring-svg': () => {
            if (!channel || !signal) return
            exportSvgFile(
              `${project.name}-ped-ring.svg`,
              pedestrianRingSvg(channel.approaches, signal, {
                focusPhaseId: focusPhaseId ?? signal.phases[0]?.id ?? null,
              }),
            )
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
          'compare-scorecard-svg': () => {
      const rows = collectCompareRows(project, analyzeIntersection)
      const snaps = collectSchemeSnapshots(project, analyzeIntersection)
      const cycleMap: Record<string, number> = {}
      for (const sn of snaps) cycleMap[`${sn.channel}/${sn.flow}/${sn.signal}`] = sn.cycleSec
      const kpis = kpisFromCompareRows(rows, cycleMap)
      exportSvgFile(`${project.name}-compare-scorecard.svg`, schemeScorecardSvg(kpis, { width: 720 }))
    },
    'compare-delta-md': () => {
      const rows = collectCompareRows(project, analyzeIntersection)
      const snaps = collectSchemeSnapshots(project, analyzeIntersection)
      const cycleMap: Record<string, number> = {}
      for (const sn of snaps) cycleMap[`${sn.channel}/${sn.flow}/${sn.signal}`] = sn.cycleSec
      const kpis = kpisFromCompareRows(rows, cycleMap)
      if (!kpis.length) return
      const deltas = schemeDeltas(kpis[0], kpis)
      downloadText(`${project.name}-compare-delta.md`, schemeDeltaMarkdown(project.name, kpis[0], deltas), 'text/markdown')
    },
    'unsignalized-plan-svg': () => {
      if (!channel || !flow || !signal) return
      const u = analyzeUnsignalized(channel.approaches, flow, signal, channel.intersectionType)
      exportSvgFile(`${project.name}-无信号平面.svg`, unsignalizedPlanSvg(channel.approaches, u, { size: 560 }))
    },
    'unsignalized-md': () => {
      if (!channel || !flow || !signal) return
      const u = analyzeUnsignalized(channel.approaches, flow, signal, channel.intersectionType)
      downloadText(`${project.name}-unsignalized.md`, unsignalizedMarkdown(project.name, u), 'text/markdown')
    },
    'unsignalized-csv': () => {
      if (!channel || !flow || !signal) return
      const u = analyzeUnsignalized(channel.approaches, flow, signal, channel.intersectionType)
      downloadText(`${project.name}-unsignalized.csv`, unsignalizedLegsCsv(u), 'text/csv')
    },
    'signal-control-board': () => {
      if (!channel || !flow || !signal) return
      const k = computeSaturationKpi(channel.approaches, flow, signal)
      exportSvgFile(`${project.name}-管控看板.svg`, signalControlBoardSvg(channel.approaches, signal, k, { width: 900 }))
    },
    'saturation-kpi-md': () => {
      if (!channel || !flow || !signal) return
      const k = computeSaturationKpi(channel.approaches, flow, signal)
      downloadText(`${project.name}-饱和度KPI.md`, saturationKpiMarkdown(project.name, k), 'text/markdown')
    },
    'optimize-preview-md': () => {
      if (!channel || !flow || !signal) return
      const p = previewOptimize(channel.approaches, flow, signal, {
        method: timingMethod,
        targetVc: designTargetVc,
        startLoss: designStartLoss,
      })
      downloadText(`${project.name}-优化预览.md`, optimizeDeltaMarkdown(project.name, p), 'text/markdown')
    },
    'timespace-hires-svg': () => {
      exportSvgFile(
        `${project.name}-timespace-hires.svg`,
        professionalTimeSpaceSvg(project.bandCorridor, band, {
          width: 1280,
          height: 720,
          theme: theme === 'light' ? 'light' : 'dark',
        }),
      )
    },
    'timespace-report-md': () => {
      downloadText(
        `${project.name}-timespace.md`,
        timeSpaceReportMarkdown(project.name, project.bandCorridor, band),
        'text/markdown',
      )
    },
    'timespace-report-csv': () => {
      downloadText(
        `${project.name}-timespace.csv`,
        timeSpaceReportCsv(project.bandCorridor, band),
        'text/csv',
      )
    },
    'corridor-network-svg': () => {
      exportSvgFile(
        `${project.name}-corridor-network.svg`,
        corridorNetworkPreviewSvg(project.bandCorridor, band, { width: 1200, height: 440 }),
      )
    },
    'maxband-report-svg': () => {
      const rep = buildMaxbandReport(project.bandCorridor)
      exportSvgFile(`${project.name}-maxband.svg`, maxbandReportDiagramSvg(project.bandCorridor, { report: rep, width: 900, height: 340 }))
    },
    'maxband-report-md': () => {
      const rep = buildMaxbandReport(project.bandCorridor)
      downloadText(`${project.name}-maxband.md`, maxbandReportMarkdown(project.name, rep), 'text/markdown')
    },
    'maxband-report-csv': () => {
      const rep = buildMaxbandReport(project.bandCorridor)
      downloadText(`${project.name}-maxband.csv`, maxbandReportCsv(rep), 'text/csv')
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
