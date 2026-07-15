import { useMemo, useState } from 'react'
import {
  CATEGORY_LABEL,
  EXPORT_CATALOG,
  exportIntegrityNotes,
  isExportAvailable,
  type ExportCategory,
  type ExportContext,
  type ExportItem,
  type ExportItemId,
} from '@/io/exportCatalog'

export type ExportCenterHandlers = Partial<Record<ExportItemId, () => void | Promise<void>>>

export function ExportCenter({
  open,
  onClose,
  ctx,
  handlers,
  currentMode,
}: {
  open: boolean
  onClose: () => void
  ctx: ExportContext
  handlers: ExportCenterHandlers
  currentMode?: string
}) {
  const [filter, setFilter] = useState<'all' | ExportCategory | 'ready'>('all')
  const [q, setQ] = useState('')
  const [log, setLog] = useState<string[]>([])

  const items = useMemo(() => {
    let list = EXPORT_CATALOG.slice()
    if (filter === 'ready') list = list.filter((i) => isExportAvailable(i, ctx))
    else if (filter !== 'all') list = list.filter((i) => i.category === filter)
    if (q.trim()) {
      const qq = q.trim().toLowerCase()
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(qq) ||
          i.format.toLowerCase().includes(qq) ||
          i.description.toLowerCase().includes(qq),
      )
    }
    // prioritize current mode
    if (currentMode) {
      list = list.slice().sort((a, b) => {
        const am = a.modes?.includes(currentMode) ? 0 : 1
        const bm = b.modes?.includes(currentMode) ? 0 : 1
        return am - bm
      })
    }
    return list
  }, [filter, q, ctx, currentMode])

  const byCat = useMemo(() => {
    const m = new Map<ExportCategory, ExportItem[]>()
    for (const it of items) {
      const arr = m.get(it.category) ?? []
      arr.push(it)
      m.set(it.category, arr)
    }
    return m
  }, [items])

  if (!open) return null

  async function run(item: ExportItem) {
    const fn = handlers[item.id]
    if (!fn) {
      setLog((L) => [`未绑定：${item.title}`, ...L].slice(0, 6))
      return
    }
    if (!isExportAvailable(item, ctx)) {
      setLog((L) => [`缺条件：${item.title}`, ...L].slice(0, 6))
      return
    }
    try {
      await fn()
      setLog((L) => [`已导出 ${item.title}（${item.format}）`, ...L].slice(0, 6))
    } catch (e) {
      setLog((L) => [`失败 ${item.title}: ${String(e)}`, ...L].slice(0, 6))
    }
  }

  const cats = Array.from(byCat.keys())

  return (
    <div className="export-overlay" role="dialog" aria-modal aria-label="导出中心" onClick={onClose}>
      <div className="export-center card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div>
            <h2 style={{ margin: 0 }}>导出中心</h2>
            <p className="hint" style={{ margin: '4px 0 0' }}>
              按层次选择图面 / 信号 / 评价 / 绿波 / 数据 · 与当前方案联动
            </p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="export-integrity">
          {exportIntegrityNotes(ctx).map((n) => (
            <span
              key={n}
              className={`integrity-badge ${n.includes('正常') ? 'ok' : n.includes('未') || n.includes('不') ? 'bad' : 'ok'}`}
            >
              {n}
            </span>
          ))}
        </div>

        <div className="export-toolbar">
          <input
            placeholder="搜索导出项…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">全部分类</option>
            <option value="ready">仅可用</option>
            {(Object.keys(CATEGORY_LABEL) as ExportCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="export-body">
          {cats.map((cat) => (
            <div key={cat} className="export-cat">
              <div className="section-title">{CATEGORY_LABEL[cat]}</div>
              <div className="export-grid">
                {(byCat.get(cat) ?? []).map((item) => {
                  const ok = isExportAvailable(item, ctx)
                  const focus = currentMode && item.modes?.includes(currentMode)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`export-item ${ok ? '' : 'disabled'} ${focus ? 'focus' : ''}`}
                      disabled={!ok || !handlers[item.id]}
                      onClick={() => run(item)}
                      title={item.description}
                    >
                      <div className="export-item-title">{item.title}</div>
                      <div className="export-item-fmt">{item.format}</div>
                      <div className="export-item-desc">{item.description}</div>
                      {!ok && (
                        <div className="export-item-miss">
                          {item.requires.includes('timingClosed') && ctx.timingClosed === false
                            ? '需配时闭合'
                            : item.requires.includes('flowAligned') && ctx.flowAligned === false
                              ? '需流量同源'
                              : item.requires.includes('analysisOk') && ctx.analysisOk === false
                                ? '需分析同源'
                                : '条件不足'}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {!cats.length && <p className="hint">无匹配导出项</p>}
        </div>

        {log.length > 0 && (
          <div className="export-log">
            {log.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
