/**
 * ExportCenter handlers — extracted from App.tsx (v0.5.136).
 * Behavior is unchanged; App only supplies runtime deps.
 */
// @ts-nocheck — large handler map; deps validated at runtime by ExportCenter + audit_export_handlers.py
import type { ExportItemId } from '@/io/exportCatalog'

export type ExportHandlerDeps = Record<string, any>
export type ExportHandlers = Partial<Record<ExportItemId | string, () => void | Promise<void>>>

export function buildExportHandlers(deps: ExportHandlerDeps): ExportHandlers {
  const {
    analysis,
    analysisMarkdown,
    analysisPlanPackCsv,
    analysisPlanPackMarkdown,
    analysisToCsv,
    analysisToExcelHtml,
    analyzeIntersection,
    analyzeUnsignalized,
    applyFullSchemeOptimize,
    band,
    bandBandwidthOption,
    bandMarkdown,
    buildA4PrintSheet,
    buildAnalysisReportSvg,
    buildChannelDraftSheet,
    buildCrossSection,
    buildMaxbandReport,
    buildMultiPageReportHtml,
    buildSectionReport,
    buildTimeSpaceExportSvg,
    buildTimingCompareRows,
    buildVissimInpxPack,
    capacityMatrixCsv,
    capacityMatrixMarkdown,
    channel,
    channelDraftMarkdown,
    cleanAnalysisPlanSvg,
    cleanChannelPlanSvg,
    cleanCorridorNetworkSvg,
    cleanFlowDiagramSvg,
    cleanSignalTimingSvg,
    cleanTimeSpaceSvg,
    collectCompareRows,
    collectCorridorKpis,
    collectEngineeringPrintPanels,
    collectIntergreenRows,
    collectQueueStorageRows,
    collectSchemeSnapshots,
    collectStorageCheckRows,
    compareSchemesCsv,
    compareSchemesOption,
    componentsForDiagram,
    computeSaturationKpi,
    conflictBoardCsv,
    conflictDiagramExportSvg,
    conflictHitsMarkdown,
    conflictMatrixExportSvg,
    controlMatrixSvg,
    corridorKpiCompareSvg,
    corridorNetworkPreviewSvg,
    criticalApproachBoardSvg,
    criticalApproachCsv,
    criticalApproachMarkdown,
    criticalYBoardSvg,
    criticalYCsv,
    criticalYMarkdown,
    cycleScanBoardSvg,
    cycleScanCsv,
    cycleScanMarkdown,
    cycleScanOption,
    designStartLoss,
    designTargetVc,
    downloadEchartsPng,
    downloadText,
    downloadVissimPack,
    dualRingBoardCsv,
    dualRingBoardMarkdown,
    engineeringPrintManifest,
    exportDxf,
    exportJsonFile,
    exportPng,
    exportProfessionalDiagrams,
    exportSvg,
    exportSvgFile,
    exportVissimCsvBundle,
    flow,
    flowDiagramStyle,
    flowDisplayMode,
    flowLtrOption,
    flowMovementDiagramSvg,
    flowOdReportCsv,
    flowOdReportMarkdown,
    focusPhaseId,
    fullOptimizeMarkdown,
    intergreenBoardSvg,
    intergreenCsv,
    intergreenMarkdown,
    kpisFromCompareRows,
    linkMultiCorridorOffsets,
    lostTimeBoardSvg,
    lostTimeCsv,
    lostTimeMarkdown,
    maxbandReportCsv,
    maxbandReportDiagramSvg,
    maxbandReportMarkdown,
    measureCorridor,
    mesh,
    multiBandMarkdown,
    multiCorridorLinkBoardSvg,
    multiCorridorLinkCsv,
    multiCorridorLinkMarkdown,
    multiCorridorReportCsv,
    multiCorridorReportMarkdown,
    offsetScanBoardSvg,
    offsetScanCsv,
    offsetScanMarkdown,
    openPrintPreview,
    optimizeDeltaMarkdown,
    overlapReviewCsv,
    overlapReviewMarkdown,
    overlapReviewSvg,
    pedTimingOptBoardSvg,
    pedTimingOptCsv,
    pedTimingOptMarkdown,
    pedestrianRingSvg,
    pedestrianTimingCsv,
    pedestrianTimingMarkdown,
    phaseNumberBoardMarkdown,
    phaseTimingOption,
    previewOptimize,
    printSheetHtml,
    professionalAnalysisPlanPackSvg,
    professionalCapacityMatrixSvg,
    professionalConflictBoardSvg,
    professionalCrossSectionSvg,
    professionalDualRingBoardSvg,
    professionalFlowReportSvg,
    professionalMultiCorridorReportSvg,
    professionalPedestrianBoardSvg,
    professionalPhaseNumberBoardSvg,
    professionalRightTurnBoardSvg,
    professionalRoundaboutPlanSvg,
    professionalTimeSpaceSvg,
    project,
    queueStorageBoardSvg,
    queueStorageCsv,
    queueTableMarkdown,
    rightTurnBoardCsv,
    rightTurnBoardMarkdown,
    roadgeeAnalysisPlanSvg,
    roadgeeFlowDiagramSvg,
    roadgeeSignalBoardSvg,
    roundaboutLayoutMarkdown,
    runFullSchemeOptimize,
    saturationKpiMarkdown,
    saveRtp,
    scanCorridorOffsets,
    scanCorridorSpeeds,
    scanCycleSensitivity,
    schemeDeltaMarkdown,
    schemeDeltas,
    schemeMetricsCompareSvg,
    schemeScorecardSvg,
    schemeTimingStripSvg,
    sectionReportCsv,
    sectionReportMarkdown,
    selected,
    signal,
    signalControlBoardSvg,
    signalTimingDiagramSvg,
    speedScanBoardSvg,
    speedScanCsv,
    speedScanMarkdown,
    storageCheckBoardSvg,
    storageCheckCsv,
    storageCheckMarkdown,
    theme,
    timeSpaceReportCsv,
    timeSpaceReportMarkdown,
    timingCompare,
    timingCompareBoardSvg,
    timingCompareCsv,
    timingCompareMarkdown,
    unsignalizedLegsCsv,
    unsignalizedMarkdown,
    unsignalizedPlanSvg,
    vcDelayOption,
    xsectionWidthOption,
  } = deps

  return {
          'project-rtp': () => saveRtp(),
          'mesh-png': () => exportPng(),
          'echarts-vc-delay-png': async () => {
            if (!analysis) return
            await downloadEchartsPng(`${project.name}-交互分析-vc延误.png`, vcDelayOption(analysis), {
              width: 960,
              height: 420,
            })
          },
          'echarts-flow-ltr-png': async () => {
            if (!channel || !flow) return
            await downloadEchartsPng(
              `${project.name}-流量LTR.png`,
              flowLtrOption(channel.approaches, flow, flowDisplayMode ?? 'natural'),
              { width: 960, height: 400 },
            )
          },
                    'echarts-band-png': async () => {
            const corridor = project.bandCorridor
            if (!corridor || corridor.nodes.length < 2) return
            const band = measureCorridor(corridor)
            await downloadEchartsPng(
              `${project.name}-绿波带宽.png`,
              bandBandwidthOption(corridor, band),
              { width: 1000, height: 400 },
            )
          },
                    'echarts-xsection-png': async () => {
            if (!selected) return
            const xs = buildCrossSection(selected)
            await downloadEchartsPng(
              `${project.name}-${selected.name}-断面宽度.png`,
              xsectionWidthOption(xs.components),
              { width: 960, height: 420 },
            )
          },
          'echarts-compare-png': async () => {
            const rows = collectCompareRows(project, analyzeIntersection).map((r) => ({
              label: `${r.channel}/${r.signal}`,
              avgVc: r.avgVc,
              avgDelay: r.avgDelay,
              los: r.los,
            }))
            if (!rows.length) return
            await downloadEchartsPng(`${project.name}-方案比选.png`, compareSchemesOption(rows), {
              width: 1000,
              height: 420,
            })
          },
                    'echarts-cycle-scan-png': async () => {
            if (!channel || !flow || !signal || signal.unsignalized) return
            const r = scanCycleSensitivity(channel.approaches, flow, signal, {
              minCycle: 50,
              maxCycle: 150,
              stepSec: 5,
            })
            await downloadEchartsPng(
              `${project.name}-周期敏感性.png`,
              cycleScanOption(
                r.points.map((p) => ({ c: p.cycleSec, delay: p.avgDelay, maxVc: p.maxVc })),
                signal.cycleSec,
              ),
              { width: 1000, height: 420 },
            )
          },
          'echarts-phase-timing-png': async () => {
            if (!signal) return
            await downloadEchartsPng(`${project.name}-相位GYAR.png`, phaseTimingOption(signal), {
              width: 900,
              height: 360,
            })
          },
          
          'intergreen-svg': () => {
            if (!channel || !signal) return
            exportSvgFile(
              `${project.name}-intergreen.svg`,
              intergreenBoardSvg(signal, channel.approaches, { width: 860 }),
            )
          },
          'intergreen-md': () => {
            if (!channel || !signal) return
            const rows = collectIntergreenRows(signal, channel.approaches)
            downloadText(`${project.name}-intergreen.md`, intergreenMarkdown(project.name, rows), 'text/markdown')
          },
          'intergreen-csv': () => {
            if (!channel || !signal) return
            const rows = collectIntergreenRows(signal, channel.approaches)
            downloadText(`${project.name}-intergreen.csv`, intergreenCsv(rows), 'text/csv')
          },
          'cycle-scan-svg': () => {
            if (!channel || !flow || !signal || signal.unsignalized) return
            const r = scanCycleSensitivity(channel.approaches, flow, signal, {
              minCycle: 50,
              maxCycle: 150,
              stepSec: 5,
            })
            exportSvgFile(
              `${project.name}-cycle-scan.svg`,
              cycleScanBoardSvg(channel.approaches, flow, signal, { width: 900, scan: r }),
            )
          },
          'cycle-scan-md': () => {
            if (!channel || !flow || !signal || signal.unsignalized) return
            const r = scanCycleSensitivity(channel.approaches, flow, signal, {
              minCycle: 50,
              maxCycle: 150,
              stepSec: 5,
            })
            downloadText(`${project.name}-cycle-scan.md`, cycleScanMarkdown(project.name, r), 'text/markdown')
          },
          'cycle-scan-csv': () => {
            if (!channel || !flow || !signal || signal.unsignalized) return
            const r = scanCycleSensitivity(channel.approaches, flow, signal, {
              minCycle: 50,
              maxCycle: 150,
              stepSec: 5,
            })
            downloadText(`${project.name}-cycle-scan.csv`, cycleScanCsv(r), 'text/csv')
          },
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
          'lost-time-board-svg': () => {
            if (!signal) return
            exportSvgFile(`${project.name}-损失时间L.svg`, lostTimeBoardSvg(signal, { width: 720 }))
          },
          'lost-time-md': () => {
            if (!signal) return
            downloadText(
              `${project.name}-损失时间L.md`,
              lostTimeMarkdown(project.name, signal),
              'text/markdown',
            )
          },
          'lost-time-csv': () => {
            if (!signal) return
            downloadText(`${project.name}-损失时间L.csv`, lostTimeCsv(signal), 'text/csv')
          },
          'ped-timing-opt-svg': () => {
            if (!channel || !signal) return
            exportSvgFile(
              `${project.name}-行人WalkFDW.svg`,
              pedTimingOptBoardSvg(signal, channel.approaches, { width: 800 }),
            )
          },
          'ped-timing-opt-md': () => {
            if (!channel || !signal) return
            downloadText(
              `${project.name}-行人WalkFDW.md`,
              pedTimingOptMarkdown(project.name, signal, channel.approaches),
              'text/markdown',
            )
          },
          'ped-timing-opt-csv': () => {
            if (!channel || !signal) return
            downloadText(
              `${project.name}-行人WalkFDW.csv`,
              pedTimingOptCsv(signal, channel.approaches),
              'text/csv',
            )
          },
          'timing-compare-board-svg': () => {
            if (!channel || !flow || !signal) return
            const rows =
              timingCompare.length > 0
                ? timingCompare
                : buildTimingCompareRows(channel.approaches, flow, signal)
            exportSvgFile(
              `${project.name}-配时方法比选.svg`,
              timingCompareBoardSvg(rows, { width: 880 }),
            )
          },
          'timing-compare-md': () => {
            if (!channel || !flow || !signal) return
            const rows =
              timingCompare.length > 0
                ? timingCompare
                : buildTimingCompareRows(channel.approaches, flow, signal)
            downloadText(
              `${project.name}-配时方法比选.md`,
              timingCompareMarkdown(project.name, rows),
              'text/markdown',
            )
          },
          'timing-compare-csv': () => {
            if (!channel || !flow || !signal) return
            const rows =
              timingCompare.length > 0
                ? timingCompare
                : buildTimingCompareRows(channel.approaches, flow, signal)
            downloadText(
              `${project.name}-配时方法比选.csv`,
              timingCompareCsv(rows),
              'text/csv',
            )
          },
          'overlap-review-svg': () => {
            if (!signal) return
            exportSvgFile(`${project.name}-搭接审查.svg`, overlapReviewSvg(signal, { width: 760 }))
          },
          'overlap-review-md': () => {
            if (!signal) return
            downloadText(
              `${project.name}-搭接审查.md`,
              overlapReviewMarkdown(project.name, signal),
              'text/markdown',
            )
          },
          'overlap-review-csv': () => {
            if (!signal) return
            downloadText(
              `${project.name}-搭接审查.csv`,
              overlapReviewCsv(signal),
              'text/csv',
            )
          },
          'critical-y-board-svg': () => {
            if (!channel || !flow || !signal) return
            exportSvgFile(
              `${project.name}-Y分解.svg`,
              criticalYBoardSvg(channel.approaches, flow, signal, { width: 720 }),
            )
          },
          'critical-y-md': () => {
            if (!channel || !flow || !signal) return
            downloadText(
              `${project.name}-Y分解.md`,
              criticalYMarkdown(project.name, channel.approaches, flow, signal),
              'text/markdown',
            )
          },
          'critical-y-csv': () => {
            if (!channel || !flow || !signal) return
            downloadText(
              `${project.name}-Y分解.csv`,
              criticalYCsv(channel.approaches, flow, signal),
              'text/csv',
            )
          },
          'multi-corridor-link-svg': () => {
            const list = project.bandCorridors?.length
              ? project.bandCorridors
              : project.bandCorridor
                ? [project.bandCorridor]
                : []
            if (!list.length) return
            const r = linkMultiCorridorOffsets(list, 'progressive')
            exportSvgFile(
              `${project.name}-多走廊联动.svg`,
              multiCorridorLinkBoardSvg(r, { width: 860 }),
            )
          },
          'multi-corridor-link-md': () => {
            const list = project.bandCorridors?.length
              ? project.bandCorridors
              : project.bandCorridor
                ? [project.bandCorridor]
                : []
            if (!list.length) return
            const r = linkMultiCorridorOffsets(list, 'progressive')
            downloadText(
              `${project.name}-多走廊联动.md`,
              multiCorridorLinkMarkdown(project.name, r),
              'text/markdown',
            )
          },
          'multi-corridor-link-csv': () => {
            const list = project.bandCorridors?.length
              ? project.bandCorridors
              : project.bandCorridor
                ? [project.bandCorridor]
                : []
            if (!list.length) return
            const r = linkMultiCorridorOffsets(list, 'progressive')
            downloadText(
              `${project.name}-多走廊联动.csv`,
              multiCorridorLinkCsv(r),
              'text/csv',
            )
          },
          'speed-scan-svg': () => {
            const c = project.bandCorridor
            if (!c) return
            exportSvgFile(
              `${project.name}-速度敏感性.svg`,
              speedScanBoardSvg(c, { width: 900, height: 300 }),
            )
          },
          'speed-scan-md': () => {
            const c = project.bandCorridor
            if (!c) return
            const scan = scanCorridorSpeeds(c)
            downloadText(
              `${project.name}-速度敏感性.md`,
              speedScanMarkdown(project.name, c.name, scan),
              'text/markdown',
            )
          },
          'speed-scan-csv': () => {
            const c = project.bandCorridor
            if (!c) return
            downloadText(
              `${project.name}-速度敏感性.csv`,
              speedScanCsv(scanCorridorSpeeds(c)),
              'text/csv',
            )
          },
          'offset-scan-svg': () => {
            const c = project.bandCorridor
            if (!c) return
            exportSvgFile(
              `${project.name}-相位差扫描.svg`,
              offsetScanBoardSvg(c, { width: 900, height: 300 }),
            )
          },
          'offset-scan-md': () => {
            const c = project.bandCorridor
            if (!c) return
            const scan = scanCorridorOffsets(c)
            downloadText(
              `${project.name}-相位差扫描.md`,
              offsetScanMarkdown(project.name, c.name, scan),
              'text/markdown',
            )
          },
          'offset-scan-csv': () => {
            const c = project.bandCorridor
            if (!c) return
            downloadText(
              `${project.name}-相位差扫描.csv`,
              offsetScanCsv(scanCorridorOffsets(c)),
              'text/csv',
            )
          },
          'critical-approach-svg': () => {
            if (!channel || !flow || !signal || !analysis) return
            exportSvgFile(
              `${project.name}-关键进口.svg`,
              criticalApproachBoardSvg(channel.approaches, flow, signal, analysis, { width: 720 }),
            )
          },
          'critical-approach-md': () => {
            if (!channel || !flow || !signal || !analysis) return
            downloadText(
              `${project.name}-关键进口.md`,
              criticalApproachMarkdown(project.name, channel.approaches, flow, signal, analysis),
              'text/markdown',
            )
          },
          'critical-approach-csv': () => {
            if (!analysis) return
            downloadText(
              `${project.name}-关键进口.csv`,
              criticalApproachCsv(analysis),
              'text/csv',
            )
          },
          'storage-check-svg': () => {
            if (!channel || !signal || !analysis) return
            exportSvgFile(
              `${project.name}-进口道储存校核.svg`,
              storageCheckBoardSvg(channel.approaches, signal, analysis, { width: 860 }),
            )
          },
          'storage-check-md': () => {
            if (!channel || !signal || !analysis) return
            downloadText(
              `${project.name}-进口道储存校核.md`,
              storageCheckMarkdown(
                project.name,
                collectStorageCheckRows(channel.approaches, signal, analysis),
              ),
              'text/markdown',
            )
          },
          'storage-check-csv': () => {
            if (!channel || !signal || !analysis) return
            downloadText(
              `${project.name}-进口道储存校核.csv`,
              storageCheckCsv(collectStorageCheckRows(channel.approaches, signal, analysis)),
              'text/csv',
            )
          },
          'queue-storage-svg': () => {
            if (!channel || !signal || !analysis) return
            exportSvgFile(
              `${project.name}-排队储存.svg`,
              queueStorageBoardSvg(
                collectQueueStorageRows(channel.approaches, signal, analysis),
                { width: 800 },
              ),
            )
          },
          'queue-storage-md': () => {
            if (!channel || !signal || !analysis) return
            const rows = collectQueueStorageRows(channel.approaches, signal, analysis)
            downloadText(
              `${project.name}-排队储存.md`,
              queueTableMarkdown(project.name, rows),
              'text/markdown',
            )
          },
          'queue-storage-csv': () => {
            if (!channel || !signal || !analysis) return
            downloadText(
              `${project.name}-排队储存.csv`,
              queueStorageCsv(collectQueueStorageRows(channel.approaches, signal, analysis)),
              'text/csv',
            )
          },
          'full-scheme-optimize-md': () => {
            const r =
              typeof applyFullSchemeOptimize === 'function'
                ? applyFullSchemeOptimize()
                : null
            if (!r) {
              if (!channel || !flow || !signal) return
              const rr = runFullSchemeOptimize(
                channel.approaches,
                flow,
                signal,
                project.bandCorridors?.length ? project.bandCorridors : [project.bandCorridor],
                project.activeBandId,
              )
              downloadText(
                `${project.name}-一键全方案优化.md`,
                fullOptimizeMarkdown(project.name, rr),
                'text/markdown',
              )
              return
            }
            downloadText(
              `${project.name}-一键全方案优化.md`,
              fullOptimizeMarkdown(project.name, r),
              'text/markdown',
            )
          },
          'clean-channel-svg': () => {
            if (!channel) return
            exportSvgFile(`${project.name}-渠化净图.svg`, cleanChannelPlanSvg(channel))
          },
          'clean-flow-svg': () => {
            if (!channel || !flow) return
            exportSvgFile(
              `${project.name}-流向净图.svg`,
              cleanFlowDiagramSvg(channel.approaches, flow),
            )
          },
          'clean-analysis-svg': () => {
            if (!channel || !analysis) return
            exportSvgFile(
              `${project.name}-评价净图.svg`,
              cleanAnalysisPlanSvg(channel.approaches, analysis, 'los'),
            )
          },
          'clean-timespace-svg': () => {
            exportSvgFile(
              `${project.name}-时距净图.svg`,
              cleanTimeSpaceSvg(project.bandCorridor, band),
            )
          },
          'clean-timing-svg': () => {
            if (!signal) return
            exportSvgFile(`${project.name}-配时净图.svg`, cleanSignalTimingSvg(signal))
          },
          'clean-network-svg': () => {
            exportSvgFile(
              `${project.name}-路网净图.svg`,
              cleanCorridorNetworkSvg(project.bandCorridor, band),
            )
          },
          'multi-corridor-report-svg': () => {
            const list = project.bandCorridors?.length
              ? project.bandCorridors
              : [project.bandCorridor]
            exportSvgFile(
              `${project.name}-多走廊报告.svg`,
              professionalMultiCorridorReportSvg(list, {
                width: 1000,
                projectName: project.name,
              }),
            )
          },
          'multi-corridor-report-md': () => {
            const list = project.bandCorridors?.length
              ? project.bandCorridors
              : [project.bandCorridor]
            downloadText(
              `${project.name}-多走廊报告.md`,
              multiCorridorReportMarkdown(project.name, list),
              'text/markdown',
            )
          },
          'multi-corridor-report-csv': () => {
            const list = project.bandCorridors?.length
              ? project.bandCorridors
              : [project.bandCorridor]
            downloadText(
              `${project.name}-多走廊报告.csv`,
              multiCorridorReportCsv(list),
              'text/csv',
            )
          },
          'phase-number-board-svg': () => {
            if (!signal) return
            exportSvgFile(
              `${project.name}-相位序号图.svg`,
              professionalPhaseNumberBoardSvg(signal, channel?.approaches ?? [], {
                width: 900,
                projectName: project.name,
              }),
            )
          },
          'phase-number-board-md': () => {
            if (!signal) return
            downloadText(
              `${project.name}-相位序号.md`,
              phaseNumberBoardMarkdown(project.name, signal),
              'text/markdown',
            )
          },
          'right-turn-review-svg': () => {
            if (!channel) return
            exportSvgFile(
              `${project.name}-右转审查.svg`,
              professionalRightTurnBoardSvg(channel, {
                width: 900,
                projectName: project.name,
              }),
            )
          },
          'right-turn-review-md': () => {
            if (!channel) return
            downloadText(
              `${project.name}-右转审查.md`,
              rightTurnBoardMarkdown(project.name, channel),
              'text/markdown',
            )
          },
          'right-turn-review-csv': () => {
            if (!channel) return
            downloadText(
              `${project.name}-右转审查.csv`,
              rightTurnBoardCsv(channel),
              'text/csv',
            )
          },
          'capacity-matrix-svg': () => {
            if (!analysis || !channel) return
            exportSvgFile(
              `${project.name}-通行能力矩阵.svg`,
              professionalCapacityMatrixSvg(channel.approaches, analysis, {
                width: 920,
                projectName: project.name,
                signalName: signal?.name,
              }),
            )
          },
          'capacity-matrix-md': () => {
            if (!analysis) return
            downloadText(
              `${project.name}-通行能力.md`,
              capacityMatrixMarkdown(project.name, analysis),
              'text/markdown',
            )
          },
          'capacity-matrix-csv': () => {
            if (!analysis) return
            downloadText(`${project.name}-通行能力.csv`, capacityMatrixCsv(analysis), 'text/csv')
          },
          'engineering-print-a4': () => {
            if (!channel) return
            const panels = collectEngineeringPrintPanels({
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
            const sheet = buildA4PrintSheet(panels, {
              projectName: project.name,
              schemeName: channel.name,
              paper: 'A4-landscape',
              footerNote: '渠化图框+配时+管控+流向 · 示意非测绘',
            })
            downloadText(`${project.name}-工程拼版.svg`, sheet, 'image/svg+xml')
            downloadText(
              `${project.name}-工程拼版.html`,
              printSheetHtml(sheet, `${project.name}-工程拼版`),
              'text/html',
            )
            downloadText(
              `${project.name}-工程拼版.md`,
              engineeringPrintManifest(project.name, panels),
              'text/markdown',
            )
          },
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
          'channel-draft-svg': () => {
            if (!channel) return
            downloadText(
              `${project.name}-渠化出图.svg`,
              buildChannelDraftSheet(project, channel, mesh, {
                projectName: project.name,
                paper: channel.display.paperSize === 'A4' ? 'A4-landscape' : 'A3-landscape',
              }),
              'image/svg+xml',
            )
          },
          'channel-draft-md': () => {
            if (!channel) return
            downloadText(
              `${project.name}-渠化出图.md`,
              channelDraftMarkdown(project, channel),
              'text/markdown',
            )
          },
          'dual-ring-board-svg': () => {
            if (!signal) return
            exportSvgFile(
              `${project.name}-双环审查看板.svg`,
              professionalDualRingBoardSvg(signal, { width: 960, projectName: project.name }),
            )
          },
          'dual-ring-board-md': () => {
            if (!signal) return
            downloadText(
              `${project.name}-双环.md`,
              dualRingBoardMarkdown(project.name, signal),
              'text/markdown',
            )
          },
          'dual-ring-board-csv': () => {
            if (!signal) return
            downloadText(`${project.name}-双环.csv`, dualRingBoardCsv(signal), 'text/csv')
          },
          'ped-board-svg': () => {
            if (!channel || !signal) return
            exportSvgFile(
              `${project.name}-行人审查看板.svg`,
              professionalPedestrianBoardSvg(channel.approaches, signal, {
                focusPhaseId: focusPhaseId,
                projectName: project.name,
                width: 960,
              }),
            )
          },
          'ped-timing-md': () => {
            if (!channel || !signal) return
            downloadText(
              `${project.name}-行人配时.md`,
              pedestrianTimingMarkdown(project.name, channel.approaches, signal),
              'text/markdown',
            )
          },
          'ped-timing-csv': () => {
            if (!channel || !signal) return
            downloadText(
              `${project.name}-行人配时.csv`,
              pedestrianTimingCsv(channel.approaches, signal),
              'text/csv',
            )
          },
          'roundabout-plan-svg': () => {
            if (!channel) return
            exportSvgFile(
              `${project.name}-环岛布局.svg`,
              professionalRoundaboutPlanSvg(channel.approaches, {
                size: 720,
                projectName: project.name,
              }),
            )
          },
          'roundabout-plan-md': () => {
            if (!channel) return
            downloadText(
              `${project.name}-环岛布局.md`,
              roundaboutLayoutMarkdown(project.name, channel.approaches),
              'text/markdown',
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
  }
}
