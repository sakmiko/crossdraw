/**
 * Left rail: mode-specific tools (replaces scheme tree column).
 * Channel/xsection → approach list; other modes → short tools / legend.
 */
import type { Approach, EditorMode } from '@/domain/types'
import { Icon, MODE_ICONS } from '@/ui/icons/Icons'

export type ModeSideRailProps = {
  mode: EditorMode
  approaches: Approach[]
  selectedId: string | null | undefined
  onSelectApproach: (id: string) => void
  onFit?: () => void
  layerVis?: Record<string, boolean>
  onToggleLayer?: (k: string) => void
}

export function ModeSideRail({
  mode,
  approaches,
  selectedId,
  onSelectApproach,
  onFit,
  layerVis,
  onToggleLayer,
}: ModeSideRailProps) {
  const title =
    mode === 'channel'
      ? '进口道'
      : mode === 'xsection'
        ? '断面进口'
        : mode === 'flow'
          ? '流量'
          : mode === 'signal'
            ? '信号'
            : mode === 'analysis'
              ? '分析'
              : mode === 'compare'
                ? '比选'
                : '功能'

  return (
    <aside className={`side mode-rail mode-rail--${mode}`} aria-label="页面功能">
      <div className="side-head">
        <div className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name={MODE_ICONS[mode] ?? 'params'} size={14} />
          {title}
        </div>
        <span className="side-count">
          {mode === 'channel' || mode === 'xsection' ? `${approaches.length} 向` : '工具'}
        </span>
      </div>

      {(mode === 'channel' || mode === 'xsection') && (
        <>
          {mode === 'channel' && onFit && (
            <div className="tree-actions">
              <button type="button" onClick={onFit}>
                适应画布
              </button>
            </div>
          )}
          {mode === 'channel' && layerVis && onToggleLayer && (
            <div className="rail-layers">
              {(
                [
                  ['ROAD', '路面'],
                  ['MARKING', '标线'],
                  ['ISLAND', '岛'],
                  ['FLOW', '流量'],
                ] as const
              ).map(([k, lab]) => (
                <button
                  key={k}
                  type="button"
                  className={`layer-chip ${layerVis[k] ? 'on' : 'off'}`}
                  onClick={() => onToggleLayer(k)}
                >
                  {lab}
                </button>
              ))}
            </div>
          )}
          <div className="tree-scroll">
            {approaches.map((ap) => (
              <div
                key={ap.id}
                className={`tree-item tree-approach ${selectedId === ap.id ? 'active' : ''}`}
                onClick={() => onSelectApproach(ap.id)}
              >
                <div className="tree-row">
                  <span className="tree-name">{ap.name}</span>
                  <span className="tree-meta">{ap.bearingDeg}°</span>
                </div>
                <div className="hint">{ap.entryLanes.length} 车道</div>
              </div>
            ))}
          </div>
        </>
      )}

      {mode === 'flow' && null}

      {mode === 'compare' && null}
    </aside>
  )
}
