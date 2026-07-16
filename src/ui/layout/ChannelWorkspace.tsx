/**
 * Channel workspace — RoadGee-style grouped approach editor.
 * Sections: 道路属性 / 右转渠化 / 进口 / 出口 / 中央隔离 / 非机动车 / 辅路 / 更多 / 车道明细
 * Params write domain Approach; canvas rebuilds live. No long instructional hints.
 */
import type { Approach, Movement, Project } from '@/domain/types'
import {
  professionalRoundaboutPlanSvg,
  roundaboutLayoutMarkdown,
} from '@/ui/charts/professionalRoundaboutPlan'
import { exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'
import {
  buildChannelDraftSheet,
  channelDraftPreviewSvg,
  channelDraftMarkdown,
} from '@/io/channelDraftSheet'
import {
  professionalRightTurnBoardSvg,
  rightTurnBoardMarkdown,
  rightTurnBoardCsv,
} from '@/domain/channel/rightTurnReview' 
import { buildA4PrintSheet, printSheetHtml } from '@/io/printSheet'
import {
  collectEngineeringPrintPanels,
  engineeringPrintManifest,
} from '@/io/engineeringPrintPack'   

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

function Num({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}) {
  return (
    <label>
      {label}
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {unit ? <span className="rg-unit">{unit}</span> : null}
      </span>
    </label>
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
  if (!selected) {
    return (
      <div className="flat-params" style={{ marginTop: 12 }}>
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
                环岛布局图
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
                布局 MD
              </button>
            </div>
            <div
              className="chart-svg-host chart-svg-host--pro"
              style={{ marginTop: 8, overflow: 'auto', maxHeight: 360 }}
              dangerouslySetInnerHTML={{
                __html: professionalRoundaboutPlanSvg(channel.approaches, {
                  size: 560,
                  projectName: project.name,
                }),
              }}
            />
          </div>
        ) : (
          <>
            <div className="rg-section" style={{ marginBottom: 10 }}>
              <div className="rg-section-title">渠化出图稿</div>
              <div className="toolbar dense">
                <button
                  type="button"
                  className="primary"
                  disabled={!channel}
                  onClick={() => {
                    if (!channel) return
                    downloadText(
                      `${project.name}-渠化出图.svg`,
                      buildChannelDraftSheet(project, channel, undefined, {
                        projectName: project.name,
                        paper: channel.display.paperSize === 'A4' ? 'A4-landscape' : 'A3-landscape',
                      }),
                      'image/svg+xml',
                    )
                  }}
                >
                  导出图框 SVG
                </button>
                <button
                  type="button"
                  className="ghost"
                  disabled={!channel}
                  onClick={() => {
                    if (!channel) return
                    downloadText(
                      `${project.name}-渠化出图.md`,
                      channelDraftMarkdown(project, channel),
                      'text/markdown',
                    )
                  }}
                >
                  出图说明 MD
                </button>
                  <button
                    type="button"
                    className="ghost"
                    disabled={!channel}
                    onClick={() => {
                      if (!channel) return
                      const fl = channel.flowSchemes.find((f) => f.id === project.active?.flowId) ?? channel.flowSchemes[0]
                      const sg = fl?.signalSchemes.find((s) => s.id === project.active?.signalId) ?? fl?.signalSchemes[0]
                      const panels = collectEngineeringPrintPanels({
                        project,
                        channel,
                        flow: fl ?? null,
                        signal: sg ?? null,
                        analysis: null,
                        mesh: null,
                        preferChannelDraft: true,
                        preset: 'engineering',
                      })
                      const sheet = buildA4PrintSheet(panels, {
                        projectName: project.name,
                        schemeName: channel.name,
                        paper: 'A4-landscape',
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
                    }}
                  >
                    A4 工程拼版
                  </button>
              </div>
              {channel && (
                <div
                  className="chart-svg-host chart-svg-host--pro"
                  style={{ marginTop: 8, overflow: 'auto', maxHeight: 280 }}
                  dangerouslySetInnerHTML={{
                    __html: channelDraftPreviewSvg(project, channel, undefined, 820),
                  }}
                />
              )}
            </div>
            <p className="hint">选择进口道编辑参数</p>
          </>
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
    <div className="flat-params rg-form" style={{ marginTop: 12 }}>
      <div className="rg-section" style={{ marginBottom: 10 }}>
        <div className="rg-section-title">渠化出图稿</div>
        <div className="toolbar dense">
          <button
            type="button"
            className="primary"
            disabled={!channel}
            onClick={() => {
              if (!channel) return
              downloadText(
                `${project.name}-渠化出图.svg`,
                buildChannelDraftSheet(project, channel, undefined, {
                  projectName: project.name,
                  paper: channel.display.paperSize === 'A4' ? 'A4-landscape' : 'A3-landscape',
                }),
                'image/svg+xml',
              )
            }}
          >
            导出图框 SVG
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!channel}
            onClick={() => {
              if (!channel) return
              downloadText(
                `${project.name}-渠化出图.md`,
                channelDraftMarkdown(project, channel),
                'text/markdown',
              )
            }}
          >
            出图说明 MD
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!channel}
            onClick={() => {
              if (!channel) return
              const fl =
                channel.flowSchemes.find((f) => f.id === project.active?.flowId) ??
                channel.flowSchemes[0]
              const sg =
                fl?.signalSchemes.find((s) => s.id === project.active?.signalId) ??
                fl?.signalSchemes[0]
              const panels = collectEngineeringPrintPanels({
                project,
                channel,
                flow: fl ?? null,
                signal: sg ?? null,
                analysis: null,
                mesh: null,
                preferChannelDraft: true,
                preset: 'engineering',
              })
              const sheet = buildA4PrintSheet(panels, {
                projectName: project.name,
                schemeName: channel.name,
                paper: 'A4-landscape',
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
            }}
          >
            A4 工程拼版
          </button>
        </div>
        {channel && (
          <div
            className="chart-svg-host chart-svg-host--pro"
            style={{ marginTop: 8, overflow: 'auto', maxHeight: 280 }}
            dangerouslySetInnerHTML={{
              __html: channelDraftPreviewSvg(project, channel, undefined, 820),
            }}
          />
        )}
      </div>

      
      <div className="rg-section">
        <div className="rg-section-title">右转渠化审查</div>
        <div className="toolbar dense">
          <button
            type="button"
            className="ghost"
            disabled={!channel}
            onClick={() => {
              if (!channel) return
              exportSvgFile(
                `${project.name}-右转审查.svg`,
                professionalRightTurnBoardSvg(channel, {
                  width: 900,
                  projectName: project.name,
                }),
              )
            }}
          >
            右转审查图
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!channel}
            onClick={() => {
              if (!channel) return
              downloadText(
                `${project.name}-右转审查.md`,
                rightTurnBoardMarkdown(project.name, channel),
                'text/markdown',
              )
            }}
          >
            审查 MD
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!channel}
            onClick={() => {
              if (!channel) return
              downloadText(
                `${project.name}-右转审查.csv`,
                rightTurnBoardCsv(channel),
                'text/csv',
              )
            }}
          >
            审查 CSV
          </button>
        </div>
        {channel && (
          <div
            className="chart-svg-host chart-svg-host--pro"
            style={{ marginTop: 8, overflow: 'auto', maxHeight: 260 }}
            dangerouslySetInnerHTML={{
              __html: professionalRightTurnBoardSvg(channel, {
                width: 860,
                projectName: project.name,
              }),
            }}
          />
        )}
      </div>

      <h2 className="rg-page-title">渠化 · {ap.name}</h2>

      {/* 道路属性 */}
      <div className="rg-section">
        <div className="rg-section-title">道路属性</div>
        <div className="field-row">
          <label>
            路名
            <input
              type="text"
              value={ap.name}
              onChange={(e) => updateApproach(id, { name: e.target.value })}
            />
          </label>
          <Num
            label="方位角"
            value={ap.bearingDeg}
            unit="°"
            step={1}
            onChange={(n) => updateApproach(id, { bearingDeg: n })}
          />
        </div>
        <div className="field-row">
          <Num
            label="人行道宽度"
            value={ap.sidewalkWidthM}
            unit="m"
            min={0}
            step={0.1}
            onChange={(n) => updateApproach(id, { sidewalkWidthM: Math.max(0, n) })}
          />
          <Num
            label="路段速度"
            value={ap.designSpeedKmh}
            unit="km/h"
            min={20}
            max={80}
            onChange={(n) => updateApproach(id, { designSpeedKmh: n })}
          />
        </div>
        <div className="rg-checks">
          <label className="rg-check">
            <input
              type="checkbox"
              checked={ap.sidewalkWidthM > 0}
              onChange={(e) =>
                updateApproach(id, { sidewalkWidthM: e.target.checked ? Math.max(ap.sidewalkWidthM, 2) : 0 })
              }
            />
            人行横道/道
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
        {ap.redRightTurn && (
          <div className="field-row">
            <Num
              label="红灯右转比例"
              value={ap.redRightTurnRatio}
              min={0}
              max={1}
              step={0.05}
              onChange={(n) => updateApproach(id, { redRightTurnRatio: n })}
            />
          </div>
        )}
      </div>

      {/* 右转渠化 */}
      <div className="rg-section">
        <div className="rg-section-title">右转渠化</div>
        <div className="field-row">
          <label>
            右转渠化
            <select
              value={rt.enabled ? 'yes' : 'no'}
              onChange={(e) =>
                updateApproach(id, { rightTurn: { ...rt, enabled: e.target.value === 'yes' } })
              }
            >
              <option value="no">否</option>
              <option value="yes">是</option>
            </select>
          </label>
          <label>
            渠化样式
            <select
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
          </label>
        </div>
        <div className="field-row">
          <Num
            label="右转半径"
            value={rt.radiusM}
            unit="m"
            min={6}
            step={0.5}
            onChange={(n) => updateApproach(id, { rightTurn: { ...rt, radiusM: n } })}
          />
          <Num
            label="出入口宽度"
            value={rt.widthM}
            unit="m"
            min={1}
            step={0.1}
            onChange={(n) => updateApproach(id, { rightTurn: { ...rt, widthM: n } })}
          />
        </div>
        <div className="field-row">
          <Num
            label="右转道宽"
            value={rt.channelWidthM ?? rt.widthM}
            unit="m"
            min={3}
            step={0.1}
            onChange={(n) => updateApproach(id, { rightTurn: { ...rt, channelWidthM: n } })}
          />
          <Num
            label="岛偏移"
            value={rt.islandOffsetM ?? 0}
            unit="m"
            step={0.2}
            onChange={(n) => updateApproach(id, { rightTurn: { ...rt, islandOffsetM: n } })}
          />
        </div>
        <label className="rg-check">
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
          安全岛
        </label>
        {(si?.enabled ?? false) && (
          <div className="field-row">
            <Num
              label="安全岛半径"
              value={si?.radiusM ?? 3.5}
              unit="m"
              min={1}
              step={0.1}
              onChange={(n) =>
                updateApproach(id, {
                  rightTurn: {
                    ...rt,
                    safetyIsland: {
                      enabled: true,
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
            <Num
              label="退距"
              value={si?.setbackM ?? 1.5}
              unit="m"
              min={0}
              step={0.1}
              onChange={(n) =>
                updateApproach(id, {
                  rightTurn: {
                    ...rt,
                    safetyIsland: {
                      enabled: true,
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
          </div>
        )}
      </div>

      {/* 进口属性 */}
      <div className="rg-section">
        <div className="rg-section-title">进口属性</div>
        <div className="field-row">
          <Num
            label="进口车道"
            value={ap.entryLanes.length}
            unit="个"
            min={1}
            max={8}
            onChange={(n) => setLaneCount(id, n)}
          />
          <Num
            label="车道宽度"
            value={ap.entryLanes[0]?.widthM ?? 3.5}
            unit="m"
            min={2.5}
            max={4.5}
            step={0.05}
            onChange={(n) => {
              // apply width to all entry lanes for RoadGee-like single control
              ap.entryLanes.forEach((_, i) => setLaneWidth(id, i, n))
            }}
          />
        </div>
        <div className="field-row">
          <Num
            label="进口展宽"
            value={w.entryWidenCount}
            unit="个"
            min={0}
            max={4}
            onChange={(n) => updateApproach(id, { widen: { ...w, entryWidenCount: n } })}
          />
          <Num
            label="展宽车道宽度"
            value={w.entryWidenWidthM}
            unit="m"
            min={0}
            step={0.1}
            onChange={(n) => updateApproach(id, { widen: { ...w, entryWidenWidthM: n } })}
          />
        </div>
        <div className="field-row">
          <Num
            label="展宽段长"
            value={w.entryWidenLengthM}
            unit="m"
            min={0}
            onChange={(n) => updateApproach(id, { widen: { ...w, entryWidenLengthM: n } })}
          />
          <Num
            label="外侧渐变段长"
            value={w.entryTaperM}
            unit="m"
            min={0}
            onChange={(n) => updateApproach(id, { widen: { ...w, entryTaperM: n } })}
          />
        </div>
        <div className="field-row">
          <Num
            label="内侧偏移"
            value={w.innerOffsetM}
            unit="m"
            step={0.1}
            onChange={(n) => updateApproach(id, { widen: { ...w, innerOffsetM: n } })}
          />
          <Num
            label="内侧渐变段长"
            value={w.entryTaperM}
            unit="m"
            min={0}
            onChange={(n) => updateApproach(id, { widen: { ...w, entryTaperM: n } })}
          />
        </div>
      </div>

      {/* 出口属性 */}
      <div className="rg-section">
        <div className="rg-section-title">出口属性</div>
        <div className="field-row">
          <Num
            label="出口车道"
            value={ap.exitLanes.length}
            unit="个"
            min={1}
            max={8}
            onChange={(n) => setExitLaneCount?.(id, n)}
          />
          <Num
            label="车道宽度"
            value={ap.exitLanes[0]?.widthM ?? 3.5}
            unit="m"
            min={2.5}
            max={4.5}
            step={0.05}
            onChange={(n) => {
              const lanes = ap.exitLanes.map((ln) => ({ ...ln, widthM: Math.max(2.5, Math.min(4.5, n)) }))
              updateApproach(id, { exitLanes: lanes })
            }}
          />
        </div>
        <div className="field-row">
          <Num
            label="出口展宽"
            value={w.exitWidenCount}
            unit="个"
            min={0}
            max={4}
            onChange={(n) => updateApproach(id, { widen: { ...w, exitWidenCount: n } })}
          />
          <Num
            label="展宽车道宽度"
            value={w.exitWidenWidthM}
            unit="m"
            min={0}
            step={0.1}
            onChange={(n) => updateApproach(id, { widen: { ...w, exitWidenWidthM: n } })}
          />
        </div>
        <div className="field-row">
          <Num
            label="展宽段长"
            value={w.exitWidenLengthM}
            unit="m"
            min={0}
            onChange={(n) => updateApproach(id, { widen: { ...w, exitWidenLengthM: n } })}
          />
          <Num
            label="渐变段长"
            value={w.exitTaperM}
            unit="m"
            min={0}
            onChange={(n) => updateApproach(id, { widen: { ...w, exitTaperM: n } })}
          />
        </div>
      </div>

      {/* 中央隔离 */}
      <div className="rg-section">
        <div className="rg-section-title">中央隔离</div>
        <div className="field-row">
          <label>
            分割形式
            <select
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
          </label>
          <Num
            label="分割带宽"
            value={med.widthM}
            unit="m"
            min={0}
            step={0.1}
            onChange={(n) => updateApproach(id, { median: { ...med, widthM: n } })}
          />
        </div>
      </div>

      {/* 非机动车道 */}
      <div className="rg-section">
        <div className="rg-section-title">非机动车道</div>
        <div className="field-row">
          <label>
            进口
            <select
              value={ap.bikeEnabled ? 'yes' : 'no'}
              onChange={(e) => updateApproach(id, { bikeEnabled: e.target.value === 'yes' })}
            >
              <option value="no">否</option>
              <option value="yes">是</option>
            </select>
          </label>
          <Num
            label="车道宽度"
            value={ap.bikeWidthM}
            unit="m"
            min={1}
            step={0.1}
            onChange={(n) => updateApproach(id, { bikeWidthM: n, bikeEnabled: n > 0 })}
          />
        </div>
      </div>

      {/* 辅路 */}
      <div className="flat-section rg-section">
        <div className="rg-section-title">
          辅路属性
        </div>
        <div className="flat-body">
          <label className="rg-check">
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
            启用辅路
          </label>
          {ap.auxRoad?.enabled && (
            <div className="field-row">
              <Num
                label="辅路宽"
                value={ap.auxRoad.widthM}
                unit="m"
                min={3}
                step={0.1}
                onChange={(n) => updateApproach(id, { auxRoad: { ...ap.auxRoad!, widthM: n } })}
              />
              <Num
                label="外偏距"
                value={ap.auxRoad.offsetM ?? 1}
                unit="m"
                min={0}
                step={0.1}
                onChange={(n) => updateApproach(id, { auxRoad: { ...ap.auxRoad!, offsetM: n } })}
              />
              <Num
                label="开口退距"
                value={ap.auxRoad.openNearM ?? 18}
                unit="m"
                min={5}
                onChange={(n) => updateApproach(id, { auxRoad: { ...ap.auxRoad!, openNearM: n } })}
              />
            </div>
          )}
        </div>
      </div>

      {/* 更多 */}
      <div className="flat-section rg-section">
        <div className="rg-section-title">
          更多属性
        </div>
        <div className="flat-body">
          <div className="field-row">
            <Num
              label="进口倾斜"
              value={ap.tiltEntryDeg}
              unit="°"
              step={1}
              onChange={(n) => updateApproach(id, { tiltEntryDeg: n })}
            />
            <Num
              label="出口倾斜"
              value={ap.tiltExitDeg}
              unit="°"
              step={1}
              onChange={(n) => updateApproach(id, { tiltExitDeg: n })}
            />
          </div>
        </div>
      </div>

      {/* 分车道明细 */}
      <div className="flat-section rg-section">
        <div className="rg-section-title">
          分车道宽 / 转向 / 可变
        </div>
        <div className="flat-body">
          {ap.entryLanes.map((ln, i) => (
            <div key={ln.id} className="lane-edit-row">
              <div className="field-row" style={{ alignItems: 'end' }}>
                <label>
                  车道{i + 1}宽
                  <input
                    type="number"
                    step={0.05}
                    value={ln.widthM}
                    onChange={(e) => setLaneWidth(id, i, Number(e.target.value))}
                  />
                </label>
                <label>
                  转向 (ULTR)
                  <input
                    value={ln.movements.join('')}
                    onChange={(e) => {
                      const raw = e.target.value.toUpperCase().replace(/[^ULTR]/g, '')
                      const movs = Array.from(new Set(raw.split(''))) as Movement[]
                      setLaneMovements(id, i, movs)
                    }}
                  />
                </label>
                <label className="rg-check">
                  <input
                    type="checkbox"
                    checked={!!ln.variable}
                    onChange={(e) => setLaneVariable(id, i, e.target.checked)}
                  />
                  可变
                </label>
              </div>
              {i < ap.entryLanes.length - 1 && (
                <button type="button" className="ghost" onClick={() => mergeLaneGroup(id, i, i + 1)}>
                  与下道合并组
                </button>
              )}
            </div>
          ))}
          {ap.laneGroups.length > 0 && (
            <table className="table table-dense" style={{ marginTop: 8 }}>
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
                      {g.laneIds.length > 1 && (
                        <button type="button" className="ghost" onClick={() => splitLaneGroupAt(id, g.id)}>
                          拆组
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
