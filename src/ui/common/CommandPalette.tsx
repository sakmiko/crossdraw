import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/state/store'

const COMMANDS: { id: string; label: string; run: () => void }[] = []

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const setMode = useAppStore((s) => s.setMode)
  const resetTemplate = useAppStore((s) => s.resetTemplate)
  const loadTemplate = useAppStore((s) => s.loadTemplate)
  const duplicateChannel = useAppStore((s) => s.duplicateChannel)
  const addFlowScheme = useAppStore((s) => s.addFlowScheme)
  const addSignalScheme = useAppStore((s) => s.addSignalScheme)

  const items = useMemo(() => {
    const all = [
      { id: 'new-cross', label: '新建十字交叉口', run: () => loadTemplate('cross') },
      { id: 'new-t', label: '新建 T 型交叉口', run: () => loadTemplate('t') },
      { id: 'new-y', label: '新建 Y 型交叉口', run: () => loadTemplate('y') },
      { id: 'new-skew', label: '新建斜交交叉口', run: () => loadTemplate('skewed') },
      { id: 'new-ra', label: '新建环形交叉口', run: () => loadTemplate('roundabout') },
      { id: 'new-five', label: '新建五路交叉口', run: () => loadTemplate('five' as any) },
      { id: 'mode-channel', label: '切换到渠化', run: () => setMode('channel') },
      { id: 'mode-flow', label: '切换到流量', run: () => setMode('flow') },
      { id: 'mode-signal', label: '切换到信号', run: () => setMode('signal') },
      { id: 'mode-xsection', label: '切换到断面', run: () => setMode('xsection') },
      { id: 'mode-analysis', label: '切换到分析', run: () => setMode('analysis') },
      { id: 'mode-compare', label: '模式：方案比选', run: () => setMode('compare') },
      { id: 'mode-band', label: '切换到绿波', run: () => setMode('band') },
      { id: 'dup-ch', label: '复制当前渠化方案', run: () => duplicateChannel() },
      { id: 'add-flow', label: '新增流量方案', run: () => addFlowScheme() },
      { id: 'add-sig', label: '新增信号方案', run: () => addSignalScheme() },
      { id: 'reset', label: '重置为默认模板', run: () => resetTemplate() },
    ]
    void COMMANDS
    const qq = q.trim().toLowerCase()
    return qq ? all.filter((i) => i.label.toLowerCase().includes(qq) || i.id.includes(qq)) : all
  }, [q, setMode, resetTemplate, loadTemplate, duplicateChannel, addFlowScheme, addSignalScheme])

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.55)',
        zIndex: 50,
        display: 'grid',
        placeItems: 'start center',
        paddingTop: 120,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 520, maxWidth: '92vw', background: '#0f172a' }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          placeholder="命令面板（Ctrl+K）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'Enter' && items[0]) {
              items[0].run()
              onClose()
            }
          }}
        />
        <div style={{ marginTop: 8, maxHeight: 320, overflow: 'auto' }}>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className="ghost"
              style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 4 }}
              onClick={() => {
                it.run()
                onClose()
              }}
            >
              {it.label}
            </button>
          ))}
          {!items.length && <p className="hint">无匹配命令</p>}
        </div>
      </div>
    </div>
  )
}
