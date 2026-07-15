/**
 * Channel workspace — basemap + selected approach channelization editor.
 * Extracted from App for maintainability (v0.5.40).
 */
import type { Approach, Movement, Project } from '@/domain/types'

export type ChannelWorkspaceProps = {
  project: Project
  selected: Approach | null
  updateBasemap: (patch: Partial<NonNullable<Project['settings']['basemap']>>) => void
  updateApproach: (id: string, patch: Partial<Approach>) => void
  setLaneCount: (approachId: string, count: number) => void
  setLaneWidth: (approachId: string, index: number, widthM: number) => void
  setLaneMovements: (approachId: string, index: number, movements: Movement[]) => void
  setLaneVariable: (approachId: string, index: number, variable: boolean) => void
  mergeLaneGroup: (approachId: string, a: number, b: number) => void
  splitLaneGroupAt: (approachId: string, groupId: string) => void
}

export function ChannelWorkspace({
  project,
  selected,
  updateBasemap,
  updateApproach,
  setLaneCount,
  setLaneWidth,
  setLaneMovements,
  setLaneVariable,
  mergeLaneGroup,
  splitLaneGroupAt,
}: ChannelWorkspaceProps) {
  return (
    <>
<div className="card" style={{ marginTop: 12 }}>
              <div className="panel-header">
                <h2 style={{ margin: 0 }}>地图底图（骨架）</h2>
                <span className="hint">示意定位 · 非测绘</span>
              </div>
              <label className="timing-fixed">
                <input
                  type="checkbox"
                  checked={!!project.settings.basemap?.enabled}
                  onChange={(e) => updateBasemap({ enabled: e.target.checked })}
                />{' '}
                显示 OSM 底图
              </label>
              <div className="field-grid" style={{ marginTop: 8 }}>
                <label>
                  纬度
                  <input
                    type="number"
                    step={0.0001}
                    value={project.settings.basemap?.latitude ?? 36.0611}
                    onChange={(e) => updateBasemap({ latitude: Number(e.target.value) })}
                  />
                </label>
                <label>
                  经度
                  <input
                    type="number"
                    step={0.0001}
                    value={project.settings.basemap?.longitude ?? 103.8343}
                    onChange={(e) => updateBasemap({ longitude: Number(e.target.value) })}
                  />
                </label>
                <label>
                  透明度
                  <input
                    type="number"
                    min={0.15}
                    max={0.9}
                    step={0.05}
                    value={project.settings.basemap?.opacity ?? 0.55}
                    onChange={(e) => updateBasemap({ opacity: Number(e.target.value) })}
                  />
                </label>
              </div>
              <p className="hint">
                默认兰州附近坐标；瓦片来自 OpenStreetMap。几何仍为本地米制，底图仅作空间语境参考。写入 .rtp。
              </p>
            </div>
          {selected && (
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
              <details className="details-block" open>
                <summary>进口/出口展宽</summary>
                <div className="details-body">
                  <div className="section-title" style={{ marginTop: 0 }}>进口展宽（停车线侧）</div>
                  <div className="field-row">
                    <label>
                      展宽车道数
                      <input
                        type="number"
                        min={0}
                        max={4}
                        value={selected.widen.entryWidenCount}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            widen: { ...selected.widen, entryWidenCount: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                    <label>
                      单车道宽 (m)
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={selected.widen.entryWidenWidthM}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            widen: { ...selected.widen, entryWidenWidthM: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="field-row">
                    <label>
                      展宽段长 (m)
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={selected.widen.entryWidenLengthM}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            widen: { ...selected.widen, entryWidenLengthM: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                    <label>
                      渐变段长 (m)
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={selected.widen.entryTaperM}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            widen: { ...selected.widen, entryTaperM: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                  </div>
                  <p className="hint">
                    进口加宽 = 车道数×单宽 ={' '}
                    {(selected.widen.entryWidenCount * selected.widen.entryWidenWidthM).toFixed(1)} m（几何全量，非系数缩小）
                  </p>
                  <div className="section-title">出口展宽</div>
                  <div className="field-row">
                    <label>
                      出口展宽车道数
                      <input
                        type="number"
                        min={0}
                        max={4}
                        value={selected.widen.exitWidenCount}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            widen: { ...selected.widen, exitWidenCount: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                    <label>
                      出口单宽 (m)
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={selected.widen.exitWidenWidthM}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            widen: { ...selected.widen, exitWidenWidthM: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="field-row">
                    <label>
                      出口段长 (m)
                      <input
                        type="number"
                        min={0}
                        value={selected.widen.exitWidenLengthM}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            widen: { ...selected.widen, exitWidenLengthM: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                    <label>
                      出口渐变 (m)
                      <input
                        type="number"
                        min={0}
                        value={selected.widen.exitTaperM}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            widen: { ...selected.widen, exitTaperM: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              </details>
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
                    min={6}
                    step={0.5}
                    value={selected.rightTurn.radiusM}
                    onChange={(e) =>
                      updateApproach(selected.id, {
                        rightTurn: { ...selected.rightTurn, radiusM: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              </div>
              <details className="details-block" open>
                <summary>右转渠化 / 安全岛</summary>
                <div className="details-body">
                  <div className="field-row">
                    <label>
                      渠化岛宽
                      <input
                        type="number"
                        min={1}
                        step={0.1}
                        value={selected.rightTurn.widthM}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            rightTurn: { ...selected.rightTurn, widthM: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                    <label>
                      右转道宽
                      <input
                        type="number"
                        min={3}
                        step={0.1}
                        value={selected.rightTurn.channelWidthM ?? selected.rightTurn.widthM}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            rightTurn: {
                              ...selected.rightTurn,
                              channelWidthM: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="field-row">
                    <label>
                      岛偏移
                      <input
                        type="number"
                        step={0.2}
                        value={selected.rightTurn.islandOffsetM ?? 0}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            rightTurn: {
                              ...selected.rightTurn,
                              islandOffsetM: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      渠化样式
                      <select
                        value={selected.rightTurn.style}
                        onChange={(e) =>
                          updateApproach(selected.id, {
                            rightTurn: {
                              ...selected.rightTurn,
                              style: e.target.value as typeof selected.rightTurn.style,
                            },
                          })
                        }
                      >
                        <option value="solid">实体导流岛</option>
                        <option value="painted">标线岛</option>
                        <option value="none">无</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.rightTurn.safetyIsland?.enabled ?? false}
                      onChange={(e) =>
                        updateApproach(selected.id, {
                          rightTurn: {
                            ...selected.rightTurn,
                            safetyIsland: {
                              enabled: e.target.checked,
                              surface: selected.rightTurn.safetyIsland?.surface ?? 'raised',
                              radiusM: selected.rightTurn.safetyIsland?.radiusM ?? 3.5,
                              setbackM: selected.rightTurn.safetyIsland?.setbackM ?? 1.5,
                              showYield: selected.rightTurn.safetyIsland?.showYield ?? true,
                              label: selected.rightTurn.safetyIsland?.label ?? '安全岛',
                            },
                          },
                        })
                      }
                    />{' '}
                    行人安全岛
                  </label>
                  {(selected.rightTurn.safetyIsland?.enabled ?? false) && (
                    <>
                      <div className="field-row">
                        <label>
                          安全岛半径
                          <input
                            type="number"
                            min={1}
                            step={0.1}
                            value={selected.rightTurn.safetyIsland?.radiusM ?? 3.5}
                            onChange={(e) =>
                              updateApproach(selected.id, {
                                rightTurn: {
                                  ...selected.rightTurn,
                                  safetyIsland: {
                                    ...(selected.rightTurn.safetyIsland ?? {
                                      enabled: true,
                                      surface: 'raised',
                                      radiusM: 3.5,
                                      setbackM: 1.5,
                                      showYield: true,
                                      label: '安全岛',
                                    }),
                                    radiusM: Number(e.target.value),
                                  },
                                },
                              })
                            }
                          />
                        </label>
                        <label>
                          退距
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={selected.rightTurn.safetyIsland?.setbackM ?? 1.5}
                            onChange={(e) =>
                              updateApproach(selected.id, {
                                rightTurn: {
                                  ...selected.rightTurn,
                                  safetyIsland: {
                                    ...(selected.rightTurn.safetyIsland ?? {
                                      enabled: true,
                                      surface: 'raised',
                                      radiusM: 3.5,
                                      setbackM: 1.5,
                                      showYield: true,
                                      label: '安全岛',
                                    }),
                                    setbackM: Number(e.target.value),
                                  },
                                },
                              })
                            }
                          />
                        </label>
                      </div>
                      <div className="field-row">
                        <label>
                          岛面
                          <select
                            value={selected.rightTurn.safetyIsland?.surface ?? 'raised'}
                            onChange={(e) =>
                              updateApproach(selected.id, {
                                rightTurn: {
                                  ...selected.rightTurn,
                                  safetyIsland: {
                                    ...(selected.rightTurn.safetyIsland ?? {
                                      enabled: true,
                                      surface: 'raised',
                                      radiusM: 3.5,
                                      setbackM: 1.5,
                                      showYield: true,
                                      label: '安全岛',
                                    }),
                                    surface: e.target.value as 'raised' | 'painted' | 'landscaped',
                                  },
                                },
                              })
                            }
                          >
                            <option value="raised">抬升实体</option>
                            <option value="landscaped">绿化</option>
                            <option value="painted">标线</option>
                          </select>
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={selected.rightTurn.safetyIsland?.showYield ?? true}
                            onChange={(e) =>
                              updateApproach(selected.id, {
                                rightTurn: {
                                  ...selected.rightTurn,
                                  safetyIsland: {
                                    ...(selected.rightTurn.safetyIsland ?? {
                                      enabled: true,
                                      surface: 'raised',
                                      radiusM: 3.5,
                                      setbackM: 1.5,
                                      showYield: true,
                                      label: '安全岛',
                                    }),
                                    showYield: e.target.checked,
                                  },
                                },
                              })
                            }
                          />{' '}
                          让行三角
                        </label>
                      </div>
                    </>
                  )}
                  <p className="hint">改半径/道宽/安全岛后画布即时重绘；图例含导流岛与安全岛。</p>
                </div>
              </details>
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
              {selected.bikeEnabled && (
                <label>
                  非机动车道宽 (m)
                  <input
                    type="number"
                    min={1}
                    step={0.1}
                    value={selected.bikeWidthM}
                    onChange={(e) => updateApproach(selected.id, { bikeWidthM: Number(e.target.value) })}
                />
                </label>
              )}
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
                <summary>分车道宽 / 转向 / 可变车道</summary>
                <div className="details-body">
              <div className="section-title" style={{ marginTop: 0 }}>车道配置</div>
              {selected.entryLanes.map((ln, i) => (
                <div key={ln.id} className="lane-edit-row">
                  <div className="field-row" style={{ alignItems: 'end' }}>
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
                      转向 (ULTR)
                      <input
                        value={ln.movements.join('')}
                        onChange={(e) => {
                          const raw = e.target.value.toUpperCase().replace(/[^ULTR]/g, '')
                          const movs = Array.from(new Set(raw.split(''))) as Movement[]
                          setLaneMovements(selected.id, i, movs)
                        }}
                      />
                    </label>
                    <label className="check-inline">
                      <input
                        type="checkbox"
                        checked={!!ln.variable}
                        onChange={(e) => setLaneVariable(selected.id, i, e.target.checked)}
                      />{' '}
                      可变
                    </label>
                  </div>
                  <div className="toolbar" style={{ gap: 6, marginBottom: 6 }}>
                    {i < selected.entryLanes.length - 1 && (
                      <button type="button" className="ghost" onClick={() => mergeLaneGroup(selected.id, i, i + 1)}>
                        与下道合并组
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {selected.laneGroups.length > 0 && (
                <>
                  <div className="section-title">车道组</div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>组</th>
                        <th>车道</th>
                        <th>转向</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.laneGroups.map((g, gi) => (
                        <tr key={g.id}>
                          <td>G{gi + 1}</td>
                          <td>
                            {g.laneIds
                              .map((id) => selected.entryLanes.findIndex((l) => l.id === id) + 1)
                              .filter((n) => n > 0)
                              .join(',')}
                          </td>
                          <td>{g.movements.join('') || '—'}</td>
                          <td>
                            {g.laneIds.length > 1 && (
                              <button type="button" className="ghost" onClick={() => splitLaneGroupAt(selected.id, g.id)}>
                                拆组
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              <p className="hint">
                可变车道图面标黄「可变」；通行能力按多运动共享×0.85。合并组共享转向（非可变车道跟随组）。
              </p>
                </div>
              </details>
            </div>
          )}
    </>
  )
}
