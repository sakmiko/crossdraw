import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasView, meshToPngBlob, DEFAULT_LAYERS, type CanvasHandle, type LayerVisibility, type LayerKey } from '@/canvas/CanvasView'
import { rebuildChannelMesh, THEME } from '@/domain/geometry/rebuild'
import { analyzeIntersection, websterTiming } from '@/domain/analysis'
import { buildCrossSection, markStaleIfNeeded } from '@/domain/xsection/build'
import { validateProject, summarizeIssues } from '@/domain/validate'
import { detectProjectSignalIssues } from '@/domain/signal/conflicts'
import { wrapProject, serializeRtp, parseRtp } from '@/domain/rtp'
import { meshToSvg } from '@/io/exportSvg'
import { meshToDxf } from '@/io/exportDxf'
import { analysisToCsv, analysisToExcelHtml, collectCompareRows, compareSchemesCsv } from '@/io/report'
import { exportVissimCsvBundle } from '@/io/vissimCsv'
import { optimizeCorridor } from '@/domain/analysis/corridor'
import { downloadBlob, downloadText } from '@/io/download'
import { loadDraft, clearDraft } from '@/io/autosave'
import { persistAutosave, redo, undo, useAppStore } from '@/state/store'
import { CommandPalette } from '@/ui/common/CommandPalette'
import { AnalysisCharts, BandCharts, CompareCharts, CrossSectionCharts, FlowCharts, SchemeCompareBoard, SignalCharts, TimingCompareCharts } from '@/ui/charts/ChartPanels'
import { ControlMatrixPanel, FlowDirectionPanel, PhaseFacePanel, SignalTimingPanel, TimeSpacePanel } from '@/ui/charts/ProfessionalPanels'
import { InteractiveTimeSpace, buildTimeSpaceExportSvg } from '@/ui/charts/InteractiveTimeSpace'
import { corridorSegments } from '@/domain/analysis/corridor'
import { optimizeSignalTiming, criticalFlowRatios, TIMING_METHOD_LABELS, type TimingMethod } from '@/domain/analysis/timing'
import { compareTimingMethods, recommendTimingRow, type TimingCompareRow } from '@/domain/analysis/timingCompare'
import { vcHeatColor } from '@/ui/charts/svgCharts'
import { analysisMarkdown, bandMarkdown, exportJsonFile, exportSvgFile } from '@/io/exportCharts'
import { buildAnalysisReportSvg } from '@/io/analysisReportSvg'
import { collectSchemeSnapshots, schemeTimingStripSvg, schemeMetricsCompareSvg } from '@/ui/charts/schemeCompareDiagrams'
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
  const togglePhaseRelease = useAppStore((s) => s.togglePhaseRelease)
  const updateBand = useAppStore((s) => s.updateBand)
  const updateBandNode = useAppStore((s) => s.updateBandNode)
  const addBandNode = useAppStore((s) => s.addBandNode)
  const removeBandNode = useAppStore((s) => s.removeBandNode)
  const optimizeBand = useAppStore((s) => s.optimizeBand)
  const setBandSegmentLength = useAppStore((s) => s.setBandSegmentLength)
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

  const selected = channel?.approaches.find((a) => a.id === selectedApproachId) ?? channel?.approaches[0]

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

  const band = useMemo(() => optimizeCorridor(project.bandCorridor), [project.bandCorridor])

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
        <aside className="side">
          <div className="section-title">方案树</div>
          <div className="toolbar" style={{ marginBottom: 8 }}>
            <button type="button" onClick={() => duplicateChannel()}>+渠化</button>
            <button type="button" onClick={() => addFlowScheme()}>+流量</button>
            <button type="button" onClick={() => addSignalScheme()}>+信号</button>
          </div>
          {project.channelizationSchemes.map((ch) => (
            <div
              key={ch.id}
              className={`tree-item ${ch.id === channel?.id ? 'active' : ''}`}
              onClick={() => setActiveChannel(ch.id)}
            >
              <strong>{ch.name}</strong>
              <div className="hint">{ch.approaches.length} 进口 · {ch.intersectionType}</div>
              {ch.id === channel?.id && project.channelizationSchemes.length > 1 && (
                <button
                  type="button"
                  className="ghost"
                  style={{ marginTop: 4 }}
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
                  style={{ marginLeft: 8, marginTop: 6 }}
                  className={fl.id === flow?.id ? 'hint' : 'hint'}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveChannel(ch.id)
                    setActiveFlow(fl.id)
                  }}
                >
                  流量：{fl.name}{fl.id === flow?.id ? ' · 当前' : ''}
                  {fl.signalSchemes.map((sg) => (
                    <div
                      key={sg.id}
                      style={{ marginLeft: 8 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveChannel(ch.id)
                        setActiveFlow(fl.id)
                        setActiveSignal(sg.id)
                      }}
                    >
                      信号：{sg.name} · C={sg.cycleSec}s{sg.id === signal?.id ? ' · 当前' : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <div className="section-title">进口道</div>
          {channel?.approaches.map((ap) => (
            <div
              key={ap.id}
              className={`tree-item ${selected?.id === ap.id ? 'active' : ''}`}
              onClick={() => selectApproach(ap.id)}
            >
              {ap.name}
              <div className="hint">{ap.entryLanes.length} 车道 · {ap.bearingDeg}°</div>
            </div>
          ))}
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

          {mode === 'channel' && selected && (
            <div className="card" style={{ marginTop: 12 }}>
              <h2>渠化 · {selected.name}</h2>
              <label>
                进口车道数
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={selected.entryLanes.length}
                  onChange={(e) => setLaneCount(selected.id, Number(e.target.value))}
                />
              </label>
              <div className="field-row">
                <label>
                  展宽段长 (m)
                  <input
                    type="number"
                    value={selected.widen.entryWidenLengthM}
                    onChange={(e) =>
                      updateApproach(selected.id, {
                        widen: { ...selected.widen, entryWidenLengthM: Number(e.target.value) },
                      })
                    }
                  />
                </label>
                <label>
                  中分带宽 (m)
                  <input
                    type="number"
                    value={selected.median.widthM}
                    onChange={(e) =>
                      updateApproach(selected.id, {
                        median: { ...selected.median, widthM: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              </div>
              <div className="field-row">
                <label>
                  人行道宽
                  <input
                    type="number"
                    value={selected.sidewalkWidthM}
                    onChange={(e) => updateApproach(selected.id, { sidewalkWidthM: Number(e.target.value) })}
                  />
                </label>
                <label>
                  右转半径
                  <input
                    type="number"
                    value={selected.rightTurn.radiusM}
                    onChange={(e) =>
                      updateApproach(selected.id, {
                        rightTurn: { ...selected.rightTurn, radiusM: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              </div>
              <label>
                中分样式
                <select
                  value={selected.median.style}
                  onChange={(e) =>
                    updateApproach(selected.id, {
                      median: { ...selected.median, style: e.target.value as typeof selected.median.style },
                    })
                  }
                >
                  <option value="greenBelt">绿化带</option>
                  <option value="doubleYellow">双黄线</option>
                  <option value="barrier">护栏</option>
                  <option value="yellowHatch">黄斜线</option>
                  <option value="singleYellow">单黄线</option>
                  <option value="fishBelly">鱼肚线</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selected.rightTurn.enabled}
                  onChange={(e) =>
                    updateApproach(selected.id, {
                      rightTurn: { ...selected.rightTurn, enabled: e.target.checked },
                    })
                  }
                />{' '}
                右转渠化
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selected.bikeEnabled}
                  onChange={(e) => updateApproach(selected.id, { bikeEnabled: e.target.checked })}
                />{' '}
                非机动车道
              </label>
              <details className="details-block" open>
                <summary>渠化选项 / 待转借道</summary>
                <div className="details-body">
              <div className="field-row">
                <label>
                  <input
                    type="checkbox"
                    checked={selected.leftWait}
                    onChange={(e) => updateApproach(selected.id, { leftWait: e.target.checked })}
                  />{' '}
                  左转待转
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.throughWait}
                    onChange={(e) => updateApproach(selected.id, { throughWait: e.target.checked })}
                  />{' '}
                  直行待行
                </label>
              </div>
              <div className="field-row">
                <label>
                  <input
                    type="checkbox"
                    checked={selected.borrowLeft}
                    onChange={(e) => updateApproach(selected.id, { borrowLeft: e.target.checked })}
                  />{' '}
                  借道左转
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.redRightTurn}
                    onChange={(e) => updateApproach(selected.id, { redRightTurn: e.target.checked })}
                  />{' '}
                  红灯右转
                </label>
              </div>
              {selected.redRightTurn && (
                <label>
                  红灯右转比例
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    max={1}
                    value={selected.redRightTurnRatio}
                    onChange={(e) => updateApproach(selected.id, { redRightTurnRatio: Number(e.target.value) })}
                  />
                </label>
              )}
                </div>
              </details>
              <details className="details-block" open>
                <summary>分车道宽 / 转向</summary>
                <div className="details-body">
              <div className="section-title" style={{ marginTop: 0 }}>车道配置</div>
              {selected.entryLanes.map((ln, i) => (
                <div key={ln.id} className="field-row" style={{ alignItems: 'end' }}>
                  <label>
                    车道{i + 1}宽
                    <input
                      type="number"
                      step={0.05}
                      value={ln.widthM}
                      onChange={(e) => setLaneWidth(selected.id, i, Number(e.target.value))}
                    />
                  </label>
                  <label>
                    转向
                    <input
                      value={ln.movements.join('')}
                      onChange={(e) => {
                        const raw = e.target.value.toUpperCase().replace(/[^ULTR]/g, '')
                        const movs = Array.from(new Set(raw.split(''))) as Movement[]
                        setLaneMovements(selected.id, i, movs)
                      }}
                    />
                  </label>
                </div>
              ))}
              <p className="hint">改参后画布即时联动。待转/借道/红灯右转参与几何与分析。</p>
                </div>
              </details>
            </div>
          )}

          {mode === 'flow' && flow && channel && (
            <div className="card" style={{ marginTop: 12 }}>
              <h2>流量 · {flow.name}</h2>
              <div className="field-row">
                <label>
                  大车比例
                  <input
                    type="number"
                    step={0.01}
                    value={flow.heavyRatio}
                    onChange={(e) => setFlowParams({ heavyRatio: Number(e.target.value) })}
                  />
                </label>
                <label>
                  PHF
                  <input
                    type="number"
                    step={0.01}
                    value={flow.phf}
                    onChange={(e) => setFlowParams({ phf: Number(e.target.value) })}
                  />
                </label>
              </div>
              <div className="table-wrap" style={{ maxHeight: 200 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>进口</th>
                      <th>L</th>
                      <th>T</th>
                      <th>R</th>
                      <th>合计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channel.approaches.map((ap) => {
                      const v = flow.volumes[ap.id] ?? { U: 0, L: 0, T: 0, R: 0 }
                      const cell = (k: keyof TurnVolumes) => (
                        <input
                          type="number"
                          value={v[k]}
                          onChange={(e) => setVolume(ap.id, { [k]: Number(e.target.value) })}
                        />
                      )
                      const sum = (v.L || 0) + (v.T || 0) + (v.R || 0)
                      return (
                        <tr key={ap.id}>
                          <td>{ap.name}</td>
                          <td>{cell('L')}</td>
                          <td>{cell('T')}</td>
                          <td>{cell('R')}</td>
                          <td className="hint">{sum}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="hint">单位 veh/h · 图表与矩阵同步</p>
              <FlowCharts approaches={channel.approaches} flow={flow} />
              <FlowDirectionPanel approaches={channel.approaches} flow={flow} />
            </div>
          )}

          {mode === 'signal' && signal && (
            <div className="card" style={{ marginTop: 12 }}>
              <h2>信号 · {signal.name}</h2>
              <label>
                周期 C (s)
                <input type="number" value={signal.cycleSec} onChange={(e) => setCycle(Number(e.target.value))} />
              </label>
              <div className="ring">
                {signal.phases.map((ph) => (
                  <div key={ph.id} className="phase" style={{ minWidth: 168 }}>
                    <input
                      value={ph.name}
                      onChange={(e) => updatePhaseTiming(ph.id, { name: e.target.value })}
                      aria-label="相位名称"
                      style={{ marginBottom: 6, fontWeight: 650 }}
                    />
                    <div className="field-row-3">
                      <label>
                        G
                        <input
                          type="number"
                          value={ph.greenSec}
                          onChange={(e) => updatePhaseTiming(ph.id, { greenSec: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Y
                        <input
                          type="number"
                          value={ph.yellowSec}
                          onChange={(e) => updatePhaseTiming(ph.id, { yellowSec: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        AR
                        <input
                          type="number"
                          value={ph.allRedSec}
                          onChange={(e) => updatePhaseTiming(ph.id, { allRedSec: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                    <label style={{ marginTop: 4 }}>
                      <input
                        type="checkbox"
                        checked={!!ph.isOverlap}
                        onChange={(e) => updatePhaseTiming(ph.id, { isOverlap: e.target.checked })}
                      />{' '}
                      搭接相位 Overlap
                    </label>
                    <div className="hint" style={{ marginTop: 6 }}>
                      放行矩阵
                    </div>
                    {channel?.approaches.map((ap) => (
                      <div key={ap.id} style={{ marginTop: 4 }}>
                        <span className="hint">{ap.name}</span>
                        <div className="toolbar" style={{ gap: 4, marginTop: 2 }}>
                          {(['L', 'T', 'R'] as Movement[]).map((m) => {
                            const on = (ph.releases[ap.id] ?? []).includes(m)
                            return (
                              <button
                                key={m}
                                type="button"
                                className={on ? 'primary' : 'ghost'}
                                style={{ padding: '2px 6px', fontSize: 11 }}
                                onClick={() => togglePhaseRelease(ph.id, ap.id, m)}
                              >
                                {m}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button type="button" onClick={() => addPhase()}>添加相位</button>
                <button type="button" onClick={() => addOverlapPhase()}>
                  添加搭接
                </button>
                <label className="timing-method">
                  配时方法
                  <select value={timingMethod} onChange={(e) => setTimingMethod(e.target.value as TimingMethod)}>
                    <option value="webster">Webster 最优周期</option>
                    <option value="hcm-delay">延误最小 (HCM)</option>
                    <option value="equal">等绿灯</option>
                    <option value="fixed-cycle">固定周期分绿</option>
                  </select>
                </label>
                <label className="timing-fixed">
                  <input
                    type="checkbox"
                    checked={fixedCycleOn || timingMethod === 'fixed-cycle'}
                    onChange={(e) => {
                      setFixedCycleOn(e.target.checked)
                      if (e.target.checked && signal) setFixedCycleSec(signal.cycleSec)
                    }}
                  />{' '}
                  固定周期
                </label>
                {(fixedCycleOn || timingMethod === 'fixed-cycle') && (
                  <label>
                    C(s)
                    <input
                      type="number"
                      min={40}
                      max={180}
                      value={fixedCycleSec}
                      onChange={(e) => setFixedCycleSec(Number(e.target.value))}
                      style={{ width: 72 }}
                    />
                  </label>
                )}
                <button type="button" className="primary" onClick={runWebster}>
                  一键优化配时
                </button>
                <button type="button" onClick={runTimingCompare}>
                  多方法比选
                </button>
              </div>
              {timingCompare.length > 0 && (
                <div className="card panel-stack" style={{ marginTop: 10 }}>
                  <div className="panel-header">
                    <h2 style={{ margin: 0, fontSize: 15 }}>配时方法比选</h2>
                    <span className="hint">同渠化·同流量 · 点击应用</span>
                  </div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>方法</th>
                          <th>C(s)</th>
                          <th>Y</th>
                          <th>v/c</th>
                          <th>延误s</th>
                          <th>LOS</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {timingCompare.map((r) => {
                          const rec = recommendTimingRow(timingCompare)
                          const isRec = rec?.method === r.method
                          return (
                            <tr key={r.method} className={isRec ? 'row-recommend' : ''}>
                              <td>
                                {r.label}
                                {isRec ? ' ★' : ''}
                              </td>
                              <td>{r.cycleSec}</td>
                              <td>{r.Y.toFixed(3)}</td>
                              <td>
                                <span className="vc-chip" style={{ background: vcHeatColor(r.avgVc) }}>
                                  {r.avgVc.toFixed(3)}
                                </span>
                              </td>
                              <td>{r.avgDelay.toFixed(1)}</td>
                              <td>
                                <span className={`los-badge los-${r.los}`}>{r.los}</span>
                              </td>
                              <td>
                                <button type="button" className="ghost" onClick={() => applyTimingCompareRow(r)}>
                                  应用
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <TimingCompareCharts
                    rows={timingCompare.map((r) => ({
                      label: r.label,
                      avgDelay: r.avgDelay,
                      avgVc: r.avgVc,
                      los: r.los,
                      cycleSec: r.cycleSec,
                      method: r.method,
                    }))}
                  />
                </div>
              )}
              <SignalCharts signal={signal} approaches={channel?.approaches} />
              <SignalTimingPanel signal={signal} />
              {channel && <ControlMatrixPanel signal={signal} approaches={channel.approaches} />}
              {channel && <PhaseFacePanel signal={signal} approaches={channel.approaches} />}
              {timingNotes.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                  <div className="section-title">配时优化说明 · {TIMING_METHOD_LABELS[timingMethod]}</div>
                  <ul className="hint" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {timingNotes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {channel && flow && (
                <div className="card" style={{ marginTop: 8 }}>
                  <div className="section-title">关键流量比 y（Webster）</div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>相位</th>
                        <th>y</th>
                        <th>关键量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalFlowRatios(channel.approaches, flow, signal).map((r) => (
                        <tr key={r.phase}>
                          <td>{r.phase}</td>
                          <td>{r.y.toFixed(3)}</td>
                          <td>{r.volume.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="hint">C₀=(1.5L+5)/(1−Y) · Webster 1958 · 见专业依据文档</p>
                </div>
              )}
            </div>
          )}

          {mode === 'xsection' && xsection && selected && (
            <div className="card" style={{ marginTop: 12 }}>
              <h2>横断面 · {selected.name}</h2>
              <div className="xsection">
                {xsection.components.map((c, i) => (
                  <div key={i} style={{ flex: c.widthM, background: c.color }} title={`${c.label} ${c.widthM}m`}>
                    {c.widthM >= 2 ? `${c.label}\n${c.widthM}m` : ''}
                  </div>
                ))}
              </div>
              <p className="hint">
                总宽 {xsection.components.reduce((s, c) => s + c.widthM, 0).toFixed(2)} m
                {markStaleIfNeeded(xsection, selected).stale ? ' · 需刷新' : ' · 已同步'}
              </p>
              <CrossSectionCharts section={xsection} />
            </div>
          )}

          {mode === 'analysis' && analysis && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="panel-header">
                <h2>评价分析</h2>
              </div>
              <div className="metric-grid">
                <div className="metric">
                  <div className="label">平均 v/c</div>
                  <div className="value">{analysis.avgVc.toFixed(3)}</div>
                </div>
                <div className="metric">
                  <div className="label">车均延误</div>
                  <div className="value">
                    {analysis.avgDelay.toFixed(1)}
                    <small style={{ fontSize: 12 }}> s</small>
                  </div>
                </div>
                <div className="metric">
                  <div className="label">平均排队</div>
                  <div className="value">
                    {analysis.avgQueueM.toFixed(1)}
                    <small style={{ fontSize: 12 }}> m</small>
                  </div>
                </div>
                <div className={`metric los-${analysis.losFinal}${analysis.losFinal === 'F' || analysis.losFinal === 'E' ? ' danger' : ''}`}>
                  <div className="label">服务水平</div>
                  <div className="value">{analysis.losFinal}</div>
                  <div className="sub">与图表/表格同源</div>
                </div>
              </div>
              <AnalysisCharts analysis={analysis} />
              <p className="hint" style={{ marginTop: 8 }}>
                平均饱和度 {analysis.avgVc.toFixed(3)} · 车均延误 {analysis.avgDelay.toFixed(1)} s · 排队{' '}
                {analysis.avgQueueM.toFixed(1)} m · LOS {analysis.losFinal}
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>进口</th>
                      <th>转向</th>
                      <th>v/c</th>
                      <th>延误</th>
                      <th>排队m</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.lanes.map((l, i) => (
                      <tr key={i}>
                        <td>{l.approachName}</td>
                        <td>{l.movement}</td>
                        <td>
                          <span className="vc-chip" style={{ background: vcHeatColor(l.vc) }}>{l.vc.toFixed(2)}</span>
                        </td>
                        <td className={l.delaySec >= 80 ? 'cell-hot' : l.delaySec >= 55 ? 'cell-warm' : ''}>{l.delaySec.toFixed(1)}</td>
                        <td>{l.queueM.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CompareCharts
                rows={collectCompareRows(project, analyzeIntersection).map((r) => ({
                  label: `${r.channel}/${r.signal}`,
                  avgVc: r.avgVc,
                  avgDelay: r.avgDelay,
                  los: r.los,
                }))}
              />
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => downloadText(`${project.name}-analysis.csv`, analysisToCsv(analysis), 'text/csv')}
                >
                  导出 CSV
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `${project.name}-analysis.xls`,
                      analysisToExcelHtml(project.name, analysis),
                      'application/vnd.ms-excel',
                    )
                  }
                >
                  导出 Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rows = collectCompareRows(project, analyzeIntersection)
                    downloadText(`${project.name}-compare.csv`, compareSchemesCsv(rows), 'text/csv')
                  }}
                >
                  多方案对比 CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!channel || !flow || !signal) return
                    const b = exportVissimCsvBundle(channel.approaches, flow, signal)
                    downloadText(`${project.name}-vissim-links.csv`, b.links, 'text/csv')
                    downloadText(`${project.name}-vissim-routes.csv`, b.routes, 'text/csv')
                    downloadText(`${project.name}-vissim-volumes.csv`, b.volumes, 'text/csv')
                    downloadText(`${project.name}-vissim-signal.csv`, b.signal, 'text/csv')
                  }}
                >
                  Vissim CSV 包
                </button>
                <button type="button" className="primary" onClick={exportProfessionalDiagrams}>
                  导出专业图件包
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!channel || !flow || !signal || !analysis) return
                    const svg = buildAnalysisReportSvg({
                      projectName: project.name,
                      channelName: channel.name,
                      signalName: signal.name,
                      approaches: channel.approaches,
                      flow,
                      signal,
                      analysis,
                      theme,
                    })
                    exportSvgFile(`${project.name}-analysis-board.svg`, svg)
                    downloadText(
                      `${project.name}-report.md`,
                      analysisMarkdown(project.name, {
                        avgVc: analysis.avgVc,
                        avgDelay: analysis.avgDelay,
                        avgQueueM: analysis.avgQueueM,
                        losFinal: analysis.losFinal,
                        cycleSec: signal.cycleSec,
                        notes: ['分析拼图 SVG 已同步导出'],
                      }),
                      'text/markdown',
                    )
                  }}
                >
                  导出分析拼图
                </button>
              </div>
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button type="button" className="primary" onClick={() => setMode('compare')}>
                  打开方案比选工作区
                </button>
              </div>
              <div className="section-title">方案对比摘要</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>渠化</th>
                    <th>流量</th>
                    <th>信号</th>
                    <th>v/c</th>
                    <th>延误</th>
                    <th>LOS</th>
                  </tr>
                </thead>
                <tbody>
                  {collectCompareRows(project, analyzeIntersection).map((r, i) => (
                    <tr key={i}>
                      <td>{r.channel}</td>
                      <td>{r.flow}</td>
                      <td>{r.signal}</td>
                      <td>{r.avgVc.toFixed(2)}</td>
                      <td>{r.avgDelay.toFixed(1)}</td>
                      <td>{r.los}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="card" style={{ marginTop: 12 }}>
              <h2>干道绿波 · {project.bandCorridor.name}</h2>
              <div className="field-row">
                <label>
                  走廊速度 km/h
                  <input
                    type="number"
                    value={project.bandCorridor.speedKmh}
                    onChange={(e) => updateBand({ speedKmh: Number(e.target.value) })}
                  />
                </label>
                <label>
                  方法
                  <select
                    value={project.bandCorridor.method}
                    onChange={(e) =>
                      updateBand({ method: e.target.value as typeof project.bandCorridor.method })
                    }
                  >
                    <option value="classic">经典数解（双向）</option>
                    <option value="two-way-equal">双向等带宽</option>
                    <option value="optimized-scan">优化扫描 (MAXBAND启发)</option>
                    <option value="graphical">图解法（半周期）</option>
                    <option value="one-way">单向绿波</option>
                  </select>
                </label>
              </div>
              <div className="metric-grid band-kpi" style={{ marginTop: 8 }}>
                <div className="metric">
                  <div className="label">带宽比</div>
                  <div className="value">{(band.bandwidthRatio * 100).toFixed(1)}%</div>
                </div>
                <div className="metric">
                  <div className="label">上行带宽</div>
                  <div className="value">{(band.forwardBandwidthSec ?? band.bandwidthSec).toFixed(1)}<small> s</small></div>
                </div>
                <div className="metric">
                  <div className="label">下行带宽</div>
                  <div className="value">{(band.backwardBandwidthSec ?? 0).toFixed(1)}<small> s</small></div>
                </div>
                <div className="metric">
                  <div className="label">半周期 a</div>
                  <div className="value">{band.halfCycleDistanceM.toFixed(0)}<small> m</small></div>
                </div>
                <div className="metric">
                  <div className="label">标准带速</div>
                  <div className="value">{band.standardSpeedKmh.toFixed(1)}<small> km/h</small></div>
                </div>
              </div>
              <p className="hint">指标与下方时距图色带联动；优化相位差后自动刷新。</p>
              <table className="table">
                <thead>
                  <tr>
                    <th>路口</th>
                    <th>桩号m</th>
                    <th>λ</th>
                    <th>C</th>
                    <th>相位差</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {project.bandCorridor.nodes.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <input
                          value={n.name}
                          onChange={(e) => updateBandNode(n.id, { name: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={n.distanceM}
                          onChange={(e) => updateBandNode(n.id, { distanceM: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step={0.01}
                          value={n.greenRatio}
                          onChange={(e) => updateBandNode(n.id, { greenRatio: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={n.cycleSec}
                          onChange={(e) => updateBandNode(n.id, { cycleSec: Number(e.target.value) })}
                        />
                      </td>
                      <td>{n.offsetSec.toFixed(1)}</td>
                      <td>
                        <button type="button" className="ghost" onClick={() => removeBandNode(n.id)}>
                          删
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="section-title" style={{ marginTop: 10 }}>路段距离（m）</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>路段</th>
                    <th>长度 m</th>
                  </tr>
                </thead>
                <tbody>
                  {corridorSegments(project.bandCorridor).map((seg) => (
                    <tr key={seg.toId}>
                      <td>
                        {seg.fromName} → {seg.toName}
                      </td>
                      <td>
                        <input
                          type="number"
                          min={50}
                          value={Math.round(seg.lengthM)}
                          onChange={(e) => setBandSegmentLength(seg.toId, Number(e.target.value))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="hint">修改路段长度会移动下游桩号；多路口走廊支持添加/删除节点。</p>
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button type="button" onClick={() => addBandNode()}>
                  添加路口
                </button>
                <button type="button" className="primary" onClick={() => optimizeBand()}>
                  优化相位差
                </button>
                <button
                  type="button"
                  onClick={() => {
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
                  }}
                >
                  导出时距图/简报
                </button>
              </div>
              <InteractiveTimeSpace corridor={project.bandCorridor} result={band} />
              <BandCharts corridor={project.bandCorridor} />
              <TimeSpacePanel corridor={project.bandCorridor} />
              <p className="hint">时距图悬停显示 λ、相位差、路段长度、行程时间；数据写入 .rtp。</p>
            </div>
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
        <span>Crossdraw v0.5.10</span>
        <span>Mesh polys {mesh.polygons.length}</span>
        <span>
          bbox {(mesh.bbox.maxX - mesh.bbox.minX) | 0}×{(mesh.bbox.maxY - mesh.bbox.minY) | 0} m
        </span>
        <span style={{ marginLeft: 'auto' }}>sakmiko/crossdraw · GPLv3</span>
      </footer>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
