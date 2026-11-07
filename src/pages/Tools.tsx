import { useMemo, useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { Icon, type IconName } from '../components/Icon'
import { useToast } from '../components/ui'
import { diffDays, formatEventDate, todayKey } from '../lib/date'
import { makeId, plural } from '../lib/utils'

type ToolId = 'dates' | 'password' | 'convert' | 'percent' | 'counters'

const TOOLS: Array<{ id: ToolId; label: string; icon: IconName; desc: string }> = [
  { id: 'dates', label: 'Отсчёт до даты', icon: 'calendar', desc: 'Дни до события — отпуск, экзамен, день рождения' },
  { id: 'password', label: 'Надёжный пароль', icon: 'key', desc: 'Генератор с настраиваемой сложностью' },
  { id: 'convert', label: 'Конвертер величин', icon: 'swap', desc: 'Длина, масса, объём, данные, температура' },
  { id: 'percent', label: 'Проценты', icon: 'percent', desc: 'Скидки, чаевые и доли — считаются на лету' },
  { id: 'counters', label: 'Счётчики', icon: 'hash', desc: 'Подсчёт чего угодно: подходы, чашки, гости' },
]

export function ToolsPage() {
  const [tool, setTool] = useState<ToolId>('dates')
  const active = TOOLS.find((t) => t.id === tool)!

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Инструменты</h1>
          <div className="page-sub">Маленькие помощники на каждый день</div>
        </div>
      </div>

      <div className="tool-chips">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`tool-chip${tool === t.id ? ' on' : ''}`}
            onClick={() => setTool(t.id)}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <section className="tool-card">
        <h3>{active.label}</h3>
        <p className="tool-desc">{active.desc}</p>
        {tool === 'dates' && <DatesTool />}
        {tool === 'password' && <PasswordTool />}
        {tool === 'convert' && <ConvertTool />}
        {tool === 'percent' && <PercentTool />}
        {tool === 'counters' && <CountersTool />}
      </section>
    </>
  )
}

/* ---------- Отсчёт до даты ---------- */

function DatesTool() {
  const { state, dispatch } = useStore()
  const today = todayKey()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  const sorted = useMemo(
    () =>
      [...state.events].sort((a, b) => Math.abs(diffDays(today, a.date)) - Math.abs(diffDays(today, b.date))),
    [state.events, today],
  )

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date) return
    dispatch({ t: 'event/add', event: { id: makeId(), name: name.trim(), date, createdAt: Date.now() } })
    setName('')
    setDate('')
  }

  return (
    <>
      <form className="add-form" onSubmit={add} style={{ marginBottom: sorted.length ? 10 : 0 }}>
        <input
          type="text"
          className="input"
          style={{ flex: 1, minWidth: 170 }}
          placeholder="Событие: отпуск, экзамен…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Название события"
        />
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Дата события"
        />
        <button className="btn btn-primary" type="submit" disabled={!name.trim() || !date}>
          <Icon name="plus" size={16} />
        </button>
      </form>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', padding: '8px 2px' }}>
          Добавьте событие — увидите, сколько дней осталось. Список сохраняется.
        </p>
      ) : (
        sorted.map((ev) => {
          const d = diffDays(today, ev.date)
          return (
            <div className="event-item" key={ev.id}>
              <div style={{ minWidth: 0 }}>
                <div className="event-name">{ev.name}</div>
                <div className="event-date">{formatEventDate(ev.date)}</div>
              </div>
              <span className={`event-days${d < 0 ? ' past' : ''}`}>
                {d === 0 ? 'Сегодня!' : d > 0 ? `${d} ${plural(d, ['день', 'дня', 'дней'])}` : `${-d} назад`}
              </span>
              <button
                className="icon-btn row-del"
                onClick={() => dispatch({ t: 'event/delete', id: ev.id })}
                aria-label="Удалить событие"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          )
        })
      )}
    </>
  )
}

/* ---------- Пароль ---------- */

function generatePw(len: number, upper: boolean, digits: boolean, symbols: boolean): string {
  let pool = 'abcdefghijkmnopqrstuvwxyz'
  if (upper) pool += 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  if (digits) pool += '23456789'
  if (symbols) pool += '!@#$%^&*-_=+?'
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr, (x) => pool[x % pool.length]).join('')
}

function PasswordTool() {
  const toast = useToast()
  const [len, setLen] = useState(16)
  const [upper, setUpper] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [pw, setPw] = useState(() => generatePw(16, true, true, true))

  const generate = () => {
    setPw(generatePw(len, upper, digits, symbols))
  }

  const bits = pw ? Math.round(pw.length * Math.log2(28 + (upper ? 24 : 0) + (digits ? 8 : 0) + (symbols ? 13 : 0))) : 0
  const strength = bits < 50 ? { label: 'Слабый', color: '#c96b2f', pct: 35 } : bits < 70 ? { label: 'Хороший', color: '#8a9a4a', pct: 60 } : bits < 90 ? { label: 'Сильный', color: '#5e7a46', pct: 80 } : { label: 'Крепость', color: '#3e7257', pct: 100 }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pw)
      toast.show({ message: 'Пароль скопирован' })
    } catch {
      toast.show({ message: 'Не удалось скопировать' })
    }
  }

  return (
    <>
      <div className="pw-out">{pw}</div>
      <div className="pw-strength">
        <div style={{ width: `${strength.pct}%`, background: strength.color }} />
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 16 }}>
        {strength.label} · {bits} бит энтропии
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Длина: {len}</span>
        <input
          type="range"
          min={8}
          max={64}
          value={len}
          onChange={(e) => setLen(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)' }}
          aria-label="Длина пароля"
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <ToggleChip on={upper} onClick={() => setUpper((v) => !v)} label="A-Z" />
        <ToggleChip on={digits} onClick={() => setDigits((v) => !v)} label="0-9" />
        <ToggleChip on={symbols} onClick={() => setSymbols((v) => !v)} label="Символы" />
      </div>

      <div className="ctrl-row">
        <button className="btn btn-primary" onClick={generate}>
          <Icon name="reset" size={16} />
          Сгенерировать
        </button>
        <button className="btn" onClick={copy}>
          <Icon name="copy" size={16} />
          Копировать
        </button>
      </div>
    </>
  )
}

function ToggleChip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button className={`chip-btn${on ? ' on' : ''}`} onClick={onClick} aria-pressed={on}>
      {label}
    </button>
  )
}

/* ---------- Конвертер величин ---------- */

type CatId = 'length' | 'mass' | 'volume' | 'data' | 'temp'

const CATS: Record<CatId, { label: string; units: Record<string, string> }> = {
  length: { label: 'Длина', units: { mm: 'Миллиметры', cm: 'Сантиметры', m: 'Метры', km: 'Километры', in: 'Дюймы', ft: 'Футы', mi: 'Мили' } },
  mass: { label: 'Масса', units: { g: 'Граммы', kg: 'Килограммы', t: 'Тонны', lb: 'Фунты', oz: 'Унции' } },
  volume: { label: 'Объём', units: { ml: 'Миллилитры', l: 'Литры', m3: 'Кубометры', gal: 'Галлоны (США)', cup: 'Чашки (240 мл)' } },
  data: { label: 'Данные', units: { B: 'Байты', KB: 'Килобайты', MB: 'Мегабайты', GB: 'Гигабайты', TB: 'Терабайты' } },
  temp: { label: 'Температура', units: { C: 'Цельсий', F: 'Фаренгейт', K: 'Кельвин' } },
}

const FACTORS: Record<CatId, Record<string, number>> = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, mi: 1609.344 },
  mass: { g: 0.001, kg: 1, t: 1000, lb: 0.45359237, oz: 0.0283495231 },
  volume: { ml: 0.001, l: 1, m3: 1000, gal: 3.785411784, cup: 0.24 },
  data: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
  temp: { C: 1, F: 1, K: 1 },
}

function toCelsius(v: number, unit: string): number {
  if (unit === 'C') return v
  if (unit === 'F') return (v - 32) / 1.8
  return v - 273.15
}

function fromCelsius(c: number, unit: string): number {
  if (unit === 'C') return c
  if (unit === 'F') return c * 1.8 + 32
  return c + 273.15
}

function ConvertTool() {
  const [cat, setCat] = useState<CatId>('length')
  const [from, setFrom] = useState('cm')
  const [to, setTo] = useState('m')
  const [val, setVal] = useState('100')

  const units = Object.entries(CATS[cat].units)
  const num = Number(val.replace(',', '.'))
  const ok = Number.isFinite(num)

  const result = useMemo(() => {
    if (!ok) return ''
    if (cat === 'temp') {
      const r = fromCelsius(toCelsius(num, from), to)
      return fmtNum(r)
    }
    const r = (num * FACTORS[cat][from]) / FACTORS[cat][to]
    return fmtNum(r)
  }, [cat, from, to, num, ok])

  const switchCat = (c: CatId) => {
    setCat(c)
    const keys = Object.keys(CATS[c].units)
    setFrom(keys[1] ?? keys[0])
    setTo(keys[2] ?? keys[0])
  }

  return (
    <>
      <div className="tool-chips" style={{ marginBottom: 16 }}>
        {(Object.keys(CATS) as CatId[]).map((c) => (
          <button key={c} className={`chip-btn${cat === c ? ' on' : ''}`} onClick={() => switchCat(c)}>
            {CATS[c].label}
          </button>
        ))}
      </div>

      <div className="mini-grid">
        <div>
          <label className="field-label" htmlFor="conv-from">Из</label>
          <select className="select" id="conv-from" value={from} onChange={(e) => setFrom(e.target.value)}>
            {units.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
          <button
            className="icon-btn"
            onClick={() => { setFrom(to); setTo(from) }}
            aria-label="Поменять местами"
            title="Поменять местами"
          >
            <Icon name="swap" size={17} />
          </button>
        </div>
        <div>
          <label className="field-label" htmlFor="conv-to">В</label>
          <select className="select" id="conv-to" value={to} onChange={(e) => setTo(e.target.value)}>
            {units.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mini-grid">
        <div>
          <label className="field-label" htmlFor="conv-val">Значение</label>
          <input
            className="input"
            id="conv-val"
            type="text"
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            style={!ok ? { borderColor: 'var(--danger)' } : undefined}
          />
        </div>
        <div>
          <span className="field-label">Результат</span>
          <div className="res-big tnum" style={{ padding: '8px 12px', background: 'var(--inset)', borderRadius: 10, minHeight: 43, overflowWrap: 'anywhere' }}>
            {result || '—'}
          </div>
        </div>
      </div>
    </>
  )
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs !== 0 && (abs < 0.001 || abs >= 1e9)) return n.toExponential(4)
  return String(Math.round(n * 1e6) / 1e6)
}

/* ---------- Проценты ---------- */

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        className="input"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function n(v: string): number {
  return Number(v.replace(',', '.'))
}

function PercentTool() {
  const [price, setPrice] = useState('2500')
  const [discount, setDiscount] = useState('20')
  const [bill, setBill] = useState('3000')
  const [tip, setTip] = useState('10')
  const [guests, setGuests] = useState('2')
  const [a, setA] = useState('45')
  const [b, setB] = useState('600')

  const p = n(price), d = n(discount)
  const final = p - (p * d) / 100

  const bb = n(bill), tt = n(tip), gg = Math.max(1, n(guests) || 1)
  const tipSum = (bb * tt) / 100

  const aa = n(a), bbv = n(b)
  const share = bbv !== 0 ? (aa / bbv) * 100 : NaN

  return (
    <>
      <div className="mini-grid" style={{ marginBottom: 6 }}>
        <NumField label="Цена, ₽" value={price} onChange={setPrice} />
        <NumField label="Скидка, %" value={discount} onChange={setDiscount} />
      </div>
      <div className="res-line">
        <span>Итого со скидкой</span>
        <span className="res-big tnum">{fmtMoney(final)}</span>
      </div>
      <div className="res-line">
        <span>Выгода</span>
        <span className="tnum">{fmtMoney((p * d) / 100)}</span>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '18px 0' }} />

      <div className="mini-grid" style={{ marginBottom: 6 }}>
        <NumField label="Счёт, ₽" value={bill} onChange={setBill} />
        <NumField label="Чаевые, %" value={tip} onChange={setTip} />
        <NumField label="Гостей" value={guests} onChange={setGuests} />
      </div>
      <div className="res-line">
        <span>Чаевые</span>
        <span className="tnum">{fmtMoney(tipSum)}</span>
      </div>
      <div className="res-line">
        <span>Итого с чаевыми</span>
        <span className="tnum">{fmtMoney(bb + tipSum)}</span>
      </div>
      <div className="res-line">
        <span>С каждого</span>
        <span className="res-big tnum">{fmtMoney((bb + tipSum) / gg)}</span>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '18px 0' }} />

      <div className="mini-grid" style={{ marginBottom: 6 }}>
        <NumField label="Число" value={a} onChange={setA} />
        <NumField label="От числа" value={b} onChange={setB} />
      </div>
      <div className="res-line">
        <span>Это составляет</span>
        <span className="res-big tnum">{Number.isFinite(share) ? fmtNum(Math.round(share * 10) / 10) + ' %' : '—'}</span>
      </div>
    </>
  )
}

function fmtMoney(v: number): string {
  if (!Number.isFinite(v)) return '—'
  return `${Math.round(v * 100) / 100} ₽`
}

/* ---------- Счётчики ---------- */

function CountersTool() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [name, setName] = useState('')

  const add = (e: FormEvent) => {
    e.preventDefault()
    const v = name.trim()
    if (!v) return
    dispatch({ t: 'counter/add', counter: { id: makeId(), name: v, value: 0, createdAt: Date.now() } })
    setName('')
  }

  return (
    <>
      <form className="add-form" onSubmit={add} style={{ marginBottom: state.counters.length ? 10 : 0 }}>
        <input
          type="text"
          className="input"
          style={{ flex: 1, minWidth: 170 }}
          placeholder="Новый счётчик: подходы, чашки…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Название счётчика"
        />
        <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
          <Icon name="plus" size={16} />
        </button>
      </form>

      {state.counters.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', padding: '8px 2px' }}>
          Счётчики удобны для всего, что копится: повторения в упражнении, выпитые стаканы воды, прочитанные страницы.
        </p>
      ) : (
        state.counters.map((c) => (
          <div className="cnt-item" key={c.id}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="cnt-name">{c.name}</div>
            </div>
            <button
              className="cnt-btn"
              onClick={() => dispatch({ t: 'counter/bump', id: c.id, delta: -1 })}
              aria-label="Минус один"
            >
              −
            </button>
            <span className="cnt-val tnum">{c.value}</span>
            <button
              className="cnt-btn primary"
              onClick={() => dispatch({ t: 'counter/bump', id: c.id, delta: 1 })}
              aria-label="Плюс один"
            >
              +
            </button>
            <button
              className="icon-btn"
              onClick={() => dispatch({ t: 'counter/update', id: c.id, patch: { value: 0 } })}
              aria-label="Сбросить"
              title="Сбросить"
            >
              <Icon name="reset" size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                dispatch({ t: 'counter/delete', id: c.id })
                toast.show({
                  message: 'Счётчик удалён',
                  actionLabel: 'Вернуть',
                  onAction: () => dispatch({ t: 'counter/add', counter: c }),
                })
              }}
              aria-label="Удалить счётчик"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))
      )}
    </>
  )
}
