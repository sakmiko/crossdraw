/**
 * Scheme compare workspace — multi-scheme evaluation table and exports.
 * Extracted from App (v0.5.44).
 */
import { useMemo, useState } from 'react'
import type { Project } from '@/domain/types'
import { analyzeIntersection } from '@/domain/analysis'
import { CompareCharts, SchemeCompareBoard } from '@/ui/charts/ChartPanels'
import { collectCompareRows, compareSchemesCsv } from '@/io/report'
import { collectSchemeSnapshots, schemeTimingStripSvg, schemeMetricsCompareSvg } from '@/ui/charts/schemeCompareDiagrams'
import {
  schemeScorecardSvg,
  kpisFromCompareRows,
  recommendBestLabel,
} from '@/ui/charts/schemeScorecard'
import { schemeDeltas, schemeDeltaMarkdown } from '@/domain/analysis/schemeDiff' 
import { exportJsonFile, exportSvgFile } from '@/io/exportCharts'
import { downloadText } from '@/io/download'
import { vcHeatColor } from '@/ui/charts/svgCharts'

export type CompareWorkspaceProps = {
  project: Project
  theme: 'dark' | 'light'
  onActivateScheme: (channelName: string, flowName: string, signalName: string) => void
}

export function CompareWorkspace({ project, theme, onActivateScheme }: CompareWorkspaceProps) {
  const [sortKey, setSortKey] = useState<'delay' | 'vc' | 'name'>('delay')
  const [baseKey, setBaseKey] = useState<string>('')
  const rows = useMemo(() => {
    const raw = collectCompareRows(project, analyzeIntersection)
    return raw.slice().sort((a, b) => {
      if (sortKey === 'vc') return b.avgVc - a.avgVc
      if (sortKey === 'name') return a.channel.localeCompare(b.channel, 'zh')
      return a.avgDelay - b.avgDelay
    })
  }, [project, sortKey])
  const snaps = useMemo(() => collectSchemeSnapshots(project, analyzeIntersection), [project])
  const cycleMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const sn of snaps) m[`${sn.channel}/${sn.flow}/${sn.signal}`] = sn.cycleSec
    return m
  }, [snaps])
  const kpis = useMemo(() => kpisFromCompareRows(rows, cycleMap), [rows, cycleMap])
  const baseLabel = baseKey || kpis[0]?.label || ''
  const baseIdx = Math.max(0, kpis.findIndex((k) => k.label === baseLabel))
  const baseKpi = kpis[baseIdx] ?? kpis[0]
  const deltas = useMemo(
    () => (baseKpi ? schemeDeltas(baseKpi, kpis) : []),
    [baseKpi, kpis],
  )
  const best = recommendBestLabel(kpis)
  const scoreSvg = useMemo(
    () => schemeScorecardSvg(kpis, { width: 680, baseIndex: baseIdx }),
    [kpis, baseIdx],
  )

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="panel-header">
        <h2 style={{ margin: 0 }}>方案比选</h2>
        <span className="hint">渠化 × 流量 × 信号 组合评价</span>
      </div>
      
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <label>
          排序
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)}>
            <option value="delay">延误升序</option>
            <option value="vc">v/c 降序</option>
            <option value="name">渠化名</option>
          </select>
        </label>
        <label>
          基准方案
          <select value={baseLabel} onChange={(e) => setBaseKey(e.target.value)}>
            {kpis.map((k) => (
              <option key={k.label} value={k.label}>{k.label}</option>
            ))}
          </select>
        </label>
        {best && (
          <span className="subpanel-tag" title="延误最低优先">推荐 {best.split('/').slice(-1)[0]}</span>
        )}
      </div>
      <div
        className="chart-svg-host chart-svg-host--pro"
        style={{ marginBottom: 10 }}
        dangerouslySetInnerHTML={{ __html: scoreSvg }}
      />
      {deltas.length > 0 && (
        <div className="table-wrap" style={{ marginBottom: 10, maxHeight: 160 }}>
          <table className="table table-dense">
            <thead>
              <tr>
                <th>相对基准</th>
                <th>Δv/c</th>
                <th>Δ延误s</th>
                <th>更优</th>
              </tr>
            </thead>
            <tbody>
              {deltas.map((d) => (
                <tr key={d.label}>
                  <td>{d.label}</td>
                  <td className="num">{d.dVc >= 0 ? '+' : ''}{d.dVc.toFixed(3)}</td>
                  <td className="num">{d.dDelay >= 0 ? '+' : ''}{d.dDelay.toFixed(1)}</td>
                  <td>{d.better ? '是' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CompareCharts
        rows={rows.map((r) => ({
          label: `${r.channel}/${r.signal}`,
          avgVc: r.avgVc,
          avgDelay: r.avgDelay,
          los: r.los,
        }))}
      />
      <SchemeCompareBoard project={project} />
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table className="table">
          <thead>
            <tr>
              <th>渠化</th>
              <th>流量</th>
              <th>信号</th>
              <th>v/c</th>
              <th>延误</th>
              <th>LOS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.channel}</td>
                <td>{r.flow}</td>
                <td>{r.signal}</td>
                <td>
                  <span className="vc-chip" style={{ background: vcHeatColor(r.avgVc) }}>
                    {r.avgVc.toFixed(2)}
                  </span>
                </td>
                <td>{r.avgDelay.toFixed(1)}</td>
                <td>
                  <span className={`los-badge los-${r.los}`}>{r.los}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => onActivateScheme(r.channel, r.flow, r.signal)}
                  >
                    打开
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="toolbar" style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() => {
            downloadText(`${project.name}-compare.csv`, compareSchemesCsv(rows), 'text/csv')
          }}
        >
          导出比选 CSV
        </button>
        <button
          type="button"
          onClick={() => {
            exportJsonFile(`${project.name}-compare.json`, rows)
          }}
        >
          导出比选 JSON
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => {
            exportSvgFile(`${project.name}-compare-timing.svg`, schemeTimingStripSvg(snaps, { max: 4, theme }))
            exportSvgFile(
              `${project.name}-compare-delay.svg`,
              schemeMetricsCompareSvg(snaps, { metric: 'delay' }),
            )
            exportSvgFile(`${project.name}-compare-vc.svg`, schemeMetricsCompareSvg(snaps, { metric: 'vc' }))
            exportSvgFile(`${project.name}-compare-scorecard.svg`, scoreSvg)
            if (baseKpi) {
              downloadText(
                `${project.name}-compare-delta.md`,
                schemeDeltaMarkdown(project.name, baseKpi, deltas),
                'text/markdown',
              )
            }
          }}
        >
          导出并排图/记分卡
        </button>
      </div>
      
    </div>
  )
}
