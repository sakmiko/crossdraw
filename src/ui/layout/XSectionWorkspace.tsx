/**
 * Cross-section workspace — KPI strip, schematic bar, professional chart, export.
 * Extracted from App (v0.5.45). Keeps section fully driven by selected approach.
 */
import type { Approach, CrossSection } from '@/domain/types'
import { markStaleIfNeeded } from '@/domain/xsection/build'
import { sectionAlignsWithApproach } from '@/domain/xsection/align'
import { CrossSectionCharts } from '@/ui/charts/ChartPanels'
import { professionalCrossSectionSvg } from '@/ui/charts/crossSectionDiagram'
import { exportSvgFile } from '@/io/exportCharts'

export type XSectionWorkspaceProps = {
  projectName: string
  selected: Approach
  xsection: CrossSection
  theme: 'dark' | 'light'
}

export function XSectionWorkspace({ projectName, selected, xsection, theme }: XSectionWorkspaceProps) {
  const totalW = xsection.components.reduce((s, c) => s + c.widthM, 0)
  const stale = markStaleIfNeeded(xsection, selected).stale
  const align = sectionAlignsWithApproach(selected)
  const bikeW = selected.bikeEnabled ? selected.bikeWidthM : 0
  const sideW = selected.sidewalkWidthM

  return (
    <div className="card" style={{ marginTop: 12 }}>
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
      </div>
      <div className="xsection" style={{ marginTop: 8 }} aria-label="横断面色带">
        {xsection.components.map((c, i) => (
          <div key={i} style={{ flex: c.widthM, background: c.color }} title={`${c.label} ${c.widthM}m`}>
            {c.widthM >= 2 ? `${c.label} ${c.widthM}m` : ''}
          </div>
        ))}
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <thead>
          <tr>
            <th>构成</th>
            <th>类型</th>
            <th>宽度 m</th>
          </tr>
        </thead>
        <tbody>
          {xsection.components.map((c, i) => (
            <tr key={i}>
              <td>{c.label}</td>
              <td className="hint">{c.type}</td>
              <td>{c.widthM.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <CrossSectionCharts section={xsection} approach={selected} />
      <div className="toolbar" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="primary"
          onClick={() => {
            exportSvgFile(
              `${projectName}-${selected.name}-xsection.svg`,
              professionalCrossSectionSvg(xsection, selected, { theme }),
            )
          }}
        >
          导出标准断面图
        </button>
      </div>
      <p className="hint">修改渠化车道宽/中分带/人行道/非机动车后，本图与 KPI 立即联动刷新（同源 approach）。</p>
    </div>
  )
}
