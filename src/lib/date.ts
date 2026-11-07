// Работа с датами без внешних библиотек.
// Ключ даты везде — локальная строка 'YYYY-MM-DD'.

export const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

export const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const WEEKDAYS_FULL = [
  'воскресенье', 'понедельник', 'вторник', 'среда',
  'четверг', 'пятница', 'суббота',
]

/** Короткие подписи по индексу getDay(): 0 — воскресенье */
export const WD_BY_IDX = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`
}

export function todayKey(): string {
  return dateKey(new Date())
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function shiftKey(key: string, n: number): string {
  return dateKey(addDays(parseKey(key), n))
}

/** Сколько целых дней от a до b (b позже a → положительно) */
export function diffDays(aKey: string, bKey: string): number {
  const a = parseKey(aKey)
  const b = parseKey(bKey)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function startOfWeek(d: Date, weekStart: 0 | 1): Date {
  const day = d.getDay()
  const diff = (day - weekStart + 7) % 7
  const r = new Date(d)
  r.setDate(r.getDate() - diff)
  r.setHours(0, 0, 0, 0)
  return r
}

/** «7 ноября 2026» — год показывается, только если не текущий */
export function formatLong(key: string): string {
  const d = parseKey(key)
  const y = d.getFullYear()
  const base = `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
  return y === new Date().getFullYear() ? base : `${base} ${y}`
}

/** «суббота, 7 ноября» */
export function formatWeekday(key: string): string {
  const d = parseKey(key)
  return `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

/** Относительный формат: Сегодня / Завтра / Вчера / 7 ноября */
export function formatDay(key: string): string {
  const diff = diffDays(todayKey(), key)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Завтра'
  if (diff === -1) return 'Вчера'
  return formatLong(key)
}

/** Дата события: «сб, 14 марта 2027» */
export function formatEventDate(key: string): string {
  const d = parseKey(key)
  const wd = WD_BY_IDX[d.getDay()].toLowerCase()
  return `${wd}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`
}

export interface MonthCell {
  key: string
  day: number
  /** День из соседнего месяца */
  out: boolean
}

/** Сетка 6×7 для месяца; weekStart — 1 (с Пн) или 0 (с Вс) */
export function makeMonthCells(y: number, m: number, weekStart: 0 | 1): MonthCell[] {
  const start = startOfWeek(new Date(y, m, 1), weekStart)
  const cells: MonthCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i)
    cells.push({ key: dateKey(d), day: d.getDate(), out: d.getMonth() !== m })
  }
  return cells
}
