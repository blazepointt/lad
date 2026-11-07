// Центральное состояние приложения: React Context + reducer,
// каждый чендж автоматически сохраняется в localStorage.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  AppSettings,
  AppState,
  Counter,
  DateEvent,
  FocusSession,
  Habit,
  Note,
  Task,
} from './types'
import { defaultState, loadState, saveState } from './lib/storage'

export type Action =
  | { t: 'task/add'; task: Task }
  | { t: 'task/update'; id: string; patch: Partial<Task> }
  | { t: 'task/toggle'; id: string }
  | { t: 'task/delete'; id: string }
  | { t: 'note/add'; note: Note }
  | { t: 'note/update'; id: string; patch: Partial<Note> }
  | { t: 'note/delete'; id: string }
  | { t: 'habit/add'; habit: Habit }
  | { t: 'habit/update'; id: string; patch: Partial<Habit> }
  | { t: 'habit/delete'; id: string }
  | { t: 'habit/toggleDay'; id: string; day: string }
  | { t: 'session/add'; session: FocusSession }
  | { t: 'counter/add'; counter: Counter }
  | { t: 'counter/update'; id: string; patch: Partial<Counter> }
  | { t: 'counter/bump'; id: string; delta: number }
  | { t: 'counter/delete'; id: string }
  | { t: 'event/add'; event: DateEvent }
  | { t: 'event/delete'; id: string }
  | { t: 'settings'; patch: Partial<AppSettings> }
  | { t: 'data/import'; state: AppState }
  | { t: 'data/reset' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.t) {
    case 'task/add':
      return { ...state, tasks: [action.task, ...state.tasks] }
    case 'task/update':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }
    case 'task/toggle':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null }
            : t,
        ),
      }
    case 'task/delete':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }

    case 'note/add':
      return { ...state, notes: [action.note, ...state.notes] }
    case 'note/update':
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.id ? { ...n, ...action.patch, updatedAt: Date.now() } : n,
        ),
      }
    case 'note/delete':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) }

    case 'habit/add':
      return { ...state, habits: [...state.habits, action.habit] }
    case 'habit/update':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.id ? { ...h, ...action.patch } : h)),
      }
    case 'habit/delete':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id) }
    case 'habit/toggleDay':
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h
          const has = h.days.includes(action.day)
          return {
            ...h,
            days: has
              ? h.days.filter((d) => d !== action.day)
              : [...h.days, action.day].sort(),
          }
        }),
      }

    case 'session/add':
      return { ...state, sessions: [action.session, ...state.sessions] }

    case 'counter/add':
      return { ...state, counters: [...state.counters, action.counter] }
    case 'counter/update':
      return {
        ...state,
        counters: state.counters.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      }
    case 'counter/bump':
      return {
        ...state,
        counters: state.counters.map((c) =>
          c.id === action.id ? { ...c, value: c.value + action.delta } : c,
        ),
      }
    case 'counter/delete':
      return { ...state, counters: state.counters.filter((c) => c.id !== action.id) }

    case 'event/add':
      return { ...state, events: [...state.events, action.event] }
    case 'event/delete':
      return { ...state, events: state.events.filter((e) => e.id !== action.id) }

    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case 'data/import':
      return action.state

    case 'data/reset':
      return defaultState()

    default:
      return state
  }
}

function applyTheme(settings: AppSettings): void {
  let t = settings.theme
  if (t === 'auto') {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.dataset.theme = t
  document.documentElement.dataset.accent = settings.accent
}

interface StoreCtxValue {
  state: AppState
  dispatch: (a: Action) => void
}

const StoreCtx = createContext<StoreCtxValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState() ?? defaultState())

  // Сохраняем всё состояние при каждом изменении
  useEffect(() => {
    saveState(state)
  }, [state])

  // Тема и акцент
  useEffect(() => {
    applyTheme(state.settings)
  }, [state.settings.theme, state.settings.accent])

  // Следим за системной темой, если выбран режим «Как в системе»
  useEffect(() => {
    if (state.settings.theme !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(state.settings)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [state.settings])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore(): StoreCtxValue {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore должен использоваться внутри StoreProvider')
  return ctx
}
