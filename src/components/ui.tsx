// Общие UI-примитивы: модальное окно, подтверждение, тосты, переключатели

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Icon } from './Icon'
import { cn } from '../lib/utils'

/* ---------- Модальное окно ---------- */

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={cn('modal', wide && 'modal-wide')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Подтверждение действия ---------- */

export function ConfirmModal({
  title,
  text,
  confirmLabel = 'Удалить',
  danger = true,
  onCancel,
  onConfirm,
}: {
  title: string
  text: string
  confirmLabel?: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn" onClick={onCancel}>
            Отмена
          </button>
          <button className={danger ? 'btn btn-danger-solid' : 'btn btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-text">{text}</p>
    </Modal>
  )
}

/* ---------- Тосты с действием ---------- */

export interface ToastOptions {
  message: string
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

interface ToastCtxValue {
  show: (o: ToastOptions) => void
}

const ToastCtx = createContext<ToastCtxValue>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null)
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | null>(null)

  const show = useCallback((o: ToastOptions) => {
    if (timer.current) window.clearTimeout(timer.current)
    setToast(o)
    setVisible(true)
    timer.current = window.setTimeout(
      () => setVisible(false),
      o.duration ?? (o.actionLabel ? 7000 : 3800),
    )
  }, [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className={cn('toast', visible && 'on')} role="status">
        {toast && (
          <>
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                onClick={() => {
                  setVisible(false)
                  toast.onAction?.()
                }}
              >
                {toast.actionLabel}
              </button>
            )}
          </>
        )}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast(): ToastCtxValue {
  return useContext(ToastCtx)
}

/* ---------- Пустое состояние ---------- */

export function EmptyState({
  icon,
  title,
  hint,
  children,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  title: string
  hint?: string
  children?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {children}
    </div>
  )
}

/* ---------- Сегментированный переключатель ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  small,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
  small?: boolean
}) {
  return (
    <div className={cn('seg', small && 'seg-sm')} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          className={cn(o.value === value && 'on')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Выключатель ---------- */

export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      className="switch"
      data-on={on}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    />
  )
}

/* ---------- Круговой прогресс ---------- */

export function ProgressRing({
  progress,
  size = 280,
  stroke = 11,
  children,
}: {
  progress: number
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(1, Math.max(0, progress))
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={stroke}
        />
        <circle
          className="ring-bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

/* ---------- Выбор цвета из фиксированной палитры ---------- */

export function ColorSwatches({
  colors,
  value,
  onChange,
  ariaLabel,
}: {
  colors: Array<{ id: string; hex: string; label: string }>
  value: string
  onChange: (id: string) => void
  ariaLabel: string
}) {
  return (
    <div className="swatches" role="radiogroup" aria-label={ariaLabel}>
      {colors.map((c) => (
        <button
          key={c.id}
          className={cn('swatch', value === c.id && 'on')}
          style={{ background: c.hex }}
          onClick={() => onChange(c.id)}
          role="radio"
          aria-checked={value === c.id}
          aria-label={c.label}
          title={c.label}
        />
      ))}
    </div>
  )
}
