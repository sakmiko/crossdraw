/**
 * Cross-section workspace — professional KPI + interactive width editor.
 * Edits push back to approach params so mesh/charts stay homologous.
 */
import { useMemo, useState } from 'react'
import type { Approach, CrossSection } from '@/domain/types'
import { markStaleIfNeeded } from '@/domain/xsection/build'
import { sectionAlignsWithApproach } from '@/domain/xsection/align'
import { CrossSectionCharts } from '@/ui/charts/ChartPanels'
import { EChart } from '@/ui/charts/EChart'
import { crossSectionBarOption } from '@/ui/charts/interactiveBoards'
import { xsectionWidthOption } from '@/ui/charts/interactiveBoards'
import { professionalCrossSectionSvg } from '@/ui/charts/crossSectionDiagram'
import { exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'
import { downloadEchartsPng } from '@/io/exportEchartsPng'
import {
  buildSectionReport,
  componentsForDiagram,
  sectionReportCsv,
  sectionReportMarkdown,
} from '@/domain/xsection/report' 

export type XSectionWorkspaceProps = {
  projectName: string
  selected: Approach
  xsection: CrossSection
  theme: 'dark' | 'light'
  /** push width edits to channel approach (同源) */
  onUpdateApproach?: (id: string, patch: Partial<Approach>) => void
}

export function XSectionWorkspace({
  projectName,
  selected,
  xsection,
  theme,
  onUpdateApproach,
}: XSectionWorkspaceProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const totalW = xsection.components.reduce((s, c) => s + c.widthM, 0)
  const stale = markStaleIfNeeded(xsection, selected).stale
  const align = sectionAlignsWithApproach(selected)
  const bikeW = selected.bikeEnabled ? selected.bikeWidthM : 0
  const sideW = selected.sidewalkWidthM
  const report = useMemo(() => buildSectionReport(selected, xsection), [selected, xsection])
  const diagramComps = useMemo(() => componentsForDiagram(selected, xsection), [selected, xsection])
  const proSvg = useMemo(
    () =>
      professionalCrossSectionSvg(xsection, selected, {
        theme,
        componentsOverride: diagramComps,
      }),
    [xsection, selected, theme, diagramComps],
  )

  const editable = useMemo(() => {
    // map component index → edit target
    return xsection.components.map((c, i) => {
      if (c.type === 'sidewalk') return { kind: 'sidewalk' as const, label: c.label }
      if (c.type === 'bike') return { kind: 'bike' as const, label: c.label }
      if (c.type === 'median') return { kind: 'median' as const, label: c.label }
      if (c.type === 'vehicle') {
        // entry then exit order in buildCrossSection
        return { kind: 'vehicle' as const, label: c.label, index: i }
      }
      return { kind: 'other' as const, label: c.label }
    })
  }, [xsection.components])

  function applyWidth(compIndex: number, widthM: number) {
    if (!onUpdateApproach) return
    const c = xsection.components[compIndex]
    if (!c) return
    const w = Math.max(0.3, Math.min(12, widthM))
    if (c.type === 'sidewalk') {
      onUpdateApproach(selected.id, { sidewalkWidthM: w })
      return
    }
    if (c.type === 'bike') {
      onUpdateApproach(selected.id, { bikeWidthM: w, bikeEnabled: true })
      return
    }
    if (c.type === 'median') {
      onUpdateApproach(selected.id, { median: { ...selected.median, widthM: w } })
      return
    }
    if (c.type === 'vehicle') {
      // count entry labels vs exit
      const entryComps = xsection.components
        .map((x, idx) => ({ x, idx }))
        .filter((p) => p.x.type === 'vehicle' && p.x.label.startsWith('进口'))
      const exitComps = xsection.components
        .map((x, idx) => ({ x, idx }))
        .filter((p) => p.x.type === 'vehicle' && p.x.label.startsWith('出口'))
      const eAt = entryComps.findIndex((p) => p.idx === compIndex)
      if (eAt >= 0) {
        const lanes = selected.entryLanes.map((ln, i) => (i === eAt ? { ...ln, widthM: w } : ln))
        onUpdateApproach(selected.id, { entryLanes: lanes })
        return
      }
      const xAt = exitComps.findIndex((p) => p.idx === compIndex)
      if (xAt >= 0) {
        const lanes = selected.exitLanes.map((ln, i) => (i === xAt ? { ...ln, widthM: w } : ln))
        onUpdateApproach(selected.id, { exitLanes: lanes })
      }
    }
  }

  return (
    <div className="flat-params xsection-workspace" style={{ marginTop: 12 }}>
      <div className="panel-header">
        <h2 style={{ margin: 0 }}>横断面 · {selected.name}</h2>
        <span className={`integrity-badge ${align.ok && !stale ? 'ok' : 'bad'}`}>
          {align.ok && !stale ? '断面同源 ✓' : stale ? '需重绘' : '宽度不一致'}
        </span>
      </div>

      <div className="metric-grid band-kpi" style={{ marginTop: 8 }}>
        <div className="metric">
          <div className="label">总宽 B</div>
          <div className="value">
            {totalW.toFixed(2)}
            <small> m</small>
          </div>
        </div>
        <div className="metric">
          <div className="label">进口车道</div>
          <div className="value">{selected.entryLanes.length}</div>
        </div>
        <div className="metric">
          <div className="label">出口车道</div>
          <div className="value">{selected.exitLanes.length}</div>
        </div>
        <div className="metric">
          <div className="label">中分带</div>
          <div className="value">
            {selected.median.widthM.toFixed(1)}
            <small> m</small>
          </div>
        </div>
        <div className="metric">
          <div className="label">人行道×2</div>
          <div className="value">
            {(sideW * 2).toFixed(1)}
            <small> m</small>
          </div>
        </div>
        <div className="metric">
          <div className="label">非机动车</div>
          <div className="value">
            {bikeW > 0 ? bikeW.toFixed(1) : '—'}
            {bikeW > 0 && <small> m</small>}
          </div>
        </div>
        <div className="metric">
          <div className="label">辅路</div>
          <div className="value">
            {report.auxEnabled ? report.auxWidthM.toFixed(1) : '—'}
            {report.auxEnabled && <small> m</small>}
          </div>
        </div>
        <div className="metric">
          <div className="label">特殊标线</div>
          <div className="value" style={{ fontSize: 13 }}>
            {[report.leftWait && '左待', report.throughWait && '直待', report.borrowLeft && '借道']
              .filter(Boolean)
              .join(' · ') || '—'}
          </div>
        </div>
      </div>

      {/* interactive strip */}
      <div className="xsection xsection--interactive" style={{ marginTop: 12 }} aria-label="横断面色带">
        {xsection.components.map((c, i) => (
          <div
            key={i}
            className={hoverIdx === i ? 'xs-seg active' : 'xs-seg'}
            style={{ flex: Math.max(c.widthM, 0.4), background: c.color }}
            title={`${c.label} ${c.widthM}m — 拖动下方滑条改宽`}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {c.widthM >= 1.8 ? (
              <span className="xs-seg-label">
                {c.label}
                <em>{c.widthM.toFixed(1)}</em>
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 12 }}>
        构成编辑（回写渠化 · 图网同源）
      </div>
      <div className="table-wrap" style={{ maxHeight: 220 }}>
        <table className="table">
          <thead>
            <tr>
              <th>构成</th>
              <th>类型</th>
              <th>宽度 m</th>
              <th>调节</th>
            </tr>
          </thead>
          <tbody>
            {xsection.components.map((c, i) => (
              <tr key={i} className={hoverIdx === i ? 'row-hot' : undefined}>
                <td>
                  <span className="swatch" style={{ background: c.color }} />
                  {c.label}
                </td>
                <td className="hint">{c.type}</td>
                <td>{c.widthM.toFixed(2)}</td>
                <td style={{ minWidth: 140 }}>
                  {onUpdateApproach && c.type !== 'shoulder' && c.type !== 'green' ? (
                    <input
                      type="range"
                      min={c.type === 'median' ? 0.3 : 0.5}
                      max={c.type === 'sidewalk' ? 8 : 6}
                      step={0.05}
                      value={c.widthM}
                      onChange={(e) => applyWidth(i, Number(e.target.value))}
                      onMouseEnter={() => setHoverIdx(i)}
                    />
                  ) : (
                    <span className="hint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title" style={{ marginTop: 12 }}>标准断面图（预览）</div>
      <div
        className="chart-svg-host chart-svg-host--pro"
        dangerouslySetInnerHTML={{ __html: proSvg }}
      />

      <div className="section-title" style={{ marginTop: 12 }}>构成报表</div>
      <div className="table-wrap" style={{ maxHeight: 180 }}>
        <table className="table table-dense">
          <thead>
            <tr>
              <th>#</th>
              <th>构成</th>
              <th>类型</th>
              <th>宽度 m</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {report.components.map((c) => (
              <tr key={c.index}>
                <td className="num">{c.index + 1}</td>
                <td>
                  <span className="swatch" style={{ background: c.color }} />
                  {c.label}
                </td>
                <td className="hint">{c.type}</td>
                <td className="num">{c.widthM.toFixed(2)}</td>
                <td className="num">{c.sharePct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rg-section" id="xsection-echarts">
        <div className="rg-section-title">
          交互断面 · 构件宽度 / 类型占比
          <button
            type="button"
            className="ghost"
            onClick={() =>
              void downloadEchartsPng(
                `${projectName}-断面宽度.png`,
                xsectionWidthOption(diagramComps.length ? diagramComps : xsection.components),
                { width: 960, height: 420 },
              )
            }
          >
            导出 PNG
          </button>
        </div>
        <EChart
          option={xsectionWidthOption(diagramComps.length ? diagramComps : xsection.components)}
          style={{ height: 280 }}
        />
      </div>
      <CrossSectionCharts section={xsection} approach={selected} />

      <div className="toolbar" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="primary"
          onClick={() => {
            exportSvgFile(`${projectName}-${selected.name}-xsection.svg`, proSvg)
          }}
        >
          导出标准断面图
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() =>
            downloadText(
              `${projectName}-${selected.name}-xsection.md`,
              sectionReportMarkdown(projectName, report),
              'text/markdown',
            )
          }
        >
          报表 MD
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() =>
            downloadText(
              `${projectName}-${selected.name}-xsection.csv`,
              sectionReportCsv(report),
              'text/csv',
            )
          }
        >
          报表 CSV
        </button>
      </div>
    </div>
  )
}
