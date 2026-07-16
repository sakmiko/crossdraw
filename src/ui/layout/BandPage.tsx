/**
 * Green-wave standalone page — multi-intersection corridor editor.
 * Default view: compact node parameter table + live KPI (RoadGee-style).
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

type BandTab = 'table' | 'timespace' | 'map' | 'compare'

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
  const [tab, setTab] = useState<BandTab>('table')
  const corridor = project.bandCorridor
  const corridors = project.bandCorridors ?? [corridor]
  const segs = useMemo(() => corridorSegments(corridor), [corridor])
  const sortedNodes = useMemo(
    () => [...corridor.nodes].sort((a, b) => a.distanceM - b.distanceM),
    [corridor.nodes],
  )

  const mapSvg = useMemo(
    () =>
      corridorMapSvg(corridor, {
        width: 720,
        height: 260,
        bandwidthRatio: band.bandwidthRatio,
      }),
    [corridor, band.bandwidthRatio],
  )

  const C = sortedNodes[0]?.cycleSec ?? 90
  const lockedN = corridor.nodes.filter((n) => n.lockedOffset).length

  return (
    <div className="band-page" data-theme={theme}>
      <header className="band-page-bar">
        <div className="band-page-bar-left">
          <button type="button" className="ghost" onClick={onBackToIntersection}>
            ← 交叉口
          </button>
          <div className="band-page-title">
            <strong>干道绿波</strong>
            <span className="hint">{corridor.name}</span>
          </div>
        </div>
        <div className="band-page-tabs" role="tablist" aria-label="绿波视图">
          {(
            [
              ['table', '路口参数表'],
              ['timespace', '时距图'],
              ['map', '走廊图'],
              ['compare', '多走廊'],
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
            优化
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              const r = optimizeAllBands()
              setBatchNote(`${r.improved}/${r.count}`)
            }}
          >
            批量
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              const md = [
                `# ${project.name} · ${corridor.name}`,
                `- 方法 ${band.method} · 带宽比 ${(band.bandwidthRatio * 100).toFixed(1)}%`,
                `- b↑ ${(band.forwardBandwidthSec ?? band.bandwidthSec).toFixed(1)}s · b↓ ${(band.backwardBandwidthSec ?? 0).toFixed(1)}s`,
              ].join('\n')
              downloadText(`${project.name}-band.md`, md, 'text/markdown')
            }}
          >
            导出
          </button>
        </div>
      </header>

      {/* live KPI strip — always visible, numbers first */}
      <div className="band-kpi-strip" aria-label="绿波实时指标">
        <div className="bkpi">
          <span className="bkpi-l">带宽比</span>
          <span className="bkpi-v">{(band.bandwidthRatio * 100).toFixed(1)}%</span>
        </div>
        <div className="bkpi">
          <span className="bkpi-l">上行 b</span>
          <span className="bkpi-v">{(band.forwardBandwidthSec ?? band.bandwidthSec).toFixed(1)}<small>s</small></span>
        </div>
        <div className="bkpi">
          <span className="bkpi-l">下行 b</span>
          <span className="bkpi-v">{(band.backwardBandwidthSec ?? 0).toFixed(1)}<small>s</small></span>
        </div>
        <div className="bkpi">
          <span className="bkpi-l">带速</span>
          <span className="bkpi-v">{band.standardSpeedKmh.toFixed(0)}<small>km/h</small></span>
        </div>
        <div className="bkpi">
          <span className="bkpi-l">C</span>
          <span className="bkpi-v">{C}<small>s</small></span>
        </div>
        <div className="bkpi">
          <span className="bkpi-l">路口</span>
          <span className="bkpi-v">{corridor.nodes.length}</span>
        </div>
        {batchNote && (
          <div className="bkpi bkpi-note">
            <span className="bkpi-l">批量</span>
            <span className="bkpi-v">{batchNote}</span>
          </div>
        )}
      </div>

      <div className="band-page-body">
        <aside className="band-page-side compact">
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
              setBatchNote(`${r.improved}/${r.count}`)
            }}
            batchNote={null}
          />
          <div className="band-page-params card compact-card">
            <div className="field-row-2">
              <label>
                名称
                <input
                  value={corridor.name}
                  onChange={(e) => renameBandCorridor(corridor.id, e.target.value)}
                />
              </label>
              <label>
                V km/h
                <input
                  type="number"
                  value={corridor.speedKmh}
                  onChange={(e) => updateBand({ speedKmh: Number(e.target.value) })}
                />
              </label>
            </div>
            <label>
              方法
              <select
                value={corridor.method}
                onChange={(e) => updateBand({ method: e.target.value as typeof corridor.method })}
              >
                <option value="classic">经典数解</option>
                <option value="two-way-equal">双向等带宽</option>
                <option value="optimized-scan">优化扫描</option>
                <option value="graphical">图解法</option>
                <option value="one-way">单向</option>
                <option value="maxband-discrete">MAXBAND 离散</option>
              </select>
            </label>
          </div>
        </aside>

        <main className="band-page-main">
          {tab === 'table' && (
            <div className="card band-pane compact-card">
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>路口参数表</h2>
                <div className="panel-header-meta">
                  <span className="subpanel-tag">锁 {lockedN}</span>
                  <button type="button" className="primary" onClick={addBandNode}>
                    + 路口
                  </button>
                </div>
              </div>
              <div className="table-wrap band-node-table band-node-table--dense">
                <table className="table table-dense">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>路口名称</th>
                      <th>桩号 m</th>
                      <th>路段 m</th>
                      <th>λ 绿信比</th>
                      <th>C s</th>
                      <th>相位差 s</th>
                      <th>锁</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedNodes.map((n, idx) => {
                      const prev = idx > 0 ? sortedNodes[idx - 1] : null
                      const segLen = prev ? n.distanceM - prev.distanceM : 0
                      return (
                        <tr key={n.id}>
                          <td className="num">{idx + 1}</td>
                          <td>
                            <input
                              value={n.name}
                              onChange={(e) => updateBandNode(n.id, { name: e.target.value })}
                              aria-label={`路口${idx + 1}名称`}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="num"
                              value={Number(n.distanceM.toFixed(0))}
                              onChange={(e) =>
                                updateBandNode(n.id, { distanceM: Number(e.target.value) })
                              }
                              aria-label="桩号"
                            />
                          </td>
                          <td>
                            {idx === 0 ? (
                              <span className="muted-cell">—</span>
                            ) : (
                              <input
                                type="number"
                                className="num"
                                min={50}
                                value={Math.round(segLen)}
                                onChange={(e) =>
                                  setBandSegmentLength(n.id, Number(e.target.value))
                                }
                                aria-label="路段长度"
                              />
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              className="num"
                              step={0.05}
                              min={0.1}
                              max={0.95}
                              value={Number(n.greenRatio.toFixed(2))}
                              onChange={(e) =>
                                updateBandNode(n.id, { greenRatio: Number(e.target.value) })
                              }
                              aria-label="绿信比"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="num"
                              min={40}
                              max={200}
                              value={n.cycleSec}
                              onChange={(e) =>
                                updateBandNode(n.id, { cycleSec: Number(e.target.value) })
                              }
                              aria-label="周期"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="num"
                              step={0.1}
                              value={Number(n.offsetSec.toFixed(1))}
                              onChange={(e) =>
                                updateBandNode(n.id, { offsetSec: Number(e.target.value) })
                              }
                              aria-label="相位差"
                            />
                          </td>
                          <td className="center">
                            <input
                              type="checkbox"
                              checked={!!n.lockedOffset}
                              onChange={(e) =>
                                updateBandNode(n.id, { lockedOffset: e.target.checked })
                              }
                              title="锁定相位差"
                              aria-label="锁定"
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => removeBandNode(n.id)}
                              disabled={corridor.nodes.length <= 2}
                            >
                              删
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {segs.length > 0 && (
                <div className="band-seg-summary">
                  {segs.map((s) => (
                    <span key={s.toId} className="seg-chip">
                      {s.fromName}→{s.toName}{' '}
                      <b>{Math.round(s.lengthM)}</b>m
                    </span>
                  ))}
                </div>
              )}

              <div className="band-inline-chart">
                <InteractiveTimeSpace corridor={corridor} result={band} />
              </div>
            </div>
          )}

          {tab === 'timespace' && (
            <div className="card band-pane compact-card">
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>时距图</h2>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    exportSvgFile(
                      `${project.name}-timespace.svg`,
                      buildTimeSpaceExportSvg(corridor, band, theme),
                    )
                  }}
                >
                  SVG
                </button>
              </div>
              <InteractiveTimeSpace corridor={corridor} result={band} />
              <TimeSpacePanel corridor={corridor} />
              <BandCharts corridor={corridor} />
            </div>
          )}

          {tab === 'map' && (
            <div className="card band-pane compact-card">
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>走廊图</h2>
              </div>
              <div
                className="chart-svg-host chart-svg-host--pro"
                dangerouslySetInnerHTML={{ __html: mapSvg }}
              />
            </div>
          )}

          {tab === 'compare' && (
            <div className="card band-pane compact-card">
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>多走廊对比</h2>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    const kpis = collectCorridorKpis(corridors)
                    exportSvgFile(`${project.name}-band-compare.svg`, corridorKpiCompareSvg(kpis))
                    downloadText(
                      `${project.name}-band-multi.md`,
                      multiBandMarkdown(project.name, kpis),
                      'text/markdown',
                    )
                  }}
                >
                  导出
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
