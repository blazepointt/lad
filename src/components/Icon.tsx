// Компактный набор собственных SVG-иконок (штриховые, 24×24)

import type { CSSProperties, ReactElement } from 'react'

export type IconName =
  | 'home' | 'tasks' | 'note' | 'calendar' | 'repeat' | 'timer' | 'spark' | 'settings'
  | 'plus' | 'search' | 'sun' | 'moon' | 'monitor' | 'trash' | 'pencil' | 'pin'
  | 'x' | 'chevL' | 'chevR' | 'play' | 'pause' | 'reset' | 'download' | 'upload'
  | 'copy' | 'check' | 'flame' | 'target' | 'clock' | 'arrowR' | 'menu' | 'info'
  | 'percent' | 'key' | 'swap' | 'hash' | 'bell'

const P: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.6V20h12V9.6" />
      <path d="M10 20v-5.4h4V20" />
    </>
  ),
  tasks: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8.6 12.2l2.3 2.3 4.7-5" />
    </>
  ),
  note: (
    <>
      <path d="M5.5 4.5h8l5 5v10a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z" />
      <path d="M13.5 4.5v5h5" />
      <path d="M8.5 13h7M8.5 16.4h5" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10.2h16" />
      <path d="M8.4 3.4v3.6M15.6 3.4v3.6" />
    </>
  ),
  repeat: (
    <>
      <path d="M17 2.8L20.4 6.2 17 9.6" />
      <path d="M20.4 6.2H8.2A4.2 4.2 0 0 0 4 10.4v1.2" />
      <path d="M7 21.2L3.6 17.8 7 14.4" />
      <path d="M3.6 17.8h12.2a4.2 4.2 0 0 0 4.2-4.2v-1.2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.4" r="7.4" />
      <path d="M12 13.4V9.6" />
      <path d="M9.6 2.6h4.8" />
      <path d="M12 2.6v3.4" />
    </>
  ),
  spark: (
    <>
      <path d="M11 3.6l1.6 4.1 4.1 1.6-4.1 1.6L11 15l-1.6-4.1-4.1-1.6 4.1-1.6z" />
      <path d="M18.2 14.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7.2h8.4M18.6 7.2H20M4 16.8h2.6M12.8 16.8H20" />
      <circle cx="15.4" cy="7.2" r="2.3" />
      <circle cx="9.6" cy="16.8" r="2.3" />
    </>
  ),
  plus: <path d="M12 5.4v13.2M5.4 12h13.2" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.4" />
      <path d="M15.8 15.8l4.6 4.6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </>
  ),
  moon: <path d="M20.2 13.6A8.4 8.4 0 1 1 10.4 3.8a6.8 6.8 0 0 0 9.8 9.8z" />,
  monitor: (
    <>
      <rect x="3.6" y="4.6" width="16.8" height="11.6" rx="2" />
      <path d="M9 20h6M12 16.2V20" />
    </>
  ),
  trash: (
    <>
      <path d="M4.6 6.6h14.8" />
      <path d="M9.2 6.6V5.2A1.6 1.6 0 0 1 10.8 3.6h2.4a1.6 1.6 0 0 1 1.6 1.6v1.4" />
      <path d="M6.4 6.6l.9 12.6a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5l.9-12.6" />
      <path d="M10 10.6v6.2M14 10.6v6.2" />
    </>
  ),
  pencil: (
    <>
      <path d="M4.4 19.6l.9-3.7L16.6 4.6a1.9 1.9 0 0 1 2.7 0l.6.6a1.9 1.9 0 0 1 0 2.7L8.6 19.2z" />
      <path d="M14.6 6.6l2.9 2.9" />
    </>
  ),
  pin: (
    <>
      <path d="M9.4 3.6h5.2l-.8 5 2.8 2.6v1.6H7.4v-1.6l2.8-2.6z" />
      <path d="M12 12.8v7.6" />
    </>
  ),
  x: <path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" />,
  chevL: <path d="M14.6 5.6L8.2 12l6.4 6.4" />,
  chevR: <path d="M9.4 5.6l6.4 6.4-6.4 6.4" />,
  play: (
    <path
      d="M8.4 5.6v12.8a.6.6 0 0 0 .9.5l10-6.4a.6.6 0 0 0 0-1l-10-6.4a.6.6 0 0 0-.9.5z"
      fill="currentColor"
      stroke="none"
    />
  ),
  pause: (
    <>
      <rect x="7" y="5.4" width="3.4" height="13.2" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.6" y="5.4" width="3.4" height="13.2" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  reset: (
    <>
      <path d="M19.6 12a7.6 7.6 0 1 1-2.2-5.4" />
      <path d="M20.6 3.2v4.4h-4.4" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10.6" />
      <path d="M7.2 10.8l4.8 4.8 4.8-4.8" />
      <path d="M5 19.6h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 14.6V4" />
      <path d="M7.2 7.8L12 3l4.8 4.8" />
      <path d="M5 19.6h14" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5.4 14.8V6a2 2 0 0 1 2-2h8.8" />
    </>
  ),
  check: <path d="M5 12.6l4.4 4.4L19 7.4" />,
  flame: (
    <path
      d="M12 3.2c.5 2.9-.6 4.4-2.1 6C8.4 10.8 7.4 12.3 7.4 14.4a4.6 4.6 0 0 0 9.2 0c0-2.3-1-3.7-2.2-5.1-.3 1.2-.9 2.1-1.9 2.8.5-2.8-.1-6-.5-8.9z"
      fill="currentColor"
      stroke="none"
    />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3 2.2" />
    </>
  ),
  arrowR: (
    <>
      <path d="M4.8 12h14" />
      <path d="M13.4 6.6L19.2 12l-5.8 5.4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11v5" />
      <path d="M12 7.6v.1" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5L5 19" />
      <circle cx="7" cy="7" r="2.6" />
      <circle cx="17" cy="17" r="2.6" />
    </>
  ),
  key: (
    <>
      <circle cx="7.8" cy="14.6" r="3.8" />
      <path d="M10.5 12L20 2.6" />
      <path d="M15.8 6.8l3 3" />
    </>
  ),
  swap: (
    <>
      <path d="M7.4 3.6L4 7l3.4 3.4" />
      <path d="M4 7h13.4" />
      <path d="M16.6 20.4L20 17l-3.4-3.4" />
      <path d="M20 17H6.6" />
    </>
  ),
  hash: <path d="M9.6 4L8 20M16 4l-1.6 16M4.6 9h15.8M3.6 15h15.8" />,
  bell: (
    <>
      <path d="M6 16.4V11a6 6 0 0 1 12 0v5.4l1.6 2.2H4.4z" />
      <path d="M10.2 21.4a2 2 0 0 0 3.6 0" />
    </>
  ),
}

export function Icon({
  name,
  size = 20,
  className,
  style,
}: {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  )
}

/** Знак приложения — две спокойные волны */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--accent)" />
      <path d="M14 25c6-5.5 12-5.5 18 0s12 5.5 18 0" stroke="#FFF6EC" strokeWidth="4.6" fill="none" strokeLinecap="round" />
      <path d="M14 39c6-5.5 12-5.5 18 0s12 5.5 18 0" stroke="#FFF6EC" strokeWidth="4.6" fill="none" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}
