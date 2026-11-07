// Статистика привычек: серии и процент за 30 дней

import { diffDays, shiftKey, todayKey } from './date'

export interface HabitStats {
  /** Текущая серия (учитывает «сегодня ещё не отмечено») */
  cur: number
  /** Лучшая серия */
  best: number
}

function toSet(days: string[]): Set<string> {
  return new Set(days)
}

export function habitStats(days: string[]): HabitStats {
  const set = toSet(days)
  if (set.size === 0) return { cur: 0, best: 0 }

  const sorted = [...set].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (diffDays(sorted[i - 1], sorted[i]) === 1) run++
    else run = 1
    if (run > best) best = run
  }

  const today = todayKey()
  const yesterday = shiftKey(today, -1)
  let anchor: string | null = null
  if (set.has(today)) anchor = today
  else if (set.has(yesterday)) anchor = yesterday

  let cur = 0
  while (anchor && set.has(anchor)) {
    cur++
    anchor = shiftKey(anchor, -1)
  }

  return { cur, best: Math.max(best, cur) }
}

/** Доля выполненных дней за последние 30 суток, 0..100 */
export function last30Pct(days: string[]): number {
  const set = toSet(days)
  const today = todayKey()
  let count = 0
  for (let i = 0; i < 30; i++) {
    if (set.has(shiftKey(today, -i))) count++
  }
  return Math.round((count / 30) * 100)
}
