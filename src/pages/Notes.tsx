import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { ConfirmModal, EmptyState, Modal } from '../components/ui'
import { makeId } from '../lib/utils'
import type { Note, NoteColor } from '../types'

const COLOR_DOTS: Array<{ id: NoteColor; cls: string; label: string }> = [
  { id: 'sand', cls: 'dot-d1', label: 'Песок' },
  { id: 'sage', cls: 'dot-d2', label: 'Шалфей' },
  { id: 'clay', cls: 'dot-d3', label: 'Глина' },
  { id: 'sky', cls: 'dot-d4', label: 'Небо' },
  { id: 'rose', cls: 'dot-d5', label: 'Роза' },
  { id: 'default', cls: 'dot-d6', label: 'Обычная' },
]

export function NotesPage() {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<Note | null>(null)

  const editing = state.notes.find((n) => n.id === editingId) ?? null

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return state.notes
      .filter((n) => !needle || (n.title + ' ' + n.body).toLowerCase().includes(needle))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
  }, [state.notes, q])

  const openNew = () => {
    const note: Note = {
      id: makeId(),
      title: '',
      body: '',
      color: 'default',
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    dispatch({ t: 'note/add', note })
    setEditingId(note.id)
  }

  const patch = (p: Partial<Note>) => {
    if (editingId) dispatch({ t: 'note/update', id: editingId, patch: p })
  }

  const closeEditor = () => {
    if (editing) {
      // не оставляем случайно созданных пустых заметок
      if (!editing.title.trim() && !editing.body.trim()) {
        dispatch({ t: 'note/delete', id: editing.id })
      }
    }
    setEditingId(null)
  }

  const doDelete = (n: Note) => {
    dispatch({ t: 'note/delete', id: n.id })
    setEditingId(null)
    setConfirmDel(null)
  }

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Заметки</h1>
          <div className="page-sub">Мысли, идеи и списки — всё под рукой</div>
        </div>
        <div className="page-actions">
          <div className="search-box" style={{ position: 'relative' }}>
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 34, width: 210 }}
              placeholder="Поиск…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Поиск заметок"
            />
            <span style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-3)', pointerEvents: 'none' }}>
              <Icon name="search" size={16} />
            </span>
          </div>
          <button className="btn btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            Новая заметка
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="note"
          title={q ? 'Ничего не нашлось' : 'Здесь пока тихо'}
          hint={q ? 'Попробуйте другой запрос.' : 'Нажмите «Новая заметка» и запишите первую мысль — идея, список покупок, план на выходные.'}
        />
      ) : (
        <div className="notes-grid">
          {list.map((n) => (
            <button
              key={n.id}
              className={`note-card nc-${n.color}`}
              onClick={() => setEditingId(n.id)}
              aria-label={`Открыть заметку «${n.title || 'Без названия'}»`}
            >
              <span
                className={`note-pin${n.pinned ? ' active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch({ t: 'note/update', id: n.id, patch: { pinned: !n.pinned } })
                }}
                role="button"
                aria-label={n.pinned ? 'Открепить' : 'Закрепить'}
                title={n.pinned ? 'Открепить' : 'Закрепить'}
              >
                <Icon name="pin" size={15} />
              </span>
              <div className="note-title">{n.title || 'Без названия'}</div>
              <div className="note-snippet">{n.body || 'Пустая заметка'}</div>
              <div className="note-date">{fmtDate(n.updatedAt)}</div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <Modal title="Заметка" onClose={closeEditor} wide>
          <input
            className="editor-title"
            placeholder="Заголовок"
            value={editing.title}
            onChange={(e) => patch({ title: e.target.value })}
            autoFocus
          />
          <textarea
            className="editor-body"
            placeholder="Пишите здесь…"
            value={editing.body}
            onChange={(e) => patch({ body: e.target.value })}
          />
          <div className="editor-foot">
            <div style={{ display: 'flex', gap: 8 }}>
              {COLOR_DOTS.map((c) => (
                <button
                  key={c.id}
                  className={`dot ${c.cls}${editing.color === c.id ? ' on' : ''}`}
                  onClick={() => patch({ color: c.id })}
                  aria-label={`Цвет: ${c.label}`}
                  title={c.label}
                />
              ))}
            </div>
            <button
              className={`icon-btn${editing.pinned ? ' active' : ''}`}
              style={editing.pinned ? { color: 'var(--accent-strong)' } : undefined}
              onClick={() => patch({ pinned: !editing.pinned })}
              aria-label={editing.pinned ? 'Открепить заметку' : 'Закрепить заметку'}
              title={editing.pinned ? 'Открепить' : 'Закрепить'}
            >
              <Icon name="pin" size={17} />
            </button>
            <span className="editor-meta">
              {editing.title.trim() || editing.body.trim()
                ? `${wordCount(editing.title + ' ' + editing.body)} · ${fmtDate(editing.updatedAt)}`
                : 'Пустая заметка удаляется при закрытии'}
            </span>
            <button className="icon-btn" onClick={() => setConfirmDel(editing)} aria-label="Удалить заметку" title="Удалить">
              <Icon name="trash" size={17} />
            </button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmModal
          title="Удалить заметку?"
          text={`«${confirmDel.title || 'Без названия'}» будет удалена навсегда.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => doDelete(confirmDel)}
        />
      )}
    </>
  )
}

function wordCount(s: string): string {
  const words = s.trim().split(/\s+/).filter(Boolean).length
  if (!words) return ''
  return `${words} сл.`
}

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => (n < 10 ? '0' + n : String(n))
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return `${p(d.getHours())}:${p(d.getMinutes())}`
  return `${d.getDate()} ${['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][d.getMonth()]}`
}
