// Мелкие общие помощники

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Русские склонения: plural(5, ['день','дня','дней']) */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100
  const n10 = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (n10 > 1 && n10 < 5) return forms[1]
  if (n10 === 1) return forms[0]
  return forms[2]
}

/** 45 → «45 мин», 75 → «1 ч 15 мин» */
export function fmtMinutes(min: number): string {
  const m = Math.max(0, Math.round(min))
  if (m < 60) return `${m} мин`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} ч ${rest} мин` : `${h} ч`
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
