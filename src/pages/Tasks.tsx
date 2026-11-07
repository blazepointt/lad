import { useMemo, useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { ConfirmModal, EmptyState, Modal, Segmented, useToast } from '../components/ui'
import { formatDay, shiftKey, todayKey } from '../lib/date'
import { makeId } from '../lib/utils'
import type { Task, TaskPriority } from '../types'

const PRIO_ORDER = { high: 0, normal: 1, low: 2 } as const

const PRIO_LABEL: Record<TaskPriority, string> = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Высокий',
}

type Tab = 'active' | 'done' | 'all'

export function TasksPage() {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('active')
  const [q, setQ] = useState('')
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [edit, setEdit] = useState<Task | null>(null)
  const [confirmDel, setConfirmDel] = useState<Task | null>(null)

  const today = todayKey()

  const match = (t: Task) => {
    if (!q.trim()) return true
    const needle = q.toLowerCase()
    return (t.title + ' ' + (t.note ?? '')).toLowerCase().includes(needle)
  }

  const add = (e: FormEvent) => {
    e.preventDefault()
    const v = title.trim()
    if (!v) return
    dispatch({
      t: 'task/add',
      task: {
        id: makeId(),
        title: v,
        done: false,
        createdAt: Date.now(),
        due: due || null,
        priority: 'normal',
      },
    })
    setTitle('')
    setDue('')
  }

  const delTask = (t: Task) => {
    dispatch({ t: 'task/delete', id: t.id })
    toast.show({
      message: 'Задача удалена',
      actionLabel: 'Вернуть',
      onAction: () => dispatch({ t: 'task/add', task: t }),
    })
  }

  const active = useMemo(
    () => state.tasks.filter((t) => !t.done).sort(byPriority),
    [state.tasks],
  )
  const done = useMemo(
    () =>
      state.tasks
        .filter((t) => t.done)
        .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt)),
    [state.tasks],
  )

  const groups = useMemo(() => {
    const g: Array<{ key: string; label: string; danger?: boolean; tasks: Task[] }> = [
      { key: 'overdue', label: 'Просрочено', danger: true, tasks: [] },
      { key: 'today', label: 'Сегодня', tasks: [] },
      { key: 'tomorrow', label: 'Завтра', tasks: [] },
      { key: 'later', label: 'Позже', tasks: [] },
      { key: 'none', label: 'Без срока', tasks: [] },
    ]
    for (const t of active) {
      if (!t.due) g[4].tasks.push(t)
      else if (t.due < today) g[0].tasks.push(t)
      else if (t.due === today) g[1].tasks.push(t)
      else if (t.due === shiftKey(today, 1)) g[2].tasks.push(t)
      else g[3].tasks.push(t)
    }
    g[3].tasks.sort((a, b) => (a.due! < b.due! ? -1 : 1))
    return g.filter((x) => x.tasks.length > 0)
  }, [active, today])

  const totalToday = groups.find((g) => g.key === 'today')?.tasks.length ?? 0
  const doneToday = done.filter((t) => t.due === today).length

  const listTasks = useMemo(() => {
    if (tab === 'done') return done.filter(match)
    if (tab === 'all') return [...active, ...done].filter(match)
    return active.filter(match)
  }, [tab, q, active, done])

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Задачи</h1>
          <div className="page-sub">Всё, что нужно сделать — крупным и мелким</div>
        </div>
        <div className="page-actions">
          {totalToday + doneToday > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-2)' }} className="tnum">
              Сегодня: {doneToday} из {totalToday + doneToday}
            </span>
          )}
        </div>
      </div>

      <section className="card">
        <form className="add-form" onSubmit={add}>
          <input
            type="text"
            className="input"
            placeholder="Новая задача…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Название задачи"
          />
          <input
            type="date"
            className="input"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Срок"
            title="Срок"
          />
          <button className="btn btn-primary" type="submit" disabled={!title.trim()}>
            <Icon name="plus" size={16} />
            Добавить
          </button>
        </form>
      </section>

      <div className="toolbar">
        <Segmented<Tab>
          options={[
            { value: 'active', label: `Активные${active.length ? ` · ${active.length}` : ''}` },
            { value: 'done', label: `Выполненные${done.length ? ` · ${done.length}` : ''}` },
            { value: 'all', label: 'Все' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            type="text"
            className="input"
            placeholder="Поиск…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск задач"
          />
        </div>
      </div>

      {listTasks.length === 0 ? (
        <EmptyState
          icon="tasks"
          title={q ? 'Ничего не нашлось' : state.tasks.length === 0 ? 'Тишина и покой' : 'Здесь пусто'}
          hint={
            q
              ? 'Попробуйте другой запрос.'
              : state.tasks.length === 0
                ? 'Добавьте первую задачу в поле выше — и день начнёт обретать форму.'
                : 'В этой вкладке пока нет задач.'
          }
        />
      ) : tab === 'active' && !q ? (
        <section className="card">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="group-title" style={g.danger ? { color: 'var(--danger)' } : undefined}>
                {g.label} · {g.tasks.length}
              </div>
              {g.tasks.map((t) => (
                <TaskRow key={t.id} task={t} onEdit={() => setEdit(t)} onDelete={() => setConfirmDel(t)} />
              ))}
            </div>
          ))}
        </section>
      ) : (
        <section className="card">
          {listTasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onEdit={() => setEdit(t)}
              onDelete={() => delTask(t)}
              hideDel={tab === 'done'}
            />
          ))}
        </section>
      )}

      {edit && <TaskEditModal task={edit} onClose={() => setEdit(null)} />}
      {confirmDel && (
        <ConfirmModal
          title="Удалить задачу?"
          text={`«${confirmDel.title}» будет удалена навсегда.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => {
            delTask(confirmDel)
            setConfirmDel(null)
          }}
        />
      )}
    </>
  )
}

function byPriority(a: Task, b: Task): number {
  return PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority] || a.createdAt - b.createdAt
}

function TaskRow({
  task,
  onEdit,
  onDelete,
  hideDel,
}: {
  task: Task
  onEdit: () => void
  onDelete: () => void
  hideDel?: boolean
}) {
  const { dispatch } = useStore()
  const today = todayKey()
  const isOverdue = !task.done && !!task.due && task.due < today
  const isToday = task.due === today

  return (
    <div className="task-row">
      <button
        className={`task-check${task.done ? ' on' : ''}`}
        onClick={() => dispatch({ t: 'task/toggle', id: task.id })}
        aria-label={task.done ? 'Вернуть задачу' : 'Выполнить'}
      >
        <Icon name="check" size={13} />
      </button>
      <div className="task-main" onClick={onEdit} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onEdit() }}>
        <div className={`task-title${task.done ? ' done' : ''}`}>{task.title}</div>
        <div className="task-meta">
          {task.due && (
            <span className={`badge-due${isOverdue ? ' overdue' : isToday && !task.done ? ' today' : ''}`}>
              {formatDay(task.due)}
            </span>
          )}
          {task.priority === 'high' && !task.done && <span className="prio-badge">Важно</span>}
          {task.priority === 'low' && !task.done && <span className="prio-badge" style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}>Низкий</span>}
          {task.note && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
              {task.note}
            </span>
          )}
        </div>
      </div>
      {!hideDel && (
        <button className="icon-btn row-del" onClick={onDelete} aria-label="Удалить задачу">
          <Icon name="trash" size={16} />
        </button>
      )}
    </div>
  )
}

function TaskEditModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { dispatch } = useStore()
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note ?? '')
  const [due, setDue] = useState(task.due ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)

  const save = () => {
    const v = title.trim()
    if (!v) return
    dispatch({
      t: 'task/update',
      id: task.id,
      patch: { title: v, note: note.trim() || undefined, due: due || null, priority },
    })
    onClose()
  }

  return (
    <Modal
      title="Задача"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={save} disabled={!title.trim()}>
            Сохранить
          </button>
        </>
      }
    >
      <label className="field-label" htmlFor="task-edit-title">Название</label>
      <input
        id="task-edit-title"
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save() }}
        autoFocus
      />
      <div style={{ marginTop: 14 }}>
        <label className="field-label" htmlFor="task-edit-note">Заметка</label>
        <textarea
          id="task-edit-note"
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Детали, ссылки, шаги…"
        />
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label className="field-label" htmlFor="task-edit-due">Срок</label>
          <input
            id="task-edit-due"
            type="date"
            className="input"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <span className="field-label">Приоритет</span>
          <Segmented<TaskPriority>
            options={[
              { value: 'low', label: PRIO_LABEL.low },
              { value: 'normal', label: PRIO_LABEL.normal },
              { value: 'high', label: PRIO_LABEL.high },
            ]}
            value={priority}
            onChange={setPriority}
            small
          />
        </div>
      </div>
    </Modal>
  )
}
