import { useRef, useState } from 'react'
import { useStore } from '../store'
import { Icon, Logo, type IconName } from '../components/Icon'
import { ConfirmModal, Segmented, Switch, useToast } from '../components/ui'
import { downloadExport, parseImport } from '../lib/storage'
import { ensureAudio, chime } from '../lib/sound'
import type { ThemeSetting } from '../types'

const ACCENTS = [
  { id: 'terracotta', hex: '#BC5B3C', label: 'Терракота' },
  { id: 'amber', hex: '#A06F1A', label: 'Янтарь' },
  { id: 'olive', hex: '#6D7D3E', label: 'Олива' },
  { id: 'ocean', hex: '#3A708C', label: 'Океан' },
  { id: 'plum', hex: '#8A5A80', label: 'Слива' },
  { id: 'pine', hex: '#40725A', label: 'Хвоя' },
]

export function SettingsPage() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const s = state.settings

  const set = (patch: Partial<typeof s>) => dispatch({ t: 'settings', patch })

  const importFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const imported = parseImport(String(reader.result ?? ''))
      if (imported) {
        dispatch({ t: 'data/import', state: imported })
        toast.show({ message: 'Данные восстановлены из резервной копии' })
      } else {
        toast.show({ message: 'Не похоже на резервную копию Лада' })
      }
    }
    reader.readAsText(file)
  }

  const counts = [
    { icon: 'tasks' as IconName, n: state.tasks.length, l: 'задач' },
    { icon: 'note' as IconName, n: state.notes.length, l: 'заметок' },
    { icon: 'repeat' as IconName, n: state.habits.length, l: 'привычек' },
    { icon: 'timer' as IconName, n: state.sessions.length, l: 'раундов фокуса' },
  ]

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Настройки</h1>
          <div className="page-sub">Настройте Лад под себя</div>
        </div>
      </div>

      <div className="set-grid">
        <section className="card">
          <div className="card-title">Профиль</div>
          <label className="field-label" htmlFor="set-name">Как к вам обращаться</label>
          <input
            id="set-name"
            className="input"
            placeholder="Имя — оно появится в приветствии"
            value={s.userName}
            onChange={(e) => set({ userName: e.target.value })}
          />
        </section>

        <section className="card">
          <div className="card-title">Оформление</div>
          <div className="set-row">
            <div>
              <div className="set-label">Тема</div>
              <div className="set-desc">Тёмная — тёплая ночная, не просто инверсия</div>
            </div>
            <div className="set-control">
              <Segmented<ThemeSetting>
                options={[
                  { value: 'light', label: 'Светлая' },
                  { value: 'dark', label: 'Тёмная' },
                  { value: 'auto', label: 'Как в системе' },
                ]}
                value={s.theme}
                onChange={(v) => set({ theme: v })}
                small
              />
            </div>
          </div>
          <div className="set-row">
            <div>
              <div className="set-label">Акцент</div>
              <div className="set-desc">Основной цвет кнопок и выделений</div>
            </div>
            <div className="set-control swatches">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  className={`swatch${s.accent === a.id ? ' on' : ''}`}
                  style={{ background: a.hex }}
                  onClick={() => set({ accent: a.id })}
                  aria-label={a.label}
                  title={a.label}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-title">Поведение</div>
          <div className="set-row">
            <div>
              <div className="set-label">Неделя начинается с</div>
              <div className="set-desc">Влияет на календарь и привычки</div>
            </div>
            <div className="set-control">
              <Segmented<'mon' | 'sun'>
                options={[
                  { value: 'mon', label: 'Понедельника' },
                  { value: 'sun', label: 'Воскресенья' },
                ]}
                value={s.weekStart === 1 ? 'mon' : 'sun'}
                onChange={(v) => set({ weekStart: v === 'mon' ? 1 : 0 })}
                small
              />
            </div>
          </div>
          <div className="set-row">
            <div>
              <div className="set-label">Звук таймера</div>
              <div className="set-desc">Мягкий сигнал в конце раунда</div>
            </div>
            <div className="set-control" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="icon-btn"
                onClick={() => {
                  ensureAudio()
                  chime()
                }}
                aria-label="Проверить звук"
                title="Проверить звук"
              >
                <Icon name="bell" size={16} />
              </button>
              <Switch on={s.sound} onChange={(v) => set({ sound: v })} label="Звук таймера" />
            </div>
          </div>
          <div className="set-row">
            <div>
              <div className="set-label">Раунд по умолчанию</div>
              <div className="set-desc">Минуты фокуса</div>
            </div>
            <div className="set-control">
              <input
                type="number"
                className="input"
                style={{ width: 90 }}
                min={1}
                max={240}
                value={s.focusDefault}
                onChange={(e) => {
                  const v = Math.round(Number(e.target.value))
                  if (v >= 1 && v <= 240) set({ focusDefault: v })
                }}
                aria-label="Минуты фокуса по умолчанию"
              />
            </div>
          </div>
          <div className="set-row">
            <div>
              <div className="set-label">Перерыв по умолчанию</div>
              <div className="set-desc">Минуты отдыха между раундами</div>
            </div>
            <div className="set-control">
              <input
                type="number"
                className="input"
                style={{ width: 90 }}
                min={1}
                max={60}
                value={s.breakDefault}
                onChange={(e) => {
                  const v = Math.round(Number(e.target.value))
                  if (v >= 1 && v <= 60) set({ breakDefault: v })
                }}
                aria-label="Минуты перерыва по умолчанию"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-title">Данные</div>
          <div className="data-stats">
            {counts.map((c) => (
              <span key={c.l}>
                <Icon name={c.icon} size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                <b className="tnum">{c.n}</b> {c.l}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => {
                downloadExport(state)
                toast.show({ message: 'Резервная копия сохранена' })
              }}
            >
              <Icon name="download" size={16} />
              Экспорт
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={16} />
              Импорт
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importFile(f)
                e.target.value = ''
              }}
            />
            <button className="btn btn-danger-ghost" onClick={() => setConfirmReset(true)}>
              <Icon name="trash" size={16} />
              Стереть всё
            </button>
          </div>
          <p className="about-note" style={{ marginTop: 14 }}>
            Всё хранится локально в вашем браузере — ничего не уходит в сеть. Экспорт создаёт
            резервную копию, импорт восстанавливает её.
          </p>
        </section>

        <section className="card">
          <div className="card-title">О приложении</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <Logo size={34} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>Лад · версия 1.0</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>личное пространство для дел и мыслей</div>
            </div>
          </div>
          <p className="about-note">
            «Лад» — про спокойный порядок: задачи, заметки, календарь, привычки и фокус в одном
            тёплом месте. Работает офлайн, без аккаунтов и серверов.
          </p>
        </section>
      </div>

      {confirmReset && (
        <ConfirmModal
          title="Стереть все данные?"
          text="Задачи, заметки, привычки, раунды фокуса и настройки будут удалены без возможности восстановления. Сначала можно сделать экспорт."
          confirmLabel="Стереть всё"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            dispatch({ t: 'data/reset' })
            setConfirmReset(false)
            toast.show({ message: 'Данные стёрты. Начнём с чистого листа.' })
          }}
        />
      )}
    </>
  )
}
