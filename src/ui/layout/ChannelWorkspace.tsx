/**
 * Channel workspace — compact approach editor (v0.5.132).
 * Dense property tables; no draft-sheet / right-turn review boards in params.
 * Params write domain Approach; canvas rebuilds live.
 */
import type { Approach, Movement, Project } from '@/domain/types'
import {
  professionalRoundaboutPlanSvg,
  roundaboutLayoutMarkdown,
} from '@/ui/charts/professionalRoundaboutPlan'
import { exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'

export type ChannelWorkspaceProps = {
  project: Project
  selected: Approach | null
  updateApproach: (id: string, patch: Partial<Approach>) => void
  setLaneCount: (approachId: string, count: number) => void
  setExitLaneCount?: (approachId: string, count: number) => void
  setLaneWidth: (approachId: string, index: number, widthM: number) => void
  setLaneMovements: (approachId: string, index: number, movements: Movement[]) => void
  setLaneVariable: (approachId: string, index: number, variable: boolean) => void
  mergeLaneGroup: (approachId: string, a: number, b: number) => void
  splitLaneGroupAt: (approachId: string, groupId: string) => void
}

function CellNum({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="number"
      className="cell-num"
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

export function ChannelWorkspace({
  project,
  selected,
  updateApproach,
  setLaneCount,
  setExitLaneCount,
  setLaneWidth,
  setLaneMovements,
  setLaneVariable,
  mergeLaneGroup,
  splitLaneGroupAt,
}: ChannelWorkspaceProps) {
  const channel =
    project.channelizationSchemes.find((c) => c.id === project.active?.channelId) ??
    project.channelizationSchemes[0]
  const isRoundabout = channel?.intersectionType === 'roundabout'
  const channelKpi = (() => {
    if (!channel) return null
    const aps = channel.approaches
    return {
      legs: aps.length,
      entryLanes: aps.reduce((s, a) => s + a.entryLanes.length, 0),
      exitLanes: aps.reduce((s, a) => s + a.exitLanes.length, 0),
      rtOn: aps.filter((a) => a.rightTurn?.enabled && a.rightTurn.style !== 'none').length,
      sw: selected?.sidewalkWidthM ?? 0,
      med: selected?.median?.widthM ?? 0,
    }
  })()

  if (!selected) {
    return (
      <div className="flat-params channel-params-compact">
        {isRoundabout && channel ? (
          <div className="rg-section">
            <div className="rg-section-title">环岛布局</div>
            <div className="toolbar dense">
              <button
                type="button"
                className="primary"
                onClick={() =>
                  exportSvgFile(
                    `${project.name}-环岛布局.svg`,
                    professionalRoundaboutPlanSvg(channel.approaches, {
                      size: 720,
                      projectName: project.name,
                    }),
                  )
                }
              >
                布局图
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  downloadText(
                    `${project.name}-环岛布局.md`,
                    roundaboutLayoutMarkdown(project.name, channel.approaches),
                    'text/markdown',
                  )
                }
              >
                MD
              </button>
            </div>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 12, margin: '8px 0' }}>
            在上方选择进口道编辑参数
          </p>
        )}
      </div>
    )
  }

  const ap = selected
  const id = ap.id
  const rt = ap.rightTurn
  const w = ap.widen
  const med = ap.median
  const si = rt.safetyIsland

  return (
    <div className="flat-params rg-form channel-params-compact">
      <div className="channel-params-head">
        <b>{ap.name}</b>
        {channelKpi ? (
          <span className="channel-kpi-inline muted">
            {channelKpi.legs}向 · 进{channelKpi.entryLanes}/出{channelKpi.exitLanes} · 右渠
            {channelKpi.rtOn}
          </span>
        ) : null}
      </div>

      {/* 道路 + 开关 */}
      <div className="rg-section">
        <div className="rg-section-title">道路</div>
        <table className="table table-dense prop-table">
          <tbody>
            <tr>
              <th>路名</th>
              <td colSpan={3}>
                <input
                  type="text"
                  className="cell-text"
                  value={ap.name}
                  onChange={(e) => updateApproach(id, { name: e.target.value })}
                />
              </td>
            </tr>
            <tr>
              <th>方位角 °</th>
              <td>
                <CellNum value={ap.bearingDeg} step={1} onChange={(n) => updateApproach(id, { bearingDeg: n })} />
              </td>
              <th>路段速度</th>
              <td>
                <CellNum
                  value={ap.designSpeedKmh}
                  min={20}
                  max={80}
                  onChange={(n) => updateApproach(id, { designSpeedKmh: n })}
                />
                <span className="rg-unit">km/h</span>
              </td>
            </tr>
            <tr>
              <th>人行宽 m</th>
              <td>
                <CellNum
                  value={ap.sidewalkWidthM}
                  min={0}
                  step={0.1}
                  onChange={(n) => updateApproach(id, { sidewalkWidthM: Math.max(0, n) })}
                />
              </td>
              <th>非机宽 m</th>
              <td>
                <CellNum
                  value={ap.bikeWidthM}
                  min={0}
                  step={0.1}
                  onChange={(n) => updateApproach(id, { bikeWidthM: n, bikeEnabled: n > 0 })}
                />
              </td>
            </tr>
            <tr>
              <th>中分</th>
              <td>
                <select
                  value={med.style}
                  onChange={(e) =>
                    updateApproach(id, { median: { ...med, style: e.target.value as typeof med.style } })
                  }
                >
                  <option value="doubleYellow">双黄线</option>
                  <option value="singleYellow">单黄线</option>
                  <option value="barrier">护栏</option>
                  <option value="yellowHatch">黄斜线</option>
                  <option value="greenBelt">绿化带</option>
                  <option value="fishBelly">鱼腹式</option>
                </select>
              </td>
              <th>中分宽 m</th>
              <td>
                <CellNum
                  value={med.widthM}
                  min={0}
                  step={0.1}
                  onChange={(n) => updateApproach(id, { median: { ...med, widthM: n } })}
                />
              </td>
            </tr>
            <tr>
              <th>进口倾斜°</th>
              <td>
                <CellNum value={ap.tiltEntryDeg} step={1} onChange={(n) => updateApproach(id, { tiltEntryDeg: n })} />
              </td>
              <th>出口倾斜°</th>
              <td>
                <CellNum value={ap.tiltExitDeg} step={1} onChange={(n) => updateApproach(id, { tiltExitDeg: n })} />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="rg-checks dense-checks">
          <label className="rg-check">
            <input
              type="checkbox"
              checked={ap.leftWait}
              onChange={(e) => updateApproach(id, { leftWait: e.target.checked })}
            />
            左转待转
          </label>
          <label className="rg-check">
            <input
              type="checkbox"
              checked={ap.throughWait}
              onChange={(e) => updateApproach(id, { throughWait: e.target.checked })}
            />
            直行待行
          </label>
          <label className="rg-check">
            <input
              type="checkbox"
              checked={ap.borrowLeft}
              onChange={(e) => updateApproach(id, { borrowLeft: e.target.checked })}
            />
            借道左转
          </label>
          <label className="rg-check">
            <input
              type="checkbox"
              checked={ap.redRightTurn}
              onChange={(e) => updateApproach(id, { redRightTurn: e.target.checked })}
            />
            红灯右转
          </label>
          <label className="rg-check">
            <input
              type="checkbox"
              checked={ap.bikeEnabled}
              onChange={(e) => updateApproach(id, { bikeEnabled: e.target.checked })}
            />
            非机动车
          </label>
        </div>
        {ap.redRightTurn ? (
          <table className="table table-dense prop-table">
            <tbody>
              <tr>
                <th>红灯右转比</th>
                <td>
                  <CellNum
                    value={ap.redRightTurnRatio}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(n) => updateApproach(id, { redRightTurnRatio: n })}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </div>

      {/* 进口 / 出口 一体表 */}
      <div className="rg-section">
        <div className="rg-section-title">进 / 出口</div>
        <table className="table table-dense prop-table">
          <thead>
            <tr>
              <th />
              <th>进口</th>
              <th>出口</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>车道数</th>
              <td>
                <CellNum value={ap.entryLanes.length} min={1} max={8} onChange={(n) => setLaneCount(id, n)} />
              </td>
              <td>
                <CellNum
                  value={ap.exitLanes.length}
                  min={1}
                  max={8}
                  onChange={(n) => setExitLaneCount?.(id, n)}
                />
              </td>
            </tr>
            <tr>
              <th>车道宽 m</th>
              <td>
                <CellNum
                  value={ap.entryLanes[0]?.widthM ?? 3.5}
                  min={2.5}
                  max={4.5}
                  step={0.05}
                  onChange={(n) => ap.entryLanes.forEach((_, i) => setLaneWidth(id, i, n))}
                />
              </td>
              <td>
                <CellNum
                  value={ap.exitLanes[0]?.widthM ?? 3.5}
                  min={2.5}
                  max={4.5}
                  step={0.05}
                  onChange={(n) => {
                    const lanes = ap.exitLanes.map((ln) => ({
                      ...ln,
                      widthM: Math.max(2.5, Math.min(4.5, n)),
                    }))
                    updateApproach(id, { exitLanes: lanes })
                  }}
                />
              </td>
            </tr>
            <tr>
              <th>展宽条数</th>
              <td>
                <CellNum
                  value={w.entryWidenCount}
                  min={0}
                  max={4}
                  onChange={(n) => updateApproach(id, { widen: { ...w, entryWidenCount: n } })}
                />
              </td>
              <td>
                <CellNum
                  value={w.exitWidenCount}
                  min={0}
                  max={4}
                  onChange={(n) => updateApproach(id, { widen: { ...w, exitWidenCount: n } })}
                />
              </td>
            </tr>
            <tr>
              <th>展宽宽 m</th>
              <td>
                <CellNum
                  value={w.entryWidenWidthM}
                  min={0}
                  step={0.1}
                  onChange={(n) => updateApproach(id, { widen: { ...w, entryWidenWidthM: n } })}
                />
              </td>
              <td>
                <CellNum
                  value={w.exitWidenWidthM}
                  min={0}
                  step={0.1}
                  onChange={(n) => updateApproach(id, { widen: { ...w, exitWidenWidthM: n } })}
                />
              </td>
            </tr>
            <tr>
              <th>展宽长 m</th>
              <td>
                <CellNum
                  value={w.entryWidenLengthM}
                  min={0}
                  onChange={(n) => updateApproach(id, { widen: { ...w, entryWidenLengthM: n } })}
                />
              </td>
              <td>
                <CellNum
                  value={w.exitWidenLengthM}
                  min={0}
                  onChange={(n) => updateApproach(id, { widen: { ...w, exitWidenLengthM: n } })}
                />
              </td>
            </tr>
            <tr>
              <th>渐变长 m</th>
              <td>
                <CellNum
                  value={w.entryTaperM}
                  min={0}
                  onChange={(n) => updateApproach(id, { widen: { ...w, entryTaperM: n } })}
                />
              </td>
              <td>
                <CellNum
                  value={w.exitTaperM}
                  min={0}
                  onChange={(n) => updateApproach(id, { widen: { ...w, exitTaperM: n } })}
                />
              </td>
            </tr>
            <tr>
              <th>内侧偏移 m</th>
              <td colSpan={2}>
                <CellNum
                  value={w.innerOffsetM}
                  step={0.1}
                  onChange={(n) => updateApproach(id, { widen: { ...w, innerOffsetM: n } })}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 右转渠化参数（保留编辑，去掉审查大图） */}
      <div className="rg-section">
        <div className="rg-section-title">右转渠化</div>
        <table className="table table-dense prop-table">
          <tbody>
            <tr>
              <th>启用</th>
              <td>
                <select
                  value={rt.enabled ? 'yes' : 'no'}
                  onChange={(e) =>
                    updateApproach(id, { rightTurn: { ...rt, enabled: e.target.value === 'yes' } })
                  }
                >
                  <option value="no">否</option>
                  <option value="yes">是</option>
                </select>
              </td>
              <th>样式</th>
              <td>
                <select
                  value={rt.style}
                  onChange={(e) =>
                    updateApproach(id, {
                      rightTurn: { ...rt, style: e.target.value as typeof rt.style },
                    })
                  }
                >
                  <option value="solid">实体岛</option>
                  <option value="painted">标线岛</option>
                  <option value="none">无</option>
                </select>
              </td>
            </tr>
            <tr>
              <th>半径 m</th>
              <td>
                <CellNum
                  value={rt.radiusM}
                  min={6}
                  step={0.5}
                  onChange={(n) => updateApproach(id, { rightTurn: { ...rt, radiusM: n } })}
                />
              </td>
              <th>道宽 m</th>
              <td>
                <CellNum
                  value={rt.channelWidthM ?? rt.widthM}
                  min={3}
                  step={0.1}
                  onChange={(n) => updateApproach(id, { rightTurn: { ...rt, channelWidthM: n } })}
                />
              </td>
            </tr>
            <tr>
              <th>口宽 m</th>
              <td>
                <CellNum
                  value={rt.widthM}
                  min={1}
                  step={0.1}
                  onChange={(n) => updateApproach(id, { rightTurn: { ...rt, widthM: n } })}
                />
              </td>
              <th>岛偏 m</th>
              <td>
                <CellNum
                  value={rt.islandOffsetM ?? 0}
                  step={0.2}
                  onChange={(n) => updateApproach(id, { rightTurn: { ...rt, islandOffsetM: n } })}
                />
              </td>
            </tr>
            <tr>
              <th>安全岛</th>
              <td>
                <input
                  type="checkbox"
                  checked={si?.enabled ?? false}
                  onChange={(e) =>
                    updateApproach(id, {
                      rightTurn: {
                        ...rt,
                        safetyIsland: {
                          enabled: e.target.checked,
                          surface: si?.surface ?? 'raised',
                          radiusM: si?.radiusM ?? 3.5,
                          setbackM: si?.setbackM ?? 1.5,
                          showYield: si?.showYield ?? true,
                          label: si?.label ?? '安全岛',
                        },
                      },
                    })
                  }
                />
              </td>
              <th>岛半径/退距</th>
              <td className="cell-pair">
                <CellNum
                  value={si?.radiusM ?? 3.5}
                  min={1}
                  step={0.1}
                  onChange={(n) =>
                    updateApproach(id, {
                      rightTurn: {
                        ...rt,
                        safetyIsland: {
                          enabled: si?.enabled ?? true,
                          surface: si?.surface ?? 'raised',
                          radiusM: n,
                          setbackM: si?.setbackM ?? 1.5,
                          showYield: si?.showYield ?? true,
                          label: si?.label ?? '安全岛',
                        },
                      },
                    })
                  }
                />
                <CellNum
                  value={si?.setbackM ?? 1.5}
                  min={0}
                  step={0.1}
                  onChange={(n) =>
                    updateApproach(id, {
                      rightTurn: {
                        ...rt,
                        safetyIsland: {
                          enabled: si?.enabled ?? true,
                          surface: si?.surface ?? 'raised',
                          radiusM: si?.radiusM ?? 3.5,
                          setbackM: n,
                          showYield: si?.showYield ?? true,
                          label: si?.label ?? '安全岛',
                        },
                      },
                    })
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 辅路 */}
      <div className="rg-section">
        <div className="rg-section-title">辅路</div>
        <table className="table table-dense prop-table">
          <tbody>
            <tr>
              <th>启用</th>
              <td>
                <input
                  type="checkbox"
                  checked={!!ap.auxRoad?.enabled}
                  onChange={(e) =>
                    updateApproach(id, {
                      auxRoad: {
                        enabled: e.target.checked,
                        widthM: ap.auxRoad?.widthM ?? 5.5,
                        offsetM: ap.auxRoad?.offsetM ?? 1,
                        openNearM: ap.auxRoad?.openNearM ?? 18,
                      },
                    })
                  }
                />
              </td>
              <th>宽/偏/开口 m</th>
              <td className="cell-pair">
                <CellNum
                  value={ap.auxRoad?.widthM ?? 5.5}
                  min={3}
                  step={0.1}
                  onChange={(n) =>
                    updateApproach(id, {
                      auxRoad: {
                        enabled: ap.auxRoad?.enabled ?? true,
                        widthM: n,
                        offsetM: ap.auxRoad?.offsetM ?? 1,
                        openNearM: ap.auxRoad?.openNearM ?? 18,
                      },
                    })
                  }
                />
                <CellNum
                  value={ap.auxRoad?.offsetM ?? 1}
                  min={0}
                  step={0.1}
                  onChange={(n) =>
                    updateApproach(id, {
                      auxRoad: {
                        enabled: ap.auxRoad?.enabled ?? true,
                        widthM: ap.auxRoad?.widthM ?? 5.5,
                        offsetM: n,
                        openNearM: ap.auxRoad?.openNearM ?? 18,
                      },
                    })
                  }
                />
                <CellNum
                  value={ap.auxRoad?.openNearM ?? 18}
                  min={5}
                  onChange={(n) =>
                    updateApproach(id, {
                      auxRoad: {
                        enabled: ap.auxRoad?.enabled ?? true,
                        widthM: ap.auxRoad?.widthM ?? 5.5,
                        offsetM: ap.auxRoad?.offsetM ?? 1,
                        openNearM: n,
                      },
                    })
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 分车道 */}
      <div className="rg-section">
        <div className="rg-section-title">分车道</div>
        <table className="table table-dense prop-table">
          <thead>
            <tr>
              <th>#</th>
              <th>宽 m</th>
              <th>ULTR</th>
              <th>可变</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ap.entryLanes.map((ln, i) => (
              <tr key={ln.id}>
                <td>{i + 1}</td>
                <td>
                  <CellNum
                    value={ln.widthM}
                    step={0.05}
                    min={2.5}
                    max={4.5}
                    onChange={(n) => setLaneWidth(id, i, n)}
                  />
                </td>
                <td>
                  <input
                    className="cell-text cell-text--narrow"
                    value={ln.movements.join('')}
                    onChange={(e) => {
                      const raw = e.target.value.toUpperCase().replace(/[^ULTR]/g, '')
                      const movs = Array.from(new Set(raw.split(''))) as Movement[]
                      setLaneMovements(id, i, movs)
                    }}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!ln.variable}
                    onChange={(e) => setLaneVariable(id, i, e.target.checked)}
                  />
                </td>
                <td>
                  {i < ap.entryLanes.length - 1 ? (
                    <button type="button" className="ghost" onClick={() => mergeLaneGroup(id, i, i + 1)}>
                      并
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ap.laneGroups.length > 0 ? (
          <table className="table table-dense prop-table" style={{ marginTop: 4 }}>
            <thead>
              <tr>
                <th>组</th>
                <th>车道</th>
                <th>转向</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ap.laneGroups.map((g, gi) => (
                <tr key={g.id}>
                  <td>G{gi + 1}</td>
                  <td>
                    {g.laneIds
                      .map((lid) => ap.entryLanes.findIndex((l) => l.id === lid) + 1)
                      .filter((n) => n > 0)
                      .join(',')}
                  </td>
                  <td>{g.movements.join('') || '—'}</td>
                  <td>
                    {g.laneIds.length > 1 ? (
                      <button type="button" className="ghost" onClick={() => splitLaneGroupAt(id, g.id)}>
                        拆
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  )
}
