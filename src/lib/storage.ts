// Сохранение состояния в localStorage (ключ lad.v1)

import type { AppState } from '../types'

export const STORAGE_KEY = 'lad.v1'

export function defaultState(): AppState {
  return {
    version: 1,
    tasks: [],
    notes: [],
    habits: [],
    sessions: [],
    counters: [],
    events: [],
    settings: {
      userName: '',
      theme: 'auto',
      accent: 'terracotta',
      weekStart: 1,
      sound: true,
      focusDefault: 25,
      breakDefault: 5,
    },
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return null
    const d = defaultState()
    const state: AppState = {
      ...d,
      ...p,
      version: 1,
      tasks: Array.isArray(p.tasks) ? p.tasks : [],
      notes: Array.isArray(p.notes) ? p.notes : [],
      habits: Array.isArray(p.habits) ? p.habits : [],
      sessions: Array.isArray(p.sessions) ? p.sessions : [],
      counters: Array.isArray(p.counters) ? p.counters : [],
      events: Array.isArray(p.events) ? p.events : [],
      settings: { ...d.settings, ...(p.settings && typeof p.settings === 'object' ? p.settings : {}) },
    }
    return state
  } catch {
    return null
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Приватный режим или переполнение — приложение продолжает работать в памяти
  }
}

export function exportFileName(): string {
  const d = new Date()
  const p = (n: number) => (n < 10 ? '0' + n : String(n))
  return `lad-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`
}

export function downloadExport(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Мягкая проверка файла резервной копии */
export function parseImport(text: string): AppState | null {
  try {
    const p = JSON.parse(text)
    if (!p || typeof p !== 'object') return null
    const d = defaultState()
    const looksLike =
      Array.isArray(p.tasks) || Array.isArray(p.notes) || Array.isArray(p.habits) ||
      (p.settings && typeof p.settings === 'object')
    if (!looksLike) return null
    return {
      ...d,
      ...p,
      version: 1,
      tasks: Array.isArray(p.tasks) ? p.tasks : [],
      notes: Array.isArray(p.notes) ? p.notes : [],
      habits: Array.isArray(p.habits) ? p.habits : [],
      sessions: Array.isArray(p.sessions) ? p.sessions : [],
      counters: Array.isArray(p.counters) ? p.counters : [],
      events: Array.isArray(p.events) ? p.events : [],
      settings: { ...d.settings, ...(p.settings && typeof p.settings === 'object' ? p.settings : {}) },
    }
  } catch {
    return null
  }
}
