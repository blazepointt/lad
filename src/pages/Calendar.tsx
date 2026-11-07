import { useMemo, useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { EmptyState, Modal } from '../components/ui'
import { MONTHS_NOM, WD_BY_IDX, formatWeekday, makeMonthCells, todayKey } from '../lib/date'
import { makeId } from '../lib/utils'
import type { Task } from '../types'

export function CalendarPage() {
  const { state, dispatch } = useStore()
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selKey, setSelKey] = useState<string | null>(null)

  const today = todayKey()

  const cells = useMemo(() => makeMonthCells(view.y, view.m, state.settings.weekStart), [view, state.settings.weekStart])

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of state.tasks) {
      if (!t.due) continue
      const arr = map.get(t.due)
      if (arr) arr.push(t)
      else map.set(t.due, [t])
    }
    return map
  }, [state.tasks])

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  const selTasks = selKey ? (byDate.get(selKey) ?? []) : []

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Календарь</h1>
          <div className="page-sub">Планы по дням — задачи с датами видны сразу</div>
        </div>
      </div>

      <section className="card">
        <div className="cal-head">
          <div className="cal-title">
            {MONTHS_NOM[view.m]} {view.y}
          </div>
          <div className="cal-nav">
            <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Предыдущий месяц">
              <Icon name="chevL" size={18} />
            </button>
            <button
              className="btn"
              onClick={() => {
                const d = new Date()
                setView({ y: d.getFullYear(), m: d.getMonth() })
              }}
            >
              Сегодня
            </button>
            <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Следующий месяц">
              <Icon name="chevR" size={18} />
            </button>
          </div>
        </div>

        <div className="cal-grid">
          {Array.from({ length: 7 }, (_, i) => (
            <div className="cal-wd" key={i}>
              {WD_BY_IDX[(state.settings.weekStart + i) % 7]}
            </div>
          ))}
          {cells.map((cell) => {
            const tasks = byDate.get(cell.key) ?? []
            const shown = tasks.filter((t) => !t.done).slice(0, 3)
            const extra = tasks.filter((t) => !t.done).length - shown.length
            return (
              <button
                key={cell.key}
                className={`cal-cell${cell.out ? ' out' : ''}${cell.key === today ? ' today' : ''}${cell.key === selKey ? ' sel' : ''}`}
                onClick={() => setSelKey(cell.key)}
                aria-label={`${cell.key}, задач: ${tasks.length}`}
              >
                <span className="cal-num tnum">{cell.day}</span>
                {shown.map((t) => (
                  <span className="cal-ev" key={t.id}>
                    {t.title}
                  </span>
                ))}
                {extra > 0 && <span className="cal-more">+{extra} ещё</span>}
              </button>
            )
          })}
        </div>
      </section>

      {selKey && <DayModal day={selKey} tasks={selTasks} onClose={() => setSelKey(null)} />}
    </>
  )
}

function DayModal({ day, tasks, onClose }: { day: string; tasks: Task[]; onClose: () => void }) {
  const { dispatch } = useStore()
  const [title, setTitle] = useState('')

  const add = (e: FormEvent) => {
    e.preventDefault()
    const v = title.trim()
    if (!v) return
    dispatch({
      t: 'task/add',
      task: { id: makeId(), title: v, done: false, createdAt: Date.now(), due: day, priority: 'normal' },
    })
    setTitle('')
  }

  return (
    <Modal title={formatWeekday(day)} onClose={onClose}>
      <form className="add-form" onSubmit={add} style={{ marginBottom: tasks.length ? 8 : 0 }}>
        <input
          type="text"
          className="input"
          placeholder="Задача на этот день…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Новая задача на этот день"
        />
        <button className="btn btn-primary" type="submit" disabled={!title.trim()}>
          <Icon name="plus" size={16} />
        </button>
      </form>

      {tasks.length === 0 ? (
        <EmptyState icon="calendar" title="Свободный день" hint="Задач на этот день нет. Добавьте их выше." />
      ) : (
        <div>
          {tasks.map((t) => (
            <div className="day-row" key={t.id}>
              <button
                className={`task-check${t.done ? ' on' : ''}`}
                onClick={() => dispatch({ t: 'task/toggle', id: t.id })}
                aria-label={t.done ? 'Вернуть' : 'Выполнить'}
              >
                <Icon name="check" size={13} />
              </button>
              <div className="task-main" style={{ flex: 1 }}>
                <div className={`task-title${t.done ? ' done' : ''}`}>{t.title}</div>
              </div>
              <button
                className="icon-btn row-del"
                onClick={() => dispatch({ t: 'task/delete', id: t.id })}
                aria-label="Удалить"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
