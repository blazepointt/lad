import { useMemo, useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { Icon, type IconName } from '../components/Icon'
import { EmptyState } from '../components/ui'
import { formatDay, formatWeekday, shiftKey, todayKey } from '../lib/date'
import { fmtMinutes, makeId, plural } from '../lib/utils'
import { quoteOfDay } from '../lib/quotes'
import { habitStats } from '../lib/habits'
import type { PageId } from '../App'
import type { Task } from '../types'

const PRIO_ORDER = { high: 0, normal: 1, low: 2 } as const

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function TodayPage({ go }: { go: (p: PageId) => void }) {
  const { state, dispatch } = useStore()
  const [quick, setQuick] = useState('')

  const today = todayKey()
  const name = state.settings.userName.trim()
  const quote = useMemo(() => quoteOfDay(), [])

  const tasksToday = useMemo(
    () =>
      state.tasks
        .filter((t) => !t.done && t.due && t.due <= today)
        .sort((a, b) => PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority] || a.createdAt - b.createdAt),
    [state.tasks, today],
  )

  const overdue = tasksToday.filter((t) => t.due! < today)
  const forToday = tasksToday.filter((t) => t.due === today)

  const habitsToday = state.habits.filter((h) => h.days.includes(today))
  const habitsPending = state.habits.filter((h) => !h.days.includes(today))

  const focusTodayMin = useMemo(
    () =>
      state.sessions
        .filter((s) => !s.isBreak && new Date(s.startedAt).toDateString() === new Date().toDateString())
        .reduce((sum, s) => sum + s.minutes, 0),
    [state.sessions],
  )

  const doneWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000
    return state.tasks.filter((t) => t.done && (t.completedAt ?? 0) >= cutoff).length
  }, [state.tasks])

  const upcoming = useMemo(() => {
    const end = shiftKey(today, 7)
    return state.tasks
      .filter((t) => !t.done && t.due && t.due > today && t.due <= end)
      .sort((a, b) => (a.due! < b.due! ? -1 : 1))
      .slice(0, 6)
  }, [state.tasks, today])

  const noteMini = useMemo(() => {
    const pinned = state.notes.filter((n) => n.pinned)
    const pool = pinned.length ? pinned : state.notes
    return [...pool].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
  }, [state.notes])

  const addQuick = (e: FormEvent) => {
    e.preventDefault()
    const v = quick.trim()
    if (!v) return
    dispatch({
      t: 'task/add',
      task: { id: makeId(), title: v, done: false, createdAt: Date.now(), due: today, priority: 'normal' },
    })
    setQuick('')
  }

  const stats: Array<{ icon: IconName; n: string; l: string }> = [
    {
      icon: 'tasks',
      n: `${forToday.length}/${forToday.length + overdue.length}`,
      l: overdue.length ? `задачи, ${plural(overdue.length, ['просрочена', 'просрочены', 'просрочено'])}` : 'задачи на сегодня',
    },
    {
      icon: 'repeat',
      n: `${habitsToday.length}/${state.habits.length}`,
      l: 'привычки',
    },
    {
      icon: 'timer',
      n: focusTodayMin > 0 ? fmtMinutes(focusTodayMin) : '0 мин',
      l: 'фокус сегодня',
    },
    { icon: 'check', n: String(doneWeek), l: 'задач за неделю' },
  ]

  return (
    <>
      <div className="greet">
        <h1>
          {greeting()}
          {name ? `, ${name}` : ''}
        </h1>
        <div className="greet-sub">{formatWeekday(today)} · вот как идёт ваш день</div>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat" key={s.l}>
            <div className="stat-ico">
              <Icon name={s.icon} size={19} />
            </div>
            <div>
              <div className="n tnum">{s.n}</div>
              <div className="l">{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="today-grid">
        <div className="today-col">
          <section className="card">
            <div className="card-title">
              Задачи на сегодня
              <button className="link-btn" onClick={() => go('tasks')}>
                Все задачи <Icon name="arrowR" size={14} />
              </button>
            </div>

            <form className="add-form" onSubmit={addQuick}>
              <input
                type="text"
                className="input"
                placeholder="Что нужно сделать? Enter — добавить"
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                aria-label="Новая задача на сегодня"
              />
            </form>

            {state.tasks.length === 0 && tasksToday.length === 0 ? (
              <EmptyState icon="tasks" title="Задач пока нет" hint="Добавьте первую задачу — она появится и в списке Задачи." />
            ) : tasksToday.length === 0 ? (
              <div className="all-done" style={{ marginTop: 12 }}>
                <Icon name="check" size={18} />
                На сегодня всё чисто. Хороший момент выдохнуть.
              </div>
            ) : (
              <div style={{ marginTop: 6 }}>
                {overdue.length > 0 && (
                  <>
                    <div className="group-title" style={{ color: 'var(--danger)' }}>
                      Просрочено · {overdue.length}
                    </div>
                    {overdue.map((t) => (
                      <TaskLine key={t.id} task={t} onToggle={() => dispatch({ t: 'task/toggle', id: t.id })} />
                    ))}
                  </>
                )}
                {forToday.length > 0 && (
                  <>
                    {overdue.length > 0 && <div className="group-title">Сегодня</div>}
                    {forToday.map((t) => (
                      <TaskLine key={t.id} task={t} onToggle={() => dispatch({ t: 'task/toggle', id: t.id })} />
                    ))}
                  </>
                )}
              </div>
            )}
          </section>

          {state.habits.length > 0 && (
            <section className="card">
              <div className="card-title">
                Привычки сегодня
                <button className="link-btn" onClick={() => go('habits')}>
                  Все привычки <Icon name="arrowR" size={14} />
                </button>
              </div>
              {habitsPending.length === 0 ? (
                <div className="all-done">
                  <Icon name="check" size={18} />
                  Все привычки на сегодня выполнены. Так держать!
                </div>
              ) : (
                habitsPending.map((h) => {
                  const st = habitStats(h.days)
                  return (
                    <div className="habit-line" key={h.id}>
                      <div className="habit-emoji">{h.emoji}</div>
                      <div className="habit-name">{h.name}</div>
                      {st.cur > 0 && (
                        <span className="habit-streak">
                          <Icon name="flame" size={13} className="flame" /> {st.cur}
                        </span>
                      )}
                      <button className="mark-btn" onClick={() => dispatch({ t: 'habit/toggleDay', id: h.id, day: today })}>
                        Отметить
                      </button>
                    </div>
                  )
                })
              )}
            </section>
          )}
        </div>

        <div className="today-col">
          <section className="card">
            <div className="card-title">
              Фокус
              <button className="link-btn" onClick={() => go('focus')}>
                Открыть <Icon name="arrowR" size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="stat-ico" style={{ width: 44, height: 44 }}>
                <Icon name="timer" size={21} />
              </div>
              <div>
                <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>
                  {fmtMinutes(focusTodayMin)}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                  {plural(
                    state.sessions.filter((s) => !s.isBreak && new Date(s.startedAt).toDateString() === new Date().toDateString()).length,
                    ['раунд', 'раунда', 'раундов'],
                  )}{' '}
                  тишины за сегодня
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-title">
              Скоро
              <span className="tail">{upcoming.length > 0 ? 'ближайшие 7 дней' : ''}</span>
            </div>
            {upcoming.length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Пока ничего не запланировано на неделю вперёд.</p>
            ) : (
              upcoming.map((t) => (
                <div className="up-item" key={t.id}>
                  <span className="up-date">{formatDay(t.due!)}</span>
                  <span className="up-title">{t.title}</span>
                </div>
              ))
            )}
          </section>

          {noteMini && (
            <section className="card">
              <div className="card-title">
                {noteMini.pinned ? 'Закреплено' : 'Последняя заметка'}
                <button className="link-btn" onClick={() => go('notes')}>
                  Заметки <Icon name="arrowR" size={14} />
                </button>
              </div>
              <button
                className="note-mini"
                onClick={() => go('notes')}
                aria-label="Открыть заметки"
              >
                <div className="note-mini-title">{noteMini.title || 'Без названия'}</div>
                <div className="note-mini-body">{noteMini.body || 'Пустая заметка'}</div>
              </button>
            </section>
          )}

          <div className="quote-card">
            <p className="quote-text">«{quote.text}»</p>
            <p className="quote-author">{quote.author === '—' ? '' : `— ${quote.author}`}</p>
          </div>
        </div>
      </div>
    </>
  )
}

function TaskLine({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const { dispatch } = useStore()
  const today = todayKey()
  const isOverdue = task.due! < today

  return (
    <div className="task-row">
      <button className="task-check" onClick={onToggle} aria-label={task.done ? 'Вернуть задачу' : 'Выполнить'}>
        <Icon name="check" size={13} />
      </button>
      <div className="task-main">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {isOverdue && <span className="badge-due overdue">{formatDay(task.due!)}</span>}
          {task.priority === 'high' && <span className="prio-badge">Важно</span>}
        </div>
      </div>
      <button
        className="icon-btn row-del"
        onClick={() => dispatch({ t: 'task/delete', id: task.id })}
        aria-label="Удалить задачу"
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  )
}
