/**
 * Channel workspace — RoadGee-style approach property form (v0.5.133).
 * Section order / two-column rows mirror reference product UI.
 * Values write domain Approach; canvas rebuilds live. No long hints.
 */
import { useMemo, useState } from 'react'
import type { Approach, Movement, Project } from '@/domain/types'

export type ChannelWorkspaceProps = {
  project: Project
  selected: Approach | null
  approaches?: Approach[]
  onSelectApproach?: (id: string) => void
  updateApproach: (id: string, patch: Partial<Approach>) => void
  setLaneCount: (approachId: string, count: number) => void
  setExitLaneCount?: (approachId: string, count: number) => void
  setLaneWidth: (approachId: string, index: number, widthM: number) => void
  setLaneMovements: (approachId: string, index: number, movements: Movement[]) => void
  setLaneVariable: (approachId: string, index: number, variable: boolean) => void
  mergeLaneGroup: (approachId: string, a: number, b: number) => void
  splitLaneGroupAt: (approachId: string, groupId: string) => void
}

function Row({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="rg-form-row">
      <div className="rg-form-col">{left}</div>
      <div className="rg-form-col">{right ?? null}</div>
    </div>
  )
}

function Field({
  label,
  children,
  unit,
  disabled,
  info,
}: {
  label: string
  children: React.ReactNode
  unit?: string
  disabled?: boolean
  info?: boolean
}) {
  return (
    <label className={`rg-field ${disabled ? 'is-disabled' : ''}`}>
      <span className="rg-field-label">
        {label}
        {info ? <span className="rg-info" title="工程示意参数">i</span> : null}
      </span>
      <span className="rg-field-ctrl">
        {children}
        {unit ? <span className="rg-unit">{unit}</span> : null}
      </span>
    </label>
  )
}

function NumInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  highlight,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  highlight?: boolean
}) {
  return (
    <input
      type="number"
      className={`rg-input ${highlight ? 'is-highlight' : ''}`}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

function ResetLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="rg-reset" onClick={onClick}>
      重置
    </button>
  )
}

export function ChannelWorkspace({
  project,
  selected,
  approaches: approachesProp,
  onSelectApproach,
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
  const approaches = approachesProp ?? channel?.approaches ?? []
  const ap = selected ?? approaches[0] ?? null

  // UI-only cosmetic controls matching reference product (not in mesh domain)
  const [ixSize, setIxSize] = useState(5)
  const [rtCurve, setRtCurve] = useState(0.5)
  const [approachOffset, setApproachOffset] = useState(0.5)
  const [crossTo, setCrossTo] = useState<'no' | 'yes'>('no')
  const [leftTurnRange, setLeftTurnRange] = useState(135)
  const [rightTurnRange, setRightTurnRange] = useState(135)
  const [showAngleGuides, setShowAngleGuides] = useState(false)
  const [moreOpen, setMoreOpen] = useState(true)
  const [auxOpen, setAuxOpen] = useState(true)

  const dirLabel = useMemo(() => {
    if (!ap || !approaches.length) return '—'
    const i = approaches.findIndex((a) => a.id === ap.id)
    return i >= 0 ? `方向${i + 1}` : ap.name
  }, [ap, approaches])

  if (!ap || !channel) {
    return (
      <div className="rg-channel-form">
        <p className="muted" style={{ fontSize: 12, margin: 8 }}>
          请选择进口方向
        </p>
      </div>
    )
  }

  const id = ap.id
  const rt = ap.rightTurn
  const w = ap.widen
  const med = ap.median
  const si = rt.safetyIsland
  const aux = ap.auxRoad ?? { enabled: false, widthM: 3.5, offsetM: 0, openNearM: 18 }
  const rtOn = rt.enabled && rt.style !== 'none'
  const bikeOn = ap.bikeEnabled
  const auxOn = !!aux.enabled
  const entryWidenOn = w.entryWidenCount > 0
  const exitWidenOn = w.exitWidenCount > 0

  return (
    <div className="rg-channel-form">
      {/* 顶栏 */}
      <div className="rg-form-top">
        <Row
          left={
            <Field label="方向:">
              <select
                className="rg-select"
                value={ap.id}
                onChange={(e) => onSelectApproach?.(e.target.value)}
              >
                {approaches.map((a, i) => (
                  <option key={a.id} value={a.id}>
                    方向{i + 1}
                    {a.name && a.name !== `方向${i + 1}` ? ` · ${a.name}` : ''}
                  </option>
                ))}
              </select>
            </Field>
          }
          right={
            <Field label="非机动车道:">
              <span className="rg-btn-pair">
                <button
                  type="button"
                  className={`rg-btn-accent ${bikeOn ? 'is-on' : ''}`}
                  onClick={() =>
                    updateApproach(id, {
                      bikeEnabled: true,
                      bikeWidthM: Math.max(ap.bikeWidthM || 2, 2),
                    })
                  }
                >
                  设置
                </button>
                <button
                  type="button"
                  className="rg-btn-muted"
                  onClick={() => updateApproach(id, { bikeEnabled: false })}
                >
                  取消
                </button>
              </span>
            </Field>
          }
        />
        <Row
          left={
            <Field label="交叉口大小:">
              <NumInput value={ixSize} min={1} max={20} step={0.5} onChange={setIxSize} />
            </Field>
          }
          right={
            <Field label="右转曲度:">
              <span className="rg-inline">
                <NumInput value={rtCurve} min={0.1} max={2} step={0.1} onChange={setRtCurve} />
                <ResetLink onClick={() => setRtCurve(0.5)} />
              </span>
            </Field>
          }
        />
      </div>

      {/* 道路属性 */}
      <section className="rg-sec">
        <h3 className="rg-sec-title">道路属性</h3>
        <Row
          left={
            <Field label="路名:">
              <input
                type="text"
                className="rg-input is-highlight"
                value={ap.name || dirLabel}
                onChange={(e) => updateApproach(id, { name: e.target.value })}
              />
            </Field>
          }
          right={
            <Field label="偏移量:">
              <span className="rg-inline">
                <NumInput value={approachOffset} step={0.1} onChange={setApproachOffset} />
                <ResetLink onClick={() => setApproachOffset(0.5)} />
              </span>
            </Field>
          }
        />
        <Row
          left={
            <Field label="穿越到:">
              <select
                className="rg-select"
                value={crossTo}
                onChange={(e) => setCrossTo(e.target.value as 'no' | 'yes')}
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </Field>
          }
          right={
            <Field label="穿越方式:" disabled={crossTo === 'no'} info>
              <select className="rg-select" disabled={crossTo === 'no'} defaultValue="none">
                <option value="none">无</option>
                <option value="mark">标线</option>
              </select>
            </Field>
          }
        />
        <Row
          left={
            <Field label="人行道宽度:" unit="米">
              <NumInput
                value={ap.sidewalkWidthM}
                min={0}
                step={0.1}
                onChange={(n) => updateApproach(id, { sidewalkWidthM: Math.max(0, n) })}
              />
            </Field>
          }
          right={
            <Field label="路段速度:" unit="km/h">
              <NumInput
                value={ap.designSpeedKmh}
                min={20}
                max={80}
                onChange={(n) => updateApproach(id, { designSpeedKmh: n })}
              />
            </Field>
          }
        />
        <div className="rg-checks">
          <label className="rg-check">
            <input
              type="checkbox"
              checked={ap.sidewalkWidthM > 0}
              onChange={(e) =>
                updateApproach(id, {
                  sidewalkWidthM: e.target.checked ? Math.max(ap.sidewalkWidthM, 2) : 0,
                })
              }
            />
            人行横道
          </label>
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
            红灯时右转
          </label>
        </div>
      </section>

      {/* 右转渠化 */}
      <section className="rg-sec">
        <h3 className="rg-sec-title">右转渠化</h3>
        <Row
          left={
            <Field label="右转渠化:">
              <select
                className="rg-select"
                value={rtOn ? 'yes' : 'no'}
                onChange={(e) => {
                  const on = e.target.value === 'yes'
                  updateApproach(id, {
                    rightTurn: {
                      ...rt,
                      enabled: on,
                      style: on ? (rt.style === 'none' ? 'solid' : rt.style) : 'none',
                    },
                  })
                }}
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </Field>
          }
          right={
            <Field label="右转单独入口:" unit="个" info>
              <select
                className="rg-select"
                value={rt.separateEntry ? 1 : 0}
                onChange={(e) =>
                  updateApproach(id, {
                    rightTurn: { ...rt, separateEntry: Number(e.target.value) > 0 },
                  })
                }
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
              </select>
            </Field>
          }
        />
        <Row
          left={
            <Field label="出入口宽度:" unit="米" disabled={!rtOn} info>
              <NumInput
                value={rt.widthM}
                min={1}
                step={0.1}
                disabled={!rtOn}
                onChange={(n) => updateApproach(id, { rightTurn: { ...rt, widthM: n } })}
              />
            </Field>
          }
          right={
            <Field label="右转单独出口:" unit="个" info>
              <select
                className="rg-select"
                value={rt.separateExit ? 1 : 0}
                onChange={(e) =>
                  updateApproach(id, {
                    rightTurn: { ...rt, separateExit: Number(e.target.value) > 0 },
                  })
                }
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
              </select>
            </Field>
          }
        />
        {rtOn ? (
          <Row
            left={
              <Field label="渠化样式:">
                <select
                  className="rg-select"
                  value={rt.style}
                  onChange={(e) =>
                    updateApproach(id, {
                      rightTurn: { ...rt, style: e.target.value as typeof rt.style },
                    })
                  }
                >
                  <option value="solid">实体导流岛</option>
                  <option value="painted">标线岛</option>
                  <option value="none">无</option>
                </select>
              </Field>
            }
            right={
              <Field label="右转半径:" unit="米">
                <NumInput
                  value={rt.radiusM}
                  min={6}
                  step={0.5}
                  onChange={(n) => updateApproach(id, { rightTurn: { ...rt, radiusM: n } })}
                />
              </Field>
            }
          />
        ) : null}
      </section>

      {/* 进口属性 */}
      <section className="rg-sec">
        <h3 className="rg-sec-title">进口属性</h3>
        <Row
          left={
            <Field label="进口车道:" unit="个">
              <select
                className="rg-select"
                value={ap.entryLanes.length}
                onChange={(e) => setLaneCount(id, Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          }
          right={
            <Field label="车道宽度:" unit="米">
              <NumInput
                value={ap.entryLanes[0]?.widthM ?? 3.5}
                min={2.5}
                max={4.5}
                step={0.05}
                onChange={(n) => ap.entryLanes.forEach((_, i) => setLaneWidth(id, i, n))}
              />
            </Field>
          }
        />
        <Row
          left={
            <Field label="进口展宽:" unit="个">
              <select
                className="rg-select"
                value={entryWidenOn ? w.entryWidenCount : 0}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  updateApproach(id, {
                    widen: { ...w, entryWidenCount: n },
                  })
                }}
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? '否' : n}
                  </option>
                ))}
              </select>
            </Field>
          }
          right={
            <Field label="展宽车道宽度:" unit="米" disabled={!entryWidenOn} info>
              <NumInput
                value={w.entryWidenWidthM}
                min={0}
                step={0.1}
                disabled={!entryWidenOn}
                onChange={(n) => updateApproach(id, { widen: { ...w, entryWidenWidthM: n } })}
              />
            </Field>
          }
        />
        <Row
          left={
            <Field label="展宽段长:" unit="米">
              <NumInput
                value={w.entryWidenLengthM}
                min={0}
                onChange={(n) => updateApproach(id, { widen: { ...w, entryWidenLengthM: n } })}
              />
            </Field>
          }
          right={
            <Field label="外侧渐变段长:" unit="米">
              <NumInput
                value={w.entryTaperM}
                min={0}
                onChange={(n) => updateApproach(id, { widen: { ...w, entryTaperM: n } })}
              />
            </Field>
          }
        />
        <Row
          left={
            <Field label="内侧偏移:" unit="米">
              <NumInput
                value={w.innerOffsetM}
                step={0.1}
                onChange={(n) => updateApproach(id, { widen: { ...w, innerOffsetM: n } })}
              />
            </Field>
          }
          right={
            <Field label="内侧渐变段长:" unit="米">
              <NumInput
                value={w.entryTaperM}
                min={0}
                onChange={(n) => updateApproach(id, { widen: { ...w, entryTaperM: n } })}
              />
            </Field>
          }
        />
      </section>

      {/* 出口属性 */}
      <section className="rg-sec">
        <h3 className="rg-sec-title">出口属性</h3>
        <Row
          left={
            <Field label="出口车道:" unit="个">
              <select
                className="rg-select"
                value={ap.exitLanes.length}
                onChange={(e) => setExitLaneCount?.(id, Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          }
          right={
            <Field label="车道宽度:" unit="米">
              <NumInput
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
            </Field>
          }
        />
        <Row
          left={
            <Field label="出口展宽:" unit="个">
              <select
                className="rg-select"
                value={exitWidenOn ? w.exitWidenCount : 0}
                onChange={(e) =>
                  updateApproach(id, {
                    widen: { ...w, exitWidenCount: Number(e.target.value) },
                  })
                }
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? '否' : n}
                  </option>
                ))}
              </select>
            </Field>
          }
          right={
            <Field label="展宽车道宽度:" unit="米" disabled={!exitWidenOn} info>
              <NumInput
                value={w.exitWidenWidthM}
                min={0}
                step={0.1}
                disabled={!exitWidenOn}
                onChange={(n) => updateApproach(id, { widen: { ...w, exitWidenWidthM: n } })}
              />
            </Field>
          }
        />
        <Row
          left={
            <Field label="展宽段长:" unit="米">
              <NumInput
                value={w.exitWidenLengthM}
                min={0}
                onChange={(n) => updateApproach(id, { widen: { ...w, exitWidenLengthM: n } })}
              />
            </Field>
          }
          right={
            <Field label="渐变段长:" unit="米">
              <NumInput
                value={w.exitTaperM}
                min={0}
                onChange={(n) => updateApproach(id, { widen: { ...w, exitTaperM: n } })}
              />
            </Field>
          }
        />
      </section>

      {/* 中央隔离 */}
      <section className="rg-sec">
        <h3 className="rg-sec-title">中央隔离</h3>
        <Row
          left={
            <Field label="分割形式:">
              <select
                className="rg-select"
                value={med.style}
                onChange={(e) =>
                  updateApproach(id, {
                    median: { ...med, style: e.target.value as typeof med.style },
                  })
                }
              >
                <option value="doubleYellow">双黄线</option>
                <option value="singleYellow">单黄线</option>
                <option value="barrier">护栏</option>
                <option value="yellowHatch">黄斜线</option>
                <option value="greenBelt">绿化带</option>
                <option value="fishBelly">鱼腹式</option>
              </select>
            </Field>
          }
          right={
            <Field label="分割带宽:" unit="米" info>
              <NumInput
                value={med.widthM}
                min={0}
                step={0.1}
                onChange={(n) => updateApproach(id, { median: { ...med, widthM: n } })}
              />
            </Field>
          }
        />
        <Row
          left={
            <Field label="安全岛:">
              <select
                className="rg-select"
                value={si?.enabled ? 'yes' : 'no'}
                onChange={(e) =>
                  updateApproach(id, {
                    rightTurn: {
                      ...rt,
                      safetyIsland: {
                        enabled: e.target.value === 'yes',
                        surface: si?.surface ?? 'raised',
                        radiusM: si?.radiusM ?? 3.5,
                        setbackM: si?.setbackM ?? 1.5,
                        showYield: si?.showYield ?? true,
                        label: si?.label ?? '安全岛',
                      },
                    },
                  })
                }
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </Field>
          }
          right={
            <Field label="提前掉头:">
              <select className="rg-select" defaultValue="no" disabled title="示意项，暂无域写入">
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </Field>
          }
        />
      </section>

      {/* 非机动车道 */}
      <section className="rg-sec">
        <h3 className="rg-sec-title">非机动车道</h3>
        <Row
          left={
            <Field label="进口:">
              <select
                className="rg-select"
                value={bikeOn ? 'yes' : 'no'}
                onChange={(e) =>
                  updateApproach(id, {
                    bikeEnabled: e.target.value === 'yes',
                    bikeWidthM: e.target.value === 'yes' ? Math.max(ap.bikeWidthM, 2) : ap.bikeWidthM,
                  })
                }
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </Field>
          }
          right={
            <Field label="出口:">
              <select
                className="rg-select"
                value={bikeOn ? 'yes' : 'no'}
                onChange={(e) =>
                  updateApproach(id, {
                    bikeEnabled: e.target.value === 'yes',
                    bikeWidthM: e.target.value === 'yes' ? Math.max(ap.bikeWidthM, 2) : ap.bikeWidthM,
                  })
                }
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </Field>
          }
        />
        <Row
          left={
            <Field label="车道宽度:" unit="米" disabled={!bikeOn}>
              <NumInput
                value={ap.bikeWidthM || 2}
                min={1}
                step={0.1}
                disabled={!bikeOn}
                onChange={(n) => updateApproach(id, { bikeWidthM: n, bikeEnabled: n > 0 })}
              />
            </Field>
          }
          right={
            <Field label="车道宽度:" unit="米" disabled={!bikeOn}>
              <NumInput
                value={ap.bikeWidthM || 2}
                min={1}
                step={0.1}
                disabled={!bikeOn}
                onChange={(n) => updateApproach(id, { bikeWidthM: n, bikeEnabled: n > 0 })}
              />
            </Field>
          }
        />
        <Row
          left={
            <Field label="分割形式:" disabled={!bikeOn}>
              <select className="rg-select" disabled={!bikeOn} defaultValue="line">
                <option value="line">划线</option>
                <option value="curb">路缘</option>
              </select>
            </Field>
          }
          right={
            <Field label="分割形式:" disabled={!bikeOn}>
              <select className="rg-select" disabled={!bikeOn} defaultValue="line">
                <option value="line">划线</option>
                <option value="curb">路缘</option>
              </select>
            </Field>
          }
        />
        <Row
          left={
            <Field label="分割带宽:" unit="米" disabled={!bikeOn} info>
              <NumInput value={0} disabled={!bikeOn} onChange={() => undefined} />
            </Field>
          }
          right={
            <Field label="分割带宽:" unit="米" disabled={!bikeOn} info>
              <NumInput value={0} disabled={!bikeOn} onChange={() => undefined} />
            </Field>
          }
        />
      </section>

      {/* 辅路属性 */}
      <section className="rg-sec">
        <button type="button" className="rg-sec-title rg-sec-toggle" onClick={() => setAuxOpen((v) => !v)}>
          辅路属性 <span className="rg-caret">{auxOpen ? '▲' : '▼'}</span>
        </button>
        {auxOpen ? (
          <>
            <Row
              left={
                <Field label="进口辅道:" unit="个">
                  <select
                    className="rg-select"
                    value={auxOn ? 1 : 0}
                    onChange={(e) =>
                      updateApproach(id, {
                        auxRoad: {
                          enabled: Number(e.target.value) > 0,
                          widthM: aux.widthM || 3.5,
                          offsetM: aux.offsetM ?? 0,
                          openNearM: aux.openNearM ?? 18,
                        },
                      })
                    }
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                  </select>
                </Field>
              }
              right={
                <Field label="出口辅道:" unit="个">
                  <select
                    className="rg-select"
                    value={auxOn ? 1 : 0}
                    onChange={(e) =>
                      updateApproach(id, {
                        auxRoad: {
                          enabled: Number(e.target.value) > 0,
                          widthM: aux.widthM || 3.5,
                          offsetM: aux.offsetM ?? 0,
                          openNearM: aux.openNearM ?? 18,
                        },
                      })
                    }
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                  </select>
                </Field>
              }
            />
            <Row
              left={
                <Field label="车道宽度:" unit="米" disabled={!auxOn}>
                  <NumInput
                    value={aux.widthM || 3.5}
                    min={3}
                    step={0.1}
                    disabled={!auxOn}
                    onChange={(n) =>
                      updateApproach(id, {
                        auxRoad: { ...aux, enabled: true, widthM: n },
                      })
                    }
                  />
                </Field>
              }
              right={
                <Field label="车道宽度:" unit="米" disabled={!auxOn}>
                  <NumInput
                    value={aux.widthM || 3.5}
                    min={3}
                    step={0.1}
                    disabled={!auxOn}
                    onChange={(n) =>
                      updateApproach(id, {
                        auxRoad: { ...aux, enabled: true, widthM: n },
                      })
                    }
                  />
                </Field>
              }
            />
            <Row
              left={
                <Field label="分割形式:" disabled={!auxOn}>
                  <select className="rg-select" disabled={!auxOn} defaultValue="line">
                    <option value="line">划线</option>
                  </select>
                </Field>
              }
              right={
                <Field label="分割形式:" disabled={!auxOn}>
                  <select className="rg-select" disabled={!auxOn} defaultValue="line">
                    <option value="line">划线</option>
                  </select>
                </Field>
              }
            />
            <Row
              left={
                <Field label="分割带宽:" unit="米" disabled={!auxOn} info>
                  <NumInput value={0} disabled={!auxOn} onChange={() => undefined} />
                </Field>
              }
              right={
                <Field label="分割带宽:" unit="米" disabled={!auxOn} info>
                  <NumInput value={0} disabled={!auxOn} onChange={() => undefined} />
                </Field>
              }
            />
          </>
        ) : null}
      </section>

      {/* 更多属性 */}
      <section className="rg-sec">
        <button type="button" className="rg-sec-title rg-sec-toggle" onClick={() => setMoreOpen((v) => !v)}>
          更多属性 <span className="rg-caret">{moreOpen ? '▲' : '▼'}</span>
        </button>
        {moreOpen ? (
          <>
            <Row
              left={
                <Field label="进口倾斜:">
                  <span className="rg-inline">
                    <NumInput
                      value={ap.tiltEntryDeg}
                      step={1}
                      onChange={(n) => updateApproach(id, { tiltEntryDeg: n })}
                    />
                    <ResetLink onClick={() => updateApproach(id, { tiltEntryDeg: 0 })} />
                  </span>
                </Field>
              }
              right={
                <Field label="左转角度范围:" unit="度" info>
                  <NumInput value={leftTurnRange} min={90} max={180} onChange={setLeftTurnRange} />
                </Field>
              }
            />
            <Row
              left={
                <Field label="出口倾斜:">
                  <span className="rg-inline">
                    <NumInput
                      value={ap.tiltExitDeg}
                      step={1}
                      onChange={(n) => updateApproach(id, { tiltExitDeg: n })}
                    />
                    <ResetLink onClick={() => updateApproach(id, { tiltExitDeg: 0 })} />
                  </span>
                </Field>
              }
              right={
                <Field label="右转角度范围:" unit="度" info>
                  <NumInput value={rightTurnRange} min={90} max={180} onChange={setRightTurnRange} />
                </Field>
              }
            />
            <label className="rg-check rg-check-block">
              <input
                type="checkbox"
                checked={showAngleGuides}
                onChange={(e) => setShowAngleGuides(e.target.checked)}
              />
              显示左右转角度辅助线
            </label>
          </>
        ) : null}
      </section>

      {/* 分车道明细 — 原版侧栏后的工程明细，紧凑保留 */}
      <section className="rg-sec">
        <h3 className="rg-sec-title">分车道明细</h3>
        <table className="table table-dense rg-lane-table">
          <thead>
            <tr>
              <th>#</th>
              <th>宽m</th>
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
                  <NumInput
                    value={ln.widthM}
                    step={0.05}
                    min={2.5}
                    max={4.5}
                    onChange={(n) => setLaneWidth(id, i, n)}
                  />
                </td>
                <td>
                  <input
                    className="rg-input rg-input--narrow"
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
          <table className="table table-dense rg-lane-table" style={{ marginTop: 4 }}>
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
      </section>
    </div>
  )
}
