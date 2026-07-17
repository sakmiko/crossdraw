/**
 * Command palette (Ctrl/Cmd+K) — token-themed, grouped, arrow-key navigable.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore, undo, redo } from '@/state/store'
import type { EditorMode } from '@/domain/types'

type Cmd = {
  id: string
  label: string
  group: string
  keys?: string
  run: () => void
}

export function CommandPalette({
  open,
  onClose,
  onOpenExport,
}: {
  open: boolean
  onClose: () => void
  onOpenExport?: () => void
}) {
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const setMode = useAppStore((s) => s.setMode)
  const resetTemplate = useAppStore((s) => s.resetTemplate)
  const loadTemplate = useAppStore((s) => s.loadTemplate)
  const duplicateChannel = useAppStore((s) => s.duplicateChannel)
  const addFlowScheme = useAppStore((s) => s.addFlowScheme)
  const addSignalScheme = useAppStore((s) => s.addSignalScheme)
  const setTheme = useAppStore((s) => s.setTheme)
  const theme = useAppStore((s) => s.theme)

  const items = useMemo(() => {
    const go = (m: EditorMode) => () => setMode(m)
    const all: Cmd[] = [
      { id: 'mode-channel', label: '渠化', group: '页面', keys: '1', run: go('channel') },
      { id: 'mode-flow', label: '流量', group: '页面', keys: '2', run: go('flow') },
      { id: 'mode-signal', label: '信号', group: '页面', keys: '3', run: go('signal') },
      { id: 'mode-xsection', label: '断面', group: '页面', keys: '4', run: go('xsection') },
      { id: 'mode-analysis', label: '分析', group: '页面', keys: '5', run: go('analysis') },
      { id: 'mode-compare', label: '比选', group: '页面', keys: '6', run: go('compare') },
      { id: 'mode-band', label: '绿波', group: '页面', keys: '7', run: go('band') },
      { id: 'new-cross', label: '新建十字交叉口', group: '新建', run: () => loadTemplate('cross') },
      { id: 'new-t', label: '新建 T 型', group: '新建', run: () => loadTemplate('t') },
      { id: 'new-y', label: '新建 Y 型', group: '新建', run: () => loadTemplate('y') },
      { id: 'new-skew', label: '新建斜交', group: '新建', run: () => loadTemplate('skewed') },
      { id: 'new-five', label: '新建五路', group: '新建', run: () => loadTemplate('five' as never) },
      { id: 'new-ra', label: '新建环形', group: '新建', run: () => loadTemplate('roundabout') },
      { id: 'dup-ch', label: '复制渠化方案', group: '方案', run: () => duplicateChannel() },
      { id: 'add-flow', label: '新增流量方案', group: '方案', run: () => addFlowScheme() },
      { id: 'add-sig', label: '新增信号方案', group: '方案', run: () => addSignalScheme() },
      { id: 'undo', label: '撤销', group: '编辑', keys: 'Ctrl+Z', run: () => undo() },
      { id: 'redo', label: '重做', group: '编辑', keys: 'Ctrl+Y', run: () => redo() },
      { id: 'export', label: '打开导出中心', group: '导出', keys: 'Ctrl+E', run: () => onOpenExport?.() },
      {
        id: 'theme',
        label: theme === 'dark' ? '切换浅色主题' : '切换深色主题',
        group: '视图',
        run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      { id: 'reset', label: '重置为默认模板', group: '危险', run: () => resetTemplate() },
    ]
    const qq = q.trim().toLowerCase()
    if (!qq) return all
    return all.filter(
      (i) =>
        i.label.toLowerCase().includes(qq) ||
        i.id.includes(qq) ||
        i.group.includes(qq) ||
        (i.keys && i.keys.toLowerCase().includes(qq)),
    )
  }, [
    q, setMode, resetTemplate, loadTemplate, duplicateChannel, addFlowScheme,
    addSignalScheme, setTheme, theme, onOpenExport,
  ])

  useEffect(() => {
    if (!open) {
      setQ('')
      setHi(0)
      return
    }
    setHi(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    setHi(0)
  }, [q])

  if (!open) return null

  const runAt = (idx: number) => {
    const it = items[idx]
    if (!it) return
    it.run()
    onClose()
  }

  // group for display
  const groups: { name: string; rows: { cmd: Cmd; index: number }[] }[] = []
  items.forEach((cmd, index) => {
    const g = groups.find((x) => x.name === cmd.group)
    if (g) g.rows.push({ cmd, index })
    else groups.push({ name: cmd.group, rows: [{ cmd, index }] })
  })

  return (
    <div className="cmd-overlay" role="dialog" aria-modal aria-label="命令面板" onClick={onClose}>
      <div className="cmd-panel" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          autoFocus
          placeholder="搜索命令…（↑↓ 选择，Enter 执行，Esc 关闭）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onClose()
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHi((h) => Math.min(h + 1, Math.max(0, items.length - 1)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHi((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              runAt(hi)
            }
          }}
        />
        <div className="cmd-list">
          {groups.map((g) => (
            <div key={g.name} className="cmd-group">
              <div className="cmd-group-title">{g.name}</div>
              {g.rows.map(({ cmd, index }) => (
                <button
                  key={cmd.id}
                  type="button"
                  className={`cmd-item ${index === hi ? 'is-active' : ''}`}
                  onMouseEnter={() => setHi(index)}
                  onClick={() => runAt(index)}
                >
                  <span className="cmd-item-label">{cmd.label}</span>
                  {cmd.keys && <kbd className="cmd-kbd">{cmd.keys}</kbd>}
                </button>
              ))}
            </div>
          ))}
          {!items.length && <p className="cmd-empty">无匹配命令</p>}
        </div>
        <div className="cmd-foot">
          <span>1–7 切页</span>
          <span>Ctrl+S 存盘</span>
          <span>Ctrl+E 导出中心</span>
          <span>Ctrl+K 命令</span>
        </div>
      </div>
    </div>
  )
}
