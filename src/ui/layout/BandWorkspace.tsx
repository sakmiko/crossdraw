/**
 * Green-band workspace — multi-corridor sidebar, node table, timespace charts.
 * Extracted from App (v0.5.41).
 */
import { useState } from 'react'
import type { BandCorridor, BandResult, Project } from '@/domain/types'
import { corridorSegments } from '@/domain/analysis/corridor'
import { BandCorridorSidebar } from '@/ui/layout/BandCorridorSidebar'
import { BandCharts, CorridorCompareCharts } from '@/ui/charts/ChartPanels'
import { TimeSpacePanel } from '@/ui/charts/ProfessionalPanels'
import { InteractiveTimeSpace, buildTimeSpaceExportSvg } from '@/ui/charts/InteractiveTimeSpace'
import { collectCorridorKpis, corridorKpiCompareSvg, multiBandMarkdown } from '@/ui/charts/bandCorridorCompare'
import { corridorMapSvg } from '@/ui/charts/corridorMap'
import { bandMarkdown, exportJsonFile, exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'

export type BandWorkspaceProps = {
  project: Project
  band: BandResult
  theme: 'dark' | 'light'
  updateBand: (patch: Partial<BandCorridor>) => void
  updateBandNode: (id: string, patch: Partial<BandCorridor['nodes'][0]>) => void
  addBandNode: () => void
  removeBandNode: (id: string) => void
  optimizeBand: () => void
  optimizeAllBands: () => { count: number; improved: number }
  setBandSegmentLength: (toNodeId: string, lengthM: number) => void
  setActiveBand: (id: string) => void
  addBandCorridor: () => void
  duplicateBandCorridor: () => void
  removeBandCorridor: (id: string) => void
  renameBandCorridor: (id: string, name: string) => void
}

export function BandWorkspace({
  project,
  band,
  theme,
  updateBand,
  updateBandNode,
  addBandNode,
  removeBandNode,
  optimizeBand,
  optimizeAllBands,
  setBandSegmentLength,
  setActiveBand,
  addBandCorridor,
  duplicateBandCorridor,
  removeBandCorridor,
  renameBandCorridor,
}: BandWorkspaceProps) {
  const [bandBatchNote, setBandBatchNote] = useState<string | null>(null)

  return (
<div className="card" style={{ marginTop: 12 }}>
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>干道绿波 · {project.bandCorridor.name}</h2>
                <span className="hint">{(project.bandCorridors ?? [project.bandCorridor]).length} 条走廊</span>
              </div>
              <div className="band-workspace-grid">
                <BandCorridorSidebar
                  corridors={project.bandCorridors ?? [project.bandCorridor]}
                  activeId={project.activeBandId ?? project.bandCorridor.id}
                  onSelect={(id) => setActiveBand(id)}
                  onAdd={() => {
                    addBandCorridor()
                    setBandBatchNote(null)
                  }}
                  onDuplicate={() => {
                    duplicateBandCorridor()
                    setBandBatchNote(null)
                  }}
                  onRemove={(id) => {
                    removeBandCorridor(id)
                    setBandBatchNote(null)
                  }}
                  onOptimizeAll={() => {
                    const r = optimizeAllBands()
                    setBandBatchNote(`已批量优化 ${r.count} 条走廊（带宽未降 ${r.improved}/${r.count}）`)
                  }}
                  batchNote={bandBatchNote}
                />
                <div className="band-corridor-main">
              <label>
                走廊名称
                <input
                  value={project.bandCorridor.name}
                  onChange={(e) => renameBandCorridor(project.bandCorridor.id, e.target.value)}
                />
              </label>
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
                    <option value="maxband-discrete">MAXBAND 离散搜索</option>
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
              <div
                className="chart-svg-host chart-svg-host--pro"
                style={{ marginTop: 10 }}
                dangerouslySetInnerHTML={{
                  __html: corridorMapSvg(project.bandCorridor, {
                    bandwidthRatio: band.bandwidthRatio,
                  }),
                }}
              />

              <table className="table">
                <thead>
                  <tr>
                    <th>路口</th>
                    <th>桩号m</th>
                    <th>λ</th>
                    <th>C</th>
                    <th>相位差 o(s)</th>
                    <th>锁定</th>
                    <th>纬度</th>
                    <th>经度</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {project.bandCorridor.nodes.map((n) => (
                    <tr key={n.id} className={n.lockedOffset ? 'row-locked' : undefined}>
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
                          min={0.05}
                          max={0.95}
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
                      <td>
                        <input
                          type="number"
                          step={0.1}
                          value={Number(n.offsetSec.toFixed(1))}
                          disabled={false}
                          title={n.lockedOffset ? '已锁定：优化时保留' : '可手动改；勾选锁定后优化不覆盖'}
                          onChange={(e) =>
                            updateBandNode(n.id, { offsetSec: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <label className="lock-check" title="锁定后「优化相位差」不覆盖该路口">
                          <input
                            type="checkbox"
                            checked={!!n.lockedOffset}
                            onChange={(e) => updateBandNode(n.id, { lockedOffset: e.target.checked })}
                          />
                          <span>{n.lockedOffset ? '锁' : '—'}</span>
                        </label>
                      </td>
                      <td>
                        <input
                          type="number"
                          step={0.0001}
                          placeholder="lat"
                          value={n.lat ?? ''}
                          onChange={(e) =>
                            updateBandNode(n.id, {
                              lat: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step={0.0001}
                          placeholder="lon"
                          value={n.lon ?? ''}
                          onChange={(e) =>
                            updateBandNode(n.id, {
                              lon: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <button type="button" className="ghost" onClick={() => removeBandNode(n.id)}>
                          删
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="hint">
                锁定的相位差在优化时保留；KPI/时距图始终按<strong>当前表内相位差</strong>用圆环弧度量重算（与图同源）。
                已锁 {project.bandCorridor.nodes.filter((n) => n.lockedOffset).length} 个路口。
              </p>
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
                  优化相位差（保留锁定）
                </button>
                <button
                  type="button"
                  onClick={() => {
                    for (const n of project.bandCorridor.nodes) {
                      if (n.lockedOffset) updateBandNode(n.id, { lockedOffset: false })
                    }
                  }}
                >
                  解除全部锁定
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
              <CorridorCompareCharts corridors={project.bandCorridors ?? [project.bandCorridor]} />
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const rows = collectCorridorKpis(project.bandCorridors ?? [project.bandCorridor])
                    exportSvgFile(`${project.name}-band-multi.svg`, corridorKpiCompareSvg(rows))
                    exportJsonFile(`${project.name}-band-multi.json`, { corridors: project.bandCorridors, kpis: rows })
                    downloadText(`${project.name}-band-multi.md`, multiBandMarkdown(project.name, rows), 'text/markdown')
                  }}
                >
                  导出多走廊对比
                </button>
              </div>
              <p className="hint">时距图悬停显示 λ、相位差、路段长度、行程时间；数据写入 .rtp。</p>
                </div>
              </div>
            </div>
  )
}
