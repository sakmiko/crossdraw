/**
 * Narrow collapsible left navigation — one item per feature page.
 * Expanded: icon + label; collapsed: icon-only rail.
 * Icons: unified rounded stroke set (src/ui/icons/Icons.tsx).
 */
import type { EditorMode } from '@/domain/types'
import { Icon, MODE_ICONS, type IconName } from '@/ui/icons/Icons'

export type NavItem = {
  id: EditorMode
  label: string
  icon: IconName
  title?: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'channel', label: '渠化', icon: 'channel', title: '渠化设计' },
  { id: 'flow', label: '流量', icon: 'flow', title: '流量输入' },
  { id: 'signal', label: '信号', icon: 'signal', title: '信号配时' },
  { id: 'xsection', label: '断面', icon: 'xsection', title: '横断面' },
  { id: 'analysis', label: '分析', icon: 'analysis', title: '评价分析' },
  { id: 'compare', label: '比选', icon: 'compare', title: '方案比选' },
  { id: 'band', label: '绿波', icon: 'band', title: '干道绿波（独立页）' },
]

export type LeftNavProps = {
  mode: EditorMode
  collapsed: boolean
  onToggleCollapsed: () => void
  onSelect: (mode: EditorMode) => void
}

export function LeftNav({ mode, collapsed, onToggleCollapsed, onSelect }: LeftNavProps) {
  return (
    <nav
      className={`left-nav ${collapsed ? 'is-collapsed' : 'is-expanded'}`}
      aria-label="功能导航"
    >
      <div className="left-nav-head">
        {!collapsed && <span className="left-nav-brand">功能</span>}
        <button
          type="button"
          className="left-nav-toggle"
          onClick={onToggleCollapsed}
          title={collapsed ? '展开侧栏' : '折叠为图标'}
          aria-label={collapsed ? '展开侧栏' : '折叠侧栏'}
          aria-expanded={!collapsed}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
        </button>
      </div>
      <div className="left-nav-list" role="tablist" aria-orientation="vertical">
        {NAV_ITEMS.map((item) => {
          const active = mode === item.id
          const iconName = MODE_ICONS[item.id] ?? item.icon
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.title ?? item.label}
              title={item.title ?? item.label}
              className={`left-nav-item ${active ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="left-nav-icon" aria-hidden>
                <Icon name={iconName} size={18} />
              </span>
              {!collapsed && <span className="left-nav-label">{item.label}</span>}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
