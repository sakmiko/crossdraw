/**
 * Topbar scheme switcher — channel / flow / signal dropdowns (replaces side scheme tree).
 */
import type { Project, ChannelizationScheme, FlowScheme, SignalScheme } from '@/domain/types'
import { Icon } from '@/ui/icons/Icons'

export type SchemeSwitcherProps = {
  project: Project
  channel: ChannelizationScheme | null
  flow: FlowScheme | null
  signal: SignalScheme | null
  onChannel: (id: string) => void
  onFlow: (id: string) => void
  onSignal: (id: string) => void
  onAddChannel?: () => void
  onAddFlow?: () => void
  onAddSignal?: () => void
}

export function SchemeSwitcher({
  project,
  channel,
  flow,
  signal,
  onChannel,
  onFlow,
  onSignal,
  onAddChannel,
  onAddFlow,
  onAddSignal,
}: SchemeSwitcherProps) {
  return (
    <div className="scheme-switcher scheme-switcher--compact" role="group" aria-label="方案切换">
      <label className="scheme-switch-field">
        <span className="scheme-switch-lab">
          <Icon name="channel" size={13} />
          渠化
        </span>
        <select
          value={channel?.id ?? ''}
          onChange={(e) => onChannel(e.target.value)}
          title="渠化方案"
        >
          {project.channelizationSchemes.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      </label>
      <label className="scheme-switch-field">
        <span className="scheme-switch-lab">
          <Icon name="flow" size={13} />
          流量
        </span>
        <select
          value={flow?.id ?? ''}
          onChange={(e) => onFlow(e.target.value)}
          title="流量方案"
          disabled={!channel?.flowSchemes.length}
        >
          {(channel?.flowSchemes ?? []).map((fl) => (
            <option key={fl.id} value={fl.id}>
              {fl.name}
            </option>
          ))}
        </select>
      </label>
      <label className="scheme-switch-field">
        <span className="scheme-switch-lab">
          <Icon name="signal" size={13} />
          信号
        </span>
        <select
          value={signal?.id ?? ''}
          onChange={(e) => onSignal(e.target.value)}
          title="信号方案"
          disabled={!flow?.signalSchemes.length}
        >
          {(flow?.signalSchemes ?? []).map((sg) => (
            <option key={sg.id} value={sg.id}>
              {sg.name} · C={sg.cycleSec}s
            </option>
          ))}
        </select>
      </label>
      <div className="scheme-switch-actions">
        {onAddChannel && (
          <button type="button" className="ghost scheme-add" onClick={onAddChannel} title="复制渠化方案">
            +渠
          </button>
        )}
        {onAddFlow && (
          <button type="button" className="ghost scheme-add" onClick={onAddFlow} title="新增流量方案">
            +流
          </button>
        )}
        {onAddSignal && (
          <button type="button" className="ghost scheme-add" onClick={onAddSignal} title="新增信号方案">
            +信
          </button>
        )}
      </div>
    </div>
  )
}
