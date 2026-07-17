import { buildExportHandlers } from '@/io/buildExportHandlers'
import { professionalCapacityMatrixSvg, capacityMatrixMarkdown, capacityMatrixCsv } from '@/ui/charts/professionalCapacityMatrix'
import { professionalPhaseNumberBoardSvg, phaseNumberBoardMarkdown } from '@/ui/charts/professionalPhaseNumberBoard'
import { professionalRightTurnBoardSvg, rightTurnBoardMarkdown, rightTurnBoardCsv } from '@/domain/channel/rightTurnReview'
import { runFullSchemeOptimize, fullOptimizeMarkdown } from '@/domain/optimize/fullSchemeOptimize'
import { cleanChannelPlanSvg, cleanFlowDiagramSvg, cleanAnalysisPlanSvg, cleanTimeSpaceSvg, cleanSignalTimingSvg, cleanCorridorNetworkSvg } from '@/io/cleanDrawingPack'
import { criticalYBoardSvg, criticalYMarkdown, criticalYCsv } from '@/ui/charts/criticalYBoard'
import { collectQueueStorageRows, queueStorageBoardSvg, queueStorageCsv } from '@/ui/charts/queueStorageBoard'
import { storageCheckBoardSvg, collectStorageCheckRows, storageCheckMarkdown, storageCheckCsv } from '@/ui/charts/storageCheckBoard'
import { criticalApproachBoardSvg, criticalApproachMarkdown, criticalApproachCsv } from '@/ui/charts/criticalApproachBoard'
import { offsetScanBoardSvg, scanCorridorOffsets, offsetScanMarkdown, offsetScanCsv } from '@/ui/charts/offsetScanBoard'
import { speedScanBoardSvg, scanCorridorSpeeds, speedScanMarkdown, speedScanCsv } from '@/ui/charts/speedScanBoard'
import { multiCorridorLinkBoardSvg, linkMultiCorridorOffsets, multiCorridorLinkMarkdown, multiCorridorLinkCsv } from '@/ui/charts/multiCorridorLinkBoard'
import { professionalMultiCorridorReportSvg, multiCorridorReportMarkdown, multiCorridorReportCsv } from '@/ui/charts/professionalMultiCorridorReport'
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { meshToPngBlob, DEFAULT_LAYERS, type CanvasHandle, type LayerVisibility, type LayerKey } from '@/canvas/CanvasView'
import { rebuildChannelMesh, THEME } from '@/domain/geometry/rebuild'
import { analyzeIntersection } from '@/domain/analysis'
import { buildCrossSection } from '@/domain/xsection/build'
import { validateProject, summarizeIssues } from '@/domain/validate'
import { detectProjectSignalIssues } from '@/domain/signal/conflicts'
import { wrapProject, serializeRtp, parseRtp } from '@/domain/rtp'
import { meshToSvg } from '@/io/exportSvg'
import { meshToDxf } from '@/io/exportDxf'
import { measureCorridor } from '@/domain/analysis/corridor'
import { downloadBlob, downloadText } from '@/io/download'
import { loadDraft, clearDraft } from '@/io/autosave'
import { persistAutosave, redo, undo, useAppStore } from '@/state/store'
import { CommandPalette } from '@/ui/common/CommandPalette'
import { ExportCenter } from '@/ui/common/ExportCenter'
import { SignalWorkspace } from '@/ui/layout/SignalWorkspace'
import { FlowWorkspace } from '@/ui/layout/FlowWorkspace'
import { ChannelWorkspace } from '@/ui/layout/ChannelWorkspace'
const BandPage = lazy(() => import('@/ui/layout/BandPage').then(m => ({ default: m.BandPage })))
import { LeftNav, NAV_ITEMS } from '@/ui/layout/LeftNav'
import { ModeCenterStage } from '@/ui/layout/ModeCenterStage'
import { SchemeSwitcher } from '@/ui/layout/SchemeSwitcher'
import { Icon } from '@/ui/icons/Icons'
import { AnalysisWorkspace } from '@/ui/layout/AnalysisWorkspace'
import { CompareWorkspace } from '@/ui/layout/CompareWorkspace'
import { XSectionWorkspace } from '@/ui/layout/XSectionWorkspace'
import { PrintPreviewModal } from '@/ui/common/PrintPreview'
import { type PrintPanel } from '@/io/printSheet'
import { collectEngineeringPrintPanels, engineeringPrintManifest } from '@/io/engineeringPrintPack'
import { conflictHitsMarkdown, conflictMatrixExportSvg } from '@/ui/charts/conflictExport'
import { professionalPedestrianBoardSvg, pedestrianTimingMarkdown, pedestrianTimingCsv } from '@/ui/charts/professionalPedestrianBoard'
import { professionalRoundaboutPlanSvg, roundaboutLayoutMarkdown } from '@/ui/charts/professionalRoundaboutPlan'
import { checkAnalysisIntegrity } from '@/domain/analysis/integrity'
import { flowChartsAlignWithTable, type FlowDisplayMode } from '@/domain/flow/flowAlign'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'
import { professionalTimeSpaceSvg, timeSpaceReportMarkdown, timeSpaceReportCsv } from '@/ui/charts/professionalTimeSpace'
import { optimizeSignalTiming, type TimingMethod } from '@/domain/analysis/timing'
import { runAutoTimingPack, generateProtectedPhases, clearPhaseGreens, computeSchemeY, autoTimingMarkdown, type AutoTimingDesign } from '@/domain/signal/autoTimingPack'
import { compareTimingMethods, recommendTimingRow, type TimingCompareRow } from '@/domain/analysis/timingCompare'
import { timingCompareBoardSvg, timingCompareMarkdown, timingCompareCsv, buildTimingCompareRows } from '@/ui/charts/timingCompareBoard'
import { overlapReviewSvg, overlapReviewMarkdown, overlapReviewCsv } from '@/ui/charts/overlapReviewBoard'
import { pedTimingOptBoardSvg, pedTimingOptMarkdown, pedTimingOptCsv } from '@/ui/charts/pedTimingOptBoard'
import { analysisMarkdown, exportJsonFile, exportSvgFile } from '@/io/exportCharts'
import { controlMatrixSvg, flowMovementDiagramSvg, signalTimingDiagramSvg, timeSpaceDiagramSvg } from '@/ui/charts/professionalDiagrams'
import { DEFAULT_ROADGEE_FLOW_STYLE } from '@/ui/charts/roadgeeFlowDiagram'
import { professionalFlowReportSvg, flowOdReportMarkdown, flowOdReportCsv } from '@/ui/charts/professionalFlowReport'
import { professionalAnalysisPlanPackSvg, analysisPlanPackMarkdown, analysisPlanPackCsv } from '@/ui/charts/professionalAnalysisPlanPack'
import type { EditorMode } from '@/domain/types'
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
  const linkAllCorridorOffsets = useAppStore((s) => s.linkAllCorridorOffsets)
  const applyOffsetScanBest = useAppStore((s) => s.applyOffsetScanBest)
  const applySpeedScanBest = useAppStore((s) => s.applySpeedScanBest)
  const applyFullSchemeOptimize = useAppStore((s) => s.applyFullSchemeOptimize)
  const applyCycleScanChoice = useAppStore((s) => s.applyCycleScanChoice)
  const applyIntergreenRecs = useAppStore((s) => s.applyIntergreenRecs)
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
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setExportOpen(true)
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      const t = e.target as HTMLElement | null
      const typing =
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !typing && ['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const map: EditorMode[] = ['channel', 'flow', 'signal', 'xsection', 'analysis', 'compare', 'band']
        setMode(map[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setMode])

  // Close topbar details menus on outside click / Escape
  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      document.querySelectorAll('details.menu-dropdown[open]').forEach((d) => {
        if (e instanceof MouseEvent && d.contains(e.target as Node)) return
        ;(d as HTMLDetailsElement).open = false
      })
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', close)
    }
  }, [])

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
    return collectEngineeringPrintPanels({
      project,
      channel,
      flow,
      signal,
      analysis,
      mesh,
      focusPhaseId,
      preferChannelDraft: true,
      preset: 'engineering',
    })
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
        <Suspense fallback={<div className="page-fill-stage" style={{display:"grid",placeItems:"center",background:"var(--bg)",color:"var(--text)",minHeight:"100%"}}>加载绿波…</div>}>
        <BandPage
                  applyOffsetScanBest={applyOffsetScanBest}
                  applySpeedScanBest={applySpeedScanBest}
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
                  linkAllCorridorOffsets={linkAllCorridorOffsets}
          onProgressiveOffsets={applyProgressiveOffsets}
          setBandSegmentLength={setBandSegmentLength}
          setActiveBand={setActiveBand}
          addBandCorridor={addBandCorridor}
          duplicateBandCorridor={duplicateBandCorridor}
          removeBandCorridor={removeBandCorridor}
          renameBandCorridor={renameBandCorridor}
        />
        </Suspense>
        </div>
        </div>
        <footer className="status">
          <span>v0.5.138 · 绿波专页</span>
          <span>{project.bandCorridor.name}</span>
          <span>带宽比 {(band.bandwidthRatio * 100).toFixed(1)}%</span>
          <span style={{ marginLeft: 'auto' }}>← 交叉口设计 返回单点编辑</span>
        </footer>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onOpenExport={() => setExportOpen(true)} />
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
            <span className="brand-ver">v0.5.138</span>
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
              <summary><Icon name="export" size={15} /><span>导出</span><span className="kbd-hint" style={{marginLeft:4,fontSize:10,color:'var(--muted)'}}>E</span></summary>
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
            <button type="button" className="ghost" onClick={() => undo()} title="撤销 Ctrl+Z"><Icon name="undo" size={16} /><span>撤销</span></button>
            <button type="button" className="ghost" onClick={() => redo()} title="重做 Ctrl+Y"><Icon name="redo" size={16} /><span>重做</span></button>
            <button type="button" className="ghost" onClick={() => setPaletteOpen(true)} title="命令面板 Ctrl+K"><Icon name="command" size={16} /><span>⌘K</span></button>
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
            <div className="mode-title">
              {MODES.find((m) => m.id === mode)?.label ?? mode}
              <small>{channel?.name ?? project.name}</small>
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
                    <div className="canvas-zoom-bar" role="toolbar" aria-label="画布缩放">
                      <button type="button" className="ghost approach-chip-tool" title="缩小" onClick={() => canvasRef.current?.zoomOut()}>
                        −
                      </button>
                      <button type="button" className="ghost approach-chip-tool" title="放大" onClick={() => canvasRef.current?.zoomIn()}>
                        +
                      </button>
                      <button type="button" className="ghost approach-chip-tool" onClick={() => canvasRef.current?.fitView()}>
                        <Icon name="fit" size={14} /><span>适应</span>
                      </button>
                    </div>
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
                focusPhaseId={focusPhaseId}
                onFocusPhase={setFocusPhaseId}
                onUpdatePhaseTiming={updatePhaseTiming}
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
                  approaches={channel?.approaches}
                  onSelectApproach={selectApproach}
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
                  onApplyCycleScan={(c) => {
                    applyCycleScanChoice(c)
                  }}
                  onApplyIntergreenRecs={(onlyShort) => {
                    applyIntergreenRecs(onlyShort)
                  }}
                  onApplyFullSchemeOptimize={() => {
                    const r = applyFullSchemeOptimize()
                    if (r) {
                      downloadText(
                        `${project.name}-一键全方案优化.md`,
                        fullOptimizeMarkdown(project.name, r),
                        'text/markdown',
                      )
                    }
                  }}
                  onExportCriticalY={() => {
                    if (!channel || !flow || !signal) return
                    exportSvgFile(
                      `${project.name}-Y分解.svg`,
                      criticalYBoardSvg(channel.approaches, flow, signal, { width: 720 }),
                    )
                    downloadText(
                      `${project.name}-Y分解.md`,
                      criticalYMarkdown(project.name, channel.approaches, flow, signal),
                      'text/markdown',
                    )
                    downloadText(
                      `${project.name}-Y分解.csv`,
                      criticalYCsv(channel.approaches, flow, signal),
                      'text/csv',
                    )
                  }}
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
                  onApplyFullSchemeOptimize={() => {
                    const r = applyFullSchemeOptimize()
                    if (r) {
                      downloadText(
                        `${project.name}-一键全方案优化.md`,
                        fullOptimizeMarkdown(project.name, r),
                        'text/markdown',
                      )
                    }
                  }}
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
              {mode === 'flow' && !(flow && channel) && (
                <p style={{ color: 'var(--text)', padding: 12, fontSize: 13 }}>当前无流量方案，请先在顶栏新建或选择流量方案。</p>
              )}
              {mode === 'signal' && !signal && (
                <p style={{ color: 'var(--text)', padding: 12, fontSize: 13 }}>当前无信号方案，请先在顶栏新建或选择信号方案。</p>
              )}
              {mode === 'analysis' && !(analysis && analysisIntegrity) && (
                <p style={{ color: 'var(--text)', padding: 12, fontSize: 13 }}>分析数据未就绪，请确认渠化/流量/信号方案完整。</p>
              )}
              {mode === 'xsection' && !(xsection && selected) && (
                <p style={{ color: 'var(--text)', padding: 12, fontSize: 13 }}>请选择进口以生成横断面。</p>
              )}
            </div>
          </div>
        </main>

      </div>

      <footer className="status">
        <span>v0.5.138</span>
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
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onOpenExport={() => setExportOpen(true)} />
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
        handlers={buildExportHandlers({
          applyFullSchemeOptimize,
          analysis,
          band,
          channel,
          designStartLoss,
          designTargetVc,
          exportDxf,
          exportPng,
          exportProfessionalDiagrams,
          exportSvg,
          flow,
          flowDiagramStyle,
          flowDisplayMode,
          focusPhaseId,
          mesh,
          openPrintPreview,
          project,
          saveRtp,
          selected,
          signal,
          theme,
          timingCompare,
        })}
      />
    </div>
  )
}
