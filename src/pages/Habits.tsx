import { useMemo, useState, type CSSProperties } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { ColorSwatches, ConfirmModal, EmptyState, Modal, useToast } from '../components/ui'
import { WD_BY_IDX, addDays, dateKey, parseKey, startOfWeek, todayKey } from '../lib/date'
import { habitStats, last30Pct } from '../lib/habits'
import { makeId, plural } from '../lib/utils'
import type { Habit } from '../types'

const EMOJIS = ['🌅', '💧', '🏃', '📚', '🧘', '🎯', '🛏️', '🥗', '✍️', '🎸', '🧹', '💻', '🚶', '🌱', '☀️', '🌙', '🧠', '💪', '🎨', '☕', '🪥', '💊', '📵', '🗣️']

const COLORS = [
  { id: 'terracotta', hex: '#BC5B3C', label: 'Терракота' },
  { id: 'olive', hex: '#6D7D3E', label: 'Олива' },
  { id: 'ocean', hex: '#3A708C', label: 'Океан' },
  { id: 'plum', hex: '#8A5A80', label: 'Слива' },
  { id: 'amber', hex: '#A06F1A', label: 'Янтарь' },
  { id: 'pine', hex: '#40725A', label: 'Хвоя' },
]

export function HabitsPage() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<Habit | 'new' | null>(null)
  const [confirmDel, setConfirmDel] = useState<Habit | null>(null)

  const today = todayKey()
  const doneToday = state.habits.filter((h) => h.days.includes(today)).length

  const openNew = () => setEditing('new')

  const delHabit = (h: Habit) => {
    dispatch({ t: 'habit/delete', id: h.id })
    setConfirmDel(null)
    setEditing(null)
    toast.show({
      message: `Привычка «${h.name}» удалена`,
      actionLabel: 'Вернуть',
      onAction: () => dispatch({ t: 'habit/add', habit: h }),
    })
  }

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Привычки</h1>
          <div className="page-sub">
            {state.habits.length
              ? `Маленькие шаги каждый день · сегодня ${doneToday} из ${state.habits.length}`
              : 'Маленькие шаги каждый день'}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            Новая привычка
          </button>
        </div>
      </div>

      {state.habits.length === 0 ? (
        <EmptyState
          icon="repeat"
          title="Начните с одной привычки"
          hint="Стакан воды по утрам, 10 страниц перед сном — выберите что-то маленькое и повторяемое."
        >
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>
            <Icon name="plus" size={16} />
            Новая привычка
          </button>
        </EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {state.habits.map((h) => (
            <HabitCard key={h.id} habit={h} onEdit={() => setEditing(h)} onAskDelete={() => setConfirmDel(h)} />
          ))}
        </div>
      )}

      {editing && (
        <HabitEditModal
          habit={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDelete={editing === 'new' ? undefined : () => setConfirmDel(editing)}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Удалить привычку?"
          text={`«${confirmDel.name}» и вся история отметок будут удалены.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => delHabit(confirmDel)}
        />
      )}
    </>
  )
}

function HabitCard({ habit, onEdit, onAskDelete }: { habit: Habit; onEdit: () => void; onAskDelete: () => void }) {
  const { state, dispatch } = useStore()
  const today = todayKey()
  const weekStart = state.settings.weekStart

  const stats = habitStats(habit.days)
  const pct = last30Pct(habit.days)

  const weekKeys = useMemo(() => {
    const start = startOfWeek(parseKey(today), weekStart)
    return Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)))
  }, [today, weekStart])

  const heat = useMemo(() => {
    const start = addDays(startOfWeek(parseKey(today), weekStart), -21)
    return Array.from({ length: 28 }, (_, i) => {
      const k = dateKey(addDays(start, i))
      return { key: k, on: habit.days.includes(k) }
    })
  }, [today, weekStart, habit.days])

  const color = COLORS.find((c) => c.id === habit.color) ?? COLORS[0]
  const styleVar = { '--hc': color.hex } as CSSProperties

  return (
    <section className="habit-card" style={styleVar}>
      <div className="habit-head">
        <div className="hemoji">{habit.emoji}</div>
        <div className="hname">{habit.name}</div>
        <button className="icon-btn" onClick={onEdit} aria-label="Изменить привычку">
          <Icon name="pencil" size={16} />
        </button>
        <button className="icon-btn" onClick={onAskDelete} aria-label="Удалить привычку">
          <Icon name="trash" size={16} />
        </button>
      </div>

      <div className="hstats-line">
        <span>
          Серия: <b className="tnum">{stats.cur}</b> {plural(stats.cur, ['день', 'дня', 'дней'])}
        </span>
        <span>
          Лучшая: <b className="tnum">{stats.best}</b>
        </span>
        <span>
          За 30 дней: <b className="tnum">{pct}%</b>
        </span>
      </div>

      <div className="hstrip">
        {weekKeys.map((k) => {
          const idx = parseKey(k).getDay()
          const future = k > today
          const on = habit.days.includes(k)
          return (
            <div className="hday" key={k}>
              <span className="hday-lbl">{WD_BY_IDX[idx]}</span>
              <button
                className={`hday-circle${future ? ' future' : ''}${on ? ' on' : ''}${k === today ? ' today' : ''}`}
                disabled={future}
                onClick={() => dispatch({ t: 'habit/toggleDay', id: habit.id, day: k })}
                aria-label={`${habit.name}: ${k}${on ? ', отмечено' : ''}`}
                aria-pressed={on}
              >
                {on ? <Icon name="check" size={14} /> : parseKey(k).getDate()}
              </button>
            </div>
          )
        })}
      </div>

      <div className="hgrid" aria-hidden="true">
        {heat.map((d) => (
          <div key={d.key} className={`hcell${d.on ? ' on' : ''}`} title={d.key} />
        ))}
      </div>
    </section>
  )
}

function HabitEditModal({
  habit,
  onClose,
  onDelete,
}: {
  habit: Habit | null
  onClose: () => void
  onDelete?: () => void
}) {
  const { dispatch } = useStore()
  const [name, setName] = useState(habit?.name ?? '')
  const [emoji, setEmoji] = useState(habit?.emoji ?? '🌱')
  const [color, setColor] = useState(habit?.color ?? 'terracotta')

  const save = () => {
    const v = name.trim()
    if (!v) return
    if (habit) {
      dispatch({ t: 'habit/update', id: habit.id, patch: { name: v, emoji, color } })
    } else {
      dispatch({
        t: 'habit/add',
        habit: { id: makeId(), name: v, emoji, color, createdAt: Date.now(), days: [] },
      })
    }
    onClose()
  }

  return (
    <Modal
      title={habit ? 'Изменить привычку' : 'Новая привычка'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="btn btn-danger-ghost" onClick={onDelete} style={{ marginRight: 'auto' }}>
              <Icon name="trash" size={15} />
              Удалить
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!name.trim()}>
            Сохранить
          </button>
        </>
      }
    >
      <label className="field-label" htmlFor="habit-name">Название</label>
      <input
        id="habit-name"
        className="input"
        placeholder="Например: утренняя прогулка"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save() }}
        autoFocus
      />
      <div style={{ marginTop: 16 }}>
        <span className="field-label">Значок</span>
        <div className="emoji-grid">
          {EMOJIS.map((e) => (
            <button key={e} className={`emj${emoji === e ? ' on' : ''}`} onClick={() => setEmoji(e)} aria-label={e}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <span className="field-label">Цвет</span>
        <ColorSwatches colors={COLORS} value={color} onChange={setColor} ariaLabel="Цвет привычки" />
      </div>
    </Modal>
  )
}
