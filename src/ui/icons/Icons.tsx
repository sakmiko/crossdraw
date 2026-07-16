/**
 * Crossdraw UI icons — unified minimal rounded stroke style.
 * viewBox 0 0 24 24 · stroke 1.75 · round caps/joins · no fills (unless noted).
 * Hand-drawn set (no external icon font).
 */
import type { CSSProperties, ReactNode, SVGProps } from 'react'

export type IconName =
  | 'channel'
  | 'flow'
  | 'signal'
  | 'xsection'
  | 'analysis'
  | 'compare'
  | 'band'
  | 'chevronLeft'
  | 'chevronRight'
  | 'plus'
  | 'save'
  | 'folder'
  | 'export'
  | 'print'
  | 'undo'
  | 'redo'
  | 'command'
  | 'fit'
  | 'layers'
  | 'check'
  | 'warn'
  | 'block'
  | 'ped'
  | 'optimize'
  | 'table'
  | 'chart'
  | 'map'
  | 'settings'
  | 'copy'
  | 'trash'
  | 'lock'
  | 'unlock'
  | 'moon'
  | 'sun'
  | 'file'
  | 'templateCross'
  | 'templateT'
  | 'templateY'
  | 'templateSkew'
  | 'templateRa'
  | 'scheme'
  | 'canvas'
  | 'params'

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Svg({
  children,
  title,
  className,
  size = 18,
  ...rest
}: {
  children: ReactNode
  title?: string
  className?: string
  size?: number
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className ? `cd-icon ${className}` : 'cd-icon'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <g {...STROKE}>{children}</g>
    </svg>
  )
}

/** Icon paths — geometric, traffic-engineering flavored where possible */
const PATHS: Record<IconName, ReactNode> = {
  // cross junction
  channel: (
    <>
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M8 8h8v8H8z" opacity={0.35} />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  // flow arrows
  flow: (
    <>
      <path d="M5 12h12" />
      <path d="M14 7l5 5-5 5" />
      <path d="M5 7h4" />
      <path d="M5 17h4" />
    </>
  ),
  // traffic light
  signal: (
    <>
      <rect x="8" y="3" width="8" height="18" rx="3" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="16" r="1.5" />
    </>
  ),
  // cross section bars
  xsection: (
    <>
      <path d="M4 18V8" />
      <path d="M9 18V6" />
      <path d="M14 18V9" />
      <path d="M19 18V7" />
      <path d="M3 18h18" />
    </>
  ),
  // chart bars + trend
  analysis: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-6" />
      <path d="M7 10l4-3 3 2 4-4" />
    </>
  ),
  // balance scale
  compare: (
    <>
      <path d="M12 4v14" />
      <path d="M6 8h12" />
      <path d="M6 8l-2 6h6l-2-6" />
      <path d="M18 8l-2 6h6l-2-6" />
      <path d="M9 20h6" />
    </>
  ),
  // green wave / corridor nodes
  band: (
    <>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="8" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M7 12c2-4 6-4 8 0" />
      <path d="M7 12c2 3 6 3 8 0" opacity={0.45} />
    </>
  ),
  chevronLeft: <path d="M14 6l-6 6 6 6" />,
  chevronRight: <path d="M10 6l6 6-6 6" />,
  plus: (
    <>
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </>
  ),
  save: (
    <>
      <path d="M6 4h10l4 4v12H6z" />
      <path d="M9 4v5h7" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  folder: (
    <>
      <path d="M3 8h6l2 2h10v10H3z" />
      <path d="M3 8V6h5l2 2" />
    </>
  ),
  export: (
    <>
      <path d="M12 4v10" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 14v5h14v-5" />
    </>
  ),
  print: (
    <>
      <path d="M7 9V4h10v5" />
      <path d="M6 14h12v6H6z" />
      <path d="M5 9h14v6H5z" />
    </>
  ),
  undo: (
    <>
      <path d="M8 8H5v3" />
      <path d="M5 11c2-5 12-6 14 0 1.5 4-2 8-7 8H9" />
    </>
  ),
  redo: (
    <>
      <path d="M16 8h3v3" />
      <path d="M19 11c-2-5-12-6-14 0-1.5 4 2 8 7 8h3" />
    </>
  ),
  command: (
    <>
      <path d="M8 8h8v8H8z" />
      <path d="M6 6l2 2" />
      <path d="M18 6l-2 2" />
      <path d="M6 18l2-2" />
      <path d="M18 18l-2-2" />
    </>
  ),
  fit: (
    <>
      <path d="M4 9V5h4" />
      <path d="M20 9V5h-4" />
      <path d="M4 15v4h4" />
      <path d="M20 15v4h-4" />
      <rect x="8" y="8" width="8" height="8" rx="1.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 4l8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  warn: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M7 7l10 10" />
    </>
  ),
  ped: (
    <>
      <circle cx="12" cy="6" r="2" />
      <path d="M12 9v5" />
      <path d="M9 12h6" />
      <path d="M12 14l-3 6" />
      <path d="M12 14l3 6" />
    </>
  ),
  optimize: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M5.6 5.6l2.1 2.1" />
      <path d="M16.3 16.3l2.1 2.1" />
      <path d="M18.4 5.6l-2.1 2.1" />
      <path d="M7.7 16.3l-2.1 2.1" />
    </>
  ),
  table: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M4 10h16" />
      <path d="M4 14h16" />
      <path d="M10 5v14" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l4-5 3 3 5-7" />
    </>
  ),
  map: (
    <>
      <path d="M4 7l5-2 6 2 5-2v14l-5 2-6-2-5 2z" />
      <path d="M9 5v14" />
      <path d="M15 7v14" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </>
  ),
  trash: (
    <>
      <path d="M5 8h14" />
      <path d="M9 8V5h6v3" />
      <path d="M7 8l1 12h8l1-12" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="2" />
      <path d="M9 11V8a3 3 0 0 1 6 0v3" />
    </>
  ),
  unlock: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="2" />
      <path d="M9 11V8a3 3 0 0 1 5.5-1.5" />
    </>
  ),
  moon: <path d="M16 4a8 8 0 1 0 4 12 7 7 0 0 1-4-12z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
    </>
  ),
  templateCross: (
    <>
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </>
  ),
  templateT: (
    <>
      <path d="M4 8h16" />
      <path d="M12 8v12" />
    </>
  ),
  templateY: (
    <>
      <path d="M12 13v8" />
      <path d="M12 13L5 5" />
      <path d="M12 13l7-8" />
    </>
  ),
  templateSkew: (
    <>
      <path d="M5 19L19 5" />
      <path d="M5 5h6" />
      <path d="M13 19h6" />
    </>
  ),
  templateRa: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  scheme: (
    <>
      <path d="M5 5h6v6H5z" />
      <path d="M13 5h6v6h-6z" />
      <path d="M5 13h6v6H5z" />
      <path d="M13 13h6v6h-6z" />
    </>
  ),
  canvas: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M4 15l4-3 3 2 4-4 5 4" />
    </>
  ),
  params: (
    <>
      <path d="M5 7h10" />
      <path d="M5 12h14" />
      <path d="M5 17h8" />
      <circle cx="18" cy="7" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="16" cy="17" r="1.5" />
    </>
  ),
}

export function Icon({
  name,
  size = 18,
  className,
  title,
  style,
}: {
  name: IconName
  size?: number
  className?: string
  title?: string
  style?: CSSProperties
}) {
  const body = PATHS[name]
  if (!body) return null
  return (
    <Svg size={size} className={className} title={title} style={style}>
      {body}
    </Svg>
  )
}

/** Mode → icon name map for left nav */
export const MODE_ICONS: Record<string, IconName> = {
  channel: 'channel',
  flow: 'flow',
  signal: 'signal',
  xsection: 'xsection',
  analysis: 'analysis',
  compare: 'compare',
  band: 'band',
}

export function IconLabel({
  name,
  children,
  size = 16,
  className,
}: {
  name: IconName
  children: ReactNode
  size?: number
  className?: string
}) {
  return (
    <span className={className ? `icon-label ${className}` : 'icon-label'}>
      <Icon name={name} size={size} />
      <span className="icon-label-text">{children}</span>
    </span>
  )
}
