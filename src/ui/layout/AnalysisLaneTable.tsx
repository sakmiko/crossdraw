/**
 * Analysis detail table with sort + filter; CSV export uses same visible rows.
 */
import { useMemo, useState } from 'react'
import type { AnalysisResult } from '@/domain/types'
import {
  enrichLaneRows,
  filterAnalysisLanes,
  sortAnalysisLanes,
  uniqueApproaches,
  type AnalysisSortKey,
} from '@/domain/analysis/laneTable'
import { analysisToCsv, analysisToExcelHtml } from '@/io/report'
import { downloadText } from '@/io/download'
import { vcHeatColor } from '@/ui/charts/svgCharts'

export function AnalysisLaneTable({
  analysis,
  projectName,
}: {
  analysis: AnalysisResult
  projectName: string
}) {
  const [sortKey, setSortKey] = useState<AnalysisSortKey>('vc')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [approach, setApproach] = useState<string>('all')
  const [movement, setMovement] = useState<string>('all')
  const [minVc, setMinVc] = useState(0)
  const [minDelay, setMinDelay] = useState(0)

  const base = useMemo(() => enrichLaneRows(analysis), [analysis])
  const approaches = useMemo(() => uniqueApproaches(base), [base])

  const rows = useMemo(() => {
    const filtered = filterAnalysisLanes(base, {
      approach,
      movement,
      minVc: minVc > 0 ? minVc : undefined,
      minDelay: minDelay > 0 ? minDelay : undefined,
    })
    return sortAnalysisLanes(filtered, sortKey, sortDir)
  }, [base, approach, movement, minVc, minDelay, sortKey, sortDir])

  function toggleSort(k: AnalysisSortKey) {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'approachName' || k === 'movement' ? 'asc' : 'desc')
    }
  }

  function sortMark(k: AnalysisSortKey) {
    if (sortKey !== k) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const filter = {
    approach,
    movement,
    minVc: minVc > 0 ? minVc : undefined,
    minDelay: minDelay > 0 ? minDelay : undefined,
  }

  return (
    <div className="analysis-lane-table">
      <div className="toolbar analysis-table-filters" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <label>
          进口
          <select value={approach} onChange={(e) => setApproach(e.target.value)}>
            <option value="all">全部</option>
            {approaches.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          转向
          <select value={movement} onChange={(e) => setMovement(e.target.value)}>
            <option value="all">全部</option>
            <option value="L">L</option>
            <option value="T">T</option>
            <option value="R">R</option>
          </select>
        </label>
        <label>
          最小 v/c
          <input
            type="number"
            step={0.05}
            min={0}
            max={2}
            value={minVc}
            onChange={(e) => setMinVc(Number(e.target.value))}
            style={{ width: 72 }}
          />
        </label>
        <label>
          最小延误
          <input
            type="number"
            step={5}
            min={0}
            value={minDelay}
            onChange={(e) => setMinDelay(Number(e.target.value))}
            style={{ width: 72 }}
          />
        </label>
        <span className="hint">
          显示 {rows.length}/{base.length} 行 · 导出与表一致
        </span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button type="button" className="ghost th-sort" onClick={() => toggleSort('approachName')}>
                  进口{sortMark('approachName')}
                </button>
              </th>
              <th>
                <button type="button" className="ghost th-sort" onClick={() => toggleSort('movement')}>
                  转向{sortMark('movement')}
                </button>
              </th>
              <th>
                <button type="button" className="ghost th-sort" onClick={() => toggleSort('volumePeak')}>
                  高峰量{sortMark('volumePeak')}
                </button>
              </th>
              <th>
                <button type="button" className="ghost th-sort" onClick={() => toggleSort('vc')}>
                  v/c{sortMark('vc')}
                </button>
              </th>
              <th>
                <button type="button" className="ghost th-sort" onClick={() => toggleSort('delaySec')}>
                  延误{sortMark('delaySec')}
                </button>
              </th>
              <th>
                <button type="button" className="ghost th-sort" onClick={() => toggleSort('queueM')}>
                  排队m{sortMark('queueM')}
                </button>
              </th>
              <th>LOS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => (
              <tr key={`${l.approachId}-${l.movement}-${i}`}>
                <td>{l.approachName}</td>
                <td>{l.movement}</td>
                <td>{l.volumePeak.toFixed(0)}</td>
                <td>
                  <span className="vc-chip" style={{ background: vcHeatColor(l.vc) }}>
                    {l.vc.toFixed(2)}
                  </span>
                </td>
                <td className={l.delaySec >= 80 ? 'cell-hot' : l.delaySec >= 55 ? 'cell-warm' : ''}>
                  {l.delaySec.toFixed(1)}
                </td>
                <td>{l.queueM.toFixed(1)}</td>
                <td>
                  <span className={`los-badge los-${l.losFinal}`}>{l.losFinal}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="hint">
                  无匹配行，请放宽筛选
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="toolbar" style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() =>
            downloadText(
              `${projectName}-analysis.csv`,
              analysisToCsv(analysis, { filter, sortKey, sortDir }),
              'text/csv',
            )
          }
        >
          导出 CSV（当前筛选）
        </button>
        <button
          type="button"
          onClick={() =>
            downloadText(
              `${projectName}-analysis.xls`,
              analysisToExcelHtml(projectName, analysis),
              'application/vnd.ms-excel',
            )
          }
        >
          导出 Excel（全量）
        </button>
      </div>
    </div>
  )
}
