/**
 * Green-wave standalone page (RoadGee-style separate workspace).
 * Full-width: corridor list | map + timespace | KPI / tables.
 * Opened when EditorMode === 'band' — replaces the 3-pane intersection shell.
 */
import { useMemo, useState } from 'react'
import type { BandCorridor, BandResult, Project } from '@/domain/types'
import { BandCorridorSidebar } from '@/ui/layout/BandCorridorSidebar'
import { BandCharts, CorridorCompareCharts } from '@/ui/charts/ChartPanels'
import { TimeSpacePanel } from '@/ui/charts/ProfessionalPanels'
import { InteractiveTimeSpace, buildTimeSpaceExportSvg } from '@/ui/charts/InteractiveTimeSpace'
import { collectCorridorKpis, corridorKpiCompareSvg, multiBandMarkdown } from '@/ui/charts/bandCorridorCompare'
import { corridorMapSvg } from '@/ui/charts/corridorMap'
import { exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'
import { corridorSegments } from '@/domain/analysis/corridor'

export type BandPageProps = {
  project: Project
  band: BandResult
  theme: 'dark' | 'light'
  onBackToIntersection: () => void
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

type BandTab = 'map' | 'timespace' | 'nodes' | 'compare'

export function BandPage(props: BandPageProps) {
  const {
    project,
    band,
    theme,
    onBackToIntersection,
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
  } = props
  const [batchNote, setBatchNote] = useState<string | null>(null)
  const [tab, setTab] = useState<BandTab>('timespace')
  const corridor = project.bandCorridor
  const corridors = project.bandCorridors ?? [corridor]
  const segs = useMemo(() => corridorSegments(corridor), [corridor])

  const mapSvg = useMemo(
    () =>
      corridorMapSvg(corridor, {
        width: 640,
        height: 280,
        bandwidthRatio: band.bandwidthRatio,
      }),
    [corridor, band.bandwidthRatio],
  )

  return (
    <div className="band-page" data-theme={theme}>
      <header className="band-page-bar">
        <div className="band-page-bar-left">
          <button type="button" className="ghost" onClick={onBackToIntersection}>
            ← 交叉口设计
          </button>
          <div className="band-page-title">
            <strong>干道绿波</strong>
            <span className="hint">{corridor.name}</span>
          </div>
        </div>
        <div className="band-page-tabs" role="tablist" aria-label="绿波视图">
          {(
            [
              ['timespace', '时距图'],
              ['map', '走廊图'],
              ['nodes', '节点表'],
              ['compare', '多走廊对比'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="band-page-bar-right">
          <button
            type="button"
            className="primary"
            onClick={() => {
              optimizeBand()
              setBatchNote(null)
            }}
          >
            优化当前
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              const r = optimizeAllBands()
              setBatchNote(`批量 ${r.count} 条 · 未降带宽 ${r.improved}`)
            }}
          >
            批量优化
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              const md = [
                `# ${project.name} · ${corridor.name}`,
                '',
                `- 方法：${band.method}`,
                `- 带宽比 ${(band.bandwidthRatio * 100).toFixed(1)}% · b=${band.bandwidthSec.toFixed(1)}s`,
                `- 上行 ${band.forwardBandwidthSec?.toFixed(1) ?? '—'}s · 下行 ${band.backwardBandwidthSec?.toFixed(1) ?? '—'}s`,
                `- 速度 ${band.standardSpeedKmh} km/h · 节点 ${corridor.nodes.length}`,
              ].join('\n')
              downloadText(`${project.name}-band.md`, md, 'text/markdown')
            }}
          >
            导出 MD
          </button>
        </div>
      </header>

      <div className="band-page-body">
        <aside className="band-page-side">
          <BandCorridorSidebar
            corridors={corridors}
            activeId={project.activeBandId ?? corridor.id}
            onSelect={(id) => setActiveBand(id)}
            onAdd={() => {
              addBandCorridor()
              setBatchNote(null)
            }}
            onDuplicate={() => {
              duplicateBandCorridor()
              setBatchNote(null)
            }}
            onRemove={(id) => {
              removeBandCorridor(id)
              setBatchNote(null)
            }}
            onOptimizeAll={() => {
              const r = optimizeAllBands()
              setBatchNote(`批量 ${r.count} 条 · 未降带宽 ${r.improved}`)
            }}
            batchNote={batchNote}
          />
          <div className="band-page-params card">
            <div className="section-title">当前走廊</div>
            <label>
              名称
              <input
                value={corridor.name}
                onChange={(e) => renameBandCorridor(corridor.id, e.target.value)}
              />
            </label>
            <label>
              速度 km/h
              <input
                type="number"
                value={corridor.speedKmh}
                onChange={(e) => updateBand({ speedKmh: Number(e.target.value) })}
              />
            </label>
            <label>
              方法
              <select
                value={corridor.method}
                onChange={(e) =>
                  updateBand({ method: e.target.value as typeof corridor.method })
                }
              >
                <option value="classic">经典数解</option>
                <option value="two-way-equal">双向等带宽</option>
                <option value="optimized-scan">优化扫描</option>
                <option value="graphical">图解法</option>
                <option value="one-way">单向</option>
                <option value="maxband-discrete">MAXBAND 离散</option>
              </select>
            </label>
            <div className="metric-grid band-kpi" style={{ marginTop: 8 }}>
              <div className="metric">
                <div className="label">带宽比</div>
                <div className="value">{(band.bandwidthRatio * 100).toFixed(1)}%</div>
              </div>
              <div className="metric">
                <div className="label">上行 b</div>
                <div className="value">{(band.forwardBandwidthSec ?? band.bandwidthSec).toFixed(1)}s</div>
              </div>
              <div className="metric">
                <div className="label">下行 b</div>
                <div className="value">{(band.backwardBandwidthSec ?? 0).toFixed(1)}s</div>
              </div>
              <div className="metric">
                <div className="label">节点</div>
                <div className="value">{corridor.nodes.length}</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="band-page-main">
          {tab === 'map' && (
            <div className="card band-pane">
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>走廊示意</h2>
                <span className="hint">多路口串联 · 非测绘底图</span>
              </div>
              <div
                className="chart-svg-host chart-svg-host--pro"
                dangerouslySetInnerHTML={{ __html: mapSvg }}
              />
            </div>
          )}

          {tab === 'timespace' && (
            <div className="card band-pane">
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>时距图</h2>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    const svg = buildTimeSpaceExportSvg(corridor, band, theme)
                    exportSvgFile(`${project.name}-timespace.svg`, svg)
                  }}
                >
                  导出时距 SVG
                </button>
              </div>
              <InteractiveTimeSpace corridor={corridor} result={band} />
              <TimeSpacePanel corridor={corridor} />
              <BandCharts corridor={corridor} />
            </div>
          )}

          {tab === 'nodes' && (
            <div className="card band-pane">
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>节点 / 路段</h2>
                <button type="button" className="primary" onClick={addBandNode}>
                  添加节点
                </button>
              </div>
              <div className="table-wrap band-node-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>名称</th>
                      <th>桩号 m</th>
                      <th>绿信比</th>
                      <th>相位差 s</th>
                      <th>锁定</th>
                      <th>lat</th>
                      <th>lon</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {corridor.nodes.map((n) => (
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
                            onChange={(e) =>
                              updateBandNode(n.id, { distanceM: Number(e.target.value) })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step={0.05}
                            value={n.greenRatio}
                            onChange={(e) =>
                              updateBandNode(n.id, { greenRatio: Number(e.target.value) })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={n.offsetSec}
                            onChange={(e) =>
                              updateBandNode(n.id, { offsetSec: Number(e.target.value) })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!n.lockedOffset}
                            onChange={(e) =>
                              updateBandNode(n.id, { lockedOffset: e.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step={0.0001}
                            value={n.lat ?? ''}
                            onChange={(e) => {
                              const v = e.target.value
                              updateBandNode(n.id, {
                                lat: v === '' ? undefined : Number(v),
                              })
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step={0.0001}
                            value={n.lon ?? ''}
                            onChange={(e) => {
                              const v = e.target.value
                              updateBandNode(n.id, {
                                lon: v === '' ? undefined : Number(v),
                              })
                            }}
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
              </div>
              {segs.length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: 12 }}>
                    路段长度
                  </div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>区间</th>
                          <th>长度 m</th>
                        </tr>
                      </thead>
                      <tbody>
                        {segs.map((s) => (
                          <tr key={s.toId}>
                            <td>
                              {s.fromName} → {s.toName}
                            </td>
                            <td>
                              <input
                                type="number"
                                value={s.lengthM}
                                onChange={(e) =>
                                  setBandSegmentLength(s.toId, Number(e.target.value))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'compare' && (
            <div className="card band-pane">
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>多走廊对比</h2>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    const kpis = collectCorridorKpis(corridors)
                    exportSvgFile(
                      `${project.name}-band-compare.svg`,
                      corridorKpiCompareSvg(kpis),
                    )
                    downloadText(
                      `${project.name}-band-multi.md`,
                      multiBandMarkdown(project.name, kpis),
                      'text/markdown',
                    )
                  }}
                >
                  导出对比
                </button>
              </div>
              <CorridorCompareCharts corridors={corridors} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
