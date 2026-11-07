// Общие типы данных приложения «Лад»

export type TaskPriority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  note?: string
  done: boolean
  createdAt: number
  completedAt?: number | null
  /** Ключ даты 'YYYY-MM-DD' или null, если срок не задан */
  due?: string | null
  priority: TaskPriority
}

export type NoteColor = 'default' | 'sand' | 'sage' | 'clay' | 'sky' | 'rose'

export interface Note {
  id: string
  title: string
  body: string
  color: NoteColor
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: number
  /** Отсортированный список ключей дней 'YYYY-MM-DD', когда привычка выполнена */
  days: string[]
}

export interface FocusSession {
  id: string
  startedAt: number
  minutes: number
  label: string
  isBreak: boolean
}

export interface Counter {
  id: string
  name: string
  value: number
  createdAt: number
}

export interface DateEvent {
  id: string
  name: string
  /** 'YYYY-MM-DD' */
  date: string
  createdAt: number
}

export type ThemeSetting = 'light' | 'dark' | 'auto'

export interface AppSettings {
  userName: string
  theme: ThemeSetting
  accent: string
  weekStart: 0 | 1
  sound: boolean
  focusDefault: number
  breakDefault: number
}

export interface AppState {
  version: number
  tasks: Task[]
  notes: Note[]
  habits: Habit[]
  sessions: FocusSession[]
  counters: Counter[]
  events: DateEvent[]
  settings: AppSettings
}
