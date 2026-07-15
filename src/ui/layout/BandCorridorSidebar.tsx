/**
 * Green-band multi-corridor sidebar — list, switch, batch optimize KPIs.
 */
import { useMemo } from 'react'
import type { BandCorridor } from '@/domain/types'
import { measureCorridor } from '@/domain/analysis/corridor'
import { collectCorridorKpis } from '@/ui/charts/bandCorridorCompare'

const METHOD_SHORT: Record<string, string> = {
  classic: '经典',
  'optimized-scan': '扫描',
  'one-way': '单向',
  'two-way-equal': '等带',
  graphical: '图解',
}

export function BandCorridorSidebar({
  corridors,
  activeId,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
  onOptimizeAll,
  batchNote,
}: {
  corridors: BandCorridor[]
  activeId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onDuplicate: () => void
  onRemove: (id: string) => void
  onOptimizeAll: () => void
  batchNote?: string | null
}) {
  const rows = useMemo(() => collectCorridorKpis(corridors), [corridors])
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  return (
    <div className="band-corridor-sidebar">
      <div className="panel-header" style={{ marginBottom: 6 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>走廊列表</h3>
        <span className="hint">{corridors.length} 条</span>
      </div>
      <div className="band-corridor-list" role="listbox" aria-label="绿波走廊">
        {corridors.map((c) => {
          const k = byId.get(c.id)
          const active = c.id === activeId
          const ratio = k ? (k.bandwidthRatio * 100).toFixed(0) : '—'
          const fwd = k ? k.forwardSec.toFixed(0) : '—'
          const bwd = k ? k.backwardSec.toFixed(0) : '—'
          return (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={active}
              className={`band-corridor-item ${active ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <div className="bci-title">
                <strong>{c.name}</strong>
                <span className="bci-method">{METHOD_SHORT[c.method] ?? c.method}</span>
              </div>
              <div className="bci-meta">
                {c.nodes.length} 节点 · {c.speedKmh} km/h
              </div>
              <div className="bci-kpi">
                <span title="带宽比">比 {ratio}%</span>
                <span title="上行带宽 s">↑{fwd}s</span>
                <span title="下行带宽 s">↓{bwd}s</span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="toolbar" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
        <button type="button" onClick={onAdd}>
          + 新建
        </button>
        <button type="button" onClick={onDuplicate}>
          复制
        </button>
        <button
          type="button"
          className="ghost"
          disabled={corridors.length <= 1}
          onClick={() => onRemove(activeId)}
        >
          删除
        </button>
        <button type="button" className="primary" onClick={onOptimizeAll}>
          批量优化全部
        </button>
      </div>
      {batchNote && <p className="hint" style={{ marginTop: 6 }}>{batchNote}</p>}
      <p className="hint" style={{ marginTop: 4 }}>
        KPI 与 measureCorridor 同源；批量优化逐条独立计算，保留锁定相位差。
      </p>
    </div>
  )
}

/** Lightweight re-export for tests without React */
export function listCorridorSidebarKpis(corridors: BandCorridor[]) {
  return corridors.map((c) => {
    const m = measureCorridor(c)
    return {
      id: c.id,
      name: c.name,
      ratio: m.bandwidthRatio,
      forward: m.forwardBandwidthSec ?? m.bandwidthSec,
      backward: m.backwardBandwidthSec ?? 0,
    }
  })
}
