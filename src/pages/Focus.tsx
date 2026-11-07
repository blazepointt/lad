import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { EmptyState, ProgressRing } from '../components/ui'
import { WD_BY_IDX, dateKey, shiftKey, todayKey } from '../lib/date'
import { chime, ensureAudio } from '../lib/sound'
import { makeId, pad2 } from '../lib/utils'

/* Активный запуск таймера живёт в отдельном ключе localStorage,
   чтобы перезагрузка страницы не сбрасывала отсчёт. */

interface Run {
  endsAt: number | null // null — на паузе
  remainingMs: number
  totalSec: number
  label: string
  isBreak: boolean
}

const RUN_KEY = 'lad.run.v1'

function loadRun(): Run | null {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return null
    const r = JSON.parse(raw) as Run
    if (typeof r.totalSec !== 'number' || typeof r.remainingMs !== 'number') return null
    return r
  } catch {
    return null
  }
}

function saveRun(r: Run | null) {
  try {
    if (r) localStorage.setItem(RUN_KEY, JSON.stringify(r))
    else localStorage.removeItem(RUN_KEY)
  } catch {
    /* ignore */
  }
}

const PRESETS = [15, 25, 50]

export function FocusPage() {
  const { state, dispatch } = useStore()

  const [run, setRun] = useState<Run | null>(loadRun)
  const [minutes, setMinutes] = useState(state.settings.focusDefault)
  const [custom, setCustom] = useState('')
  const [taskId, setTaskId] = useState('')
  const [now, setNow] = useState(Date.now())
  const [finished, setFinished] = useState<{ min: number; isBreak: boolean } | null>(null)
  const finishedRef = useRef(false)

  // Сохраняем запуск при каждом изменении
  useEffect(() => {
    saveRun(run)
  }, [run])

  // Тикаем, только пока таймер идёт
  const running = !!run && run.endsAt !== null
  useEffect(() => {
    if (!running) return
    const i = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(i)
  }, [running])

  const remainingMs = run
    ? run.endsAt !== null
      ? Math.max(0, run.endsAt - now)
      : run.remainingMs
    : 0

  // Завершение
  useEffect(() => {
    if (!run || run.endsAt === null) return
    if (run.endsAt - now > 0) return
    if (finishedRef.current) return
    finishedRef.current = true

    const min = Math.max(1, Math.round(run.totalSec / 60))
    dispatch({
      t: 'session/add',
      session: {
        id: makeId(),
        startedAt: Date.now() - run.totalSec * 1000,
        minutes: min,
        label: run.label,
        isBreak: run.isBreak,
      },
    })
    if (state.settings.sound) chime()
    setRun(null)
    setFinished({ min, isBreak: run.isBreak })
  }, [now, run, dispatch, state.settings.sound])

  const activeTasks = state.tasks.filter((t) => !t.done).slice(0, 40)
  const selTask = activeTasks.find((t) => t.id === taskId)

  const start = (min: number, isBreak: boolean) => {
    ensureAudio()
    finishedRef.current = false
    setFinished(null)
    const sec = min * 60
    setRun({
      endsAt: Date.now() + sec * 1000,
      remainingMs: sec * 1000,
      totalSec: sec,
      label: isBreak ? 'Перерыв' : selTask ? selTask.title : 'Фокус',
      isBreak,
    })
    setNow(Date.now())
  }

  const pause = () => {
    if (!run || run.endsAt === null) return
    setRun({ ...run, endsAt: null, remainingMs: Math.max(0, run.endsAt - Date.now()) })
  }

  const resume = () => {
    if (!run) return
    ensureAudio()
    setRun({ ...run, endsAt: Date.now() + run.remainingMs })
    setNow(Date.now())
  }

  const reset = () => {
    finishedRef.current = false
    setRun(null)
    setFinished(null)
  }

  const applyCustom = () => {
    const v = Math.round(Number(custom))
    if (Number.isFinite(v) && v >= 1 && v <= 240) {
      setMinutes(v)
      setCustom('')
    }
  }

  const totalSec = run?.totalSec ?? minutes * 60
  const progress = 1 - remainingMs / (totalSec * 1000)
  const shownSec = Math.ceil(remainingMs / 1000)

  const stats = useMemo(() => {
    const today = todayKey()
    const isToday = (ts: number) => dateKey(new Date(ts)) === today
    const focus = state.sessions.filter((s) => !s.isBreak)
    const todayMin = focus.filter((s) => isToday(s.startedAt)).reduce((a, s) => a + s.minutes, 0)
    const todayCount = focus.filter((s) => isToday(s.startedAt)).length
    const weekStartTs = Date.now() - 6 * 86400000
    const weekMin = focus.filter((s) => s.startedAt >= weekStartTs).reduce((a, s) => a + s.minutes, 0)
    const allMin = focus.reduce((a, s) => a + s.minutes, 0)

    // Последние 7 дней
    const days = Array.from({ length: 7 }, (_, i) => {
      const k = shiftKey(today, i - 6)
      const min = focus
        .filter((s) => dateKey(new Date(s.startedAt)) === k)
        .reduce((a, s) => a + s.minutes, 0)
      return { key: k, min, label: WD_BY_IDX[new Date(k + 'T00:00:00').getDay()] }
    })
    const max = Math.max(...days.map((d) => d.min), 1)
    return { todayMin, todayCount, weekMin, allMin, days, max }
  }, [state.sessions])

  const idle = !run

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Фокус</h1>
          <div className="page-sub">Время без отвлечений — один раунд за раз</div>
        </div>
      </div>

      <div className="focus-wrap">
        <div className="preset-row">
          {PRESETS.map((p) => (
            <button
              key={p}
              className={`chip-btn${minutes === p && idle ? ' on' : ''}`}
              disabled={!idle}
              onClick={() => setMinutes(p)}
            >
              {p} мин
            </button>
          ))}
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <input
              type="number"
              className="input"
              style={{ width: 76 }}
              min={1}
              max={240}
              placeholder="мин"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyCustom() }}
              disabled={!idle}
              aria-label="Своя длительность в минутах"
            />
            {custom && (
              <button className="btn" onClick={applyCustom} disabled={!idle}>
                Задать
              </button>
            )}
          </span>
        </div>

        <ProgressRing progress={progress} size={280} stroke={11}>
          <div>
            <div className="ring-time tnum">
              {pad2(Math.floor(shownSec / 60))}:{pad2(shownSec % 60)}
            </div>
            <div className="ring-label" title={run?.label}>
              {run
                ? run.isBreak
                  ? 'Перерыв — отдохните'
                  : run.label
                : finished
                  ? ''
                  : `${minutes} минут тишины`}
            </div>
          </div>
        </ProgressRing>

        {finished ? (
          <div className="done-card anniv">
            <div className="big">
              {finished.isBreak ? 'Перерыв закончен' : `Готово: ${finished.min} мин в фокусе`}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
              {finished.isBreak ? 'Возвращайтесь к делам, когда будете готовы.' : 'Раунд записан в статистику.'}
            </div>
            <div className="ctrl-row" style={{ marginTop: 6 }}>
              <button className="btn btn-primary btn-lg" onClick={() => start(minutes, false)}>
                <Icon name="play" size={17} />
                Ещё раунд
              </button>
              {!finished.isBreak && (
                <button className="btn btn-lg" onClick={() => start(state.settings.breakDefault, true)}>
                  Перерыв {state.settings.breakDefault} мин
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="ctrl-row">
            {run ? (
              running ? (
                <button className="btn btn-primary btn-lg" onClick={pause}>
                  <Icon name="pause" size={17} />
                  Пауза
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={resume}>
                  <Icon name="play" size={17} />
                  Продолжить
                </button>
              )
            ) : (
              <button className="btn btn-primary btn-lg" onClick={() => start(minutes, false)}>
                <Icon name="play" size={17} />
                Старт — {minutes} мин
              </button>
            )}
            <button className="btn btn-lg" onClick={reset} disabled={idle && !finished}>
              <Icon name="reset" size={16} />
              Сброс
            </button>
          </div>
        )}

        {idle && !finished && activeTasks.length > 0 && (
          <div className="focus-link-row">
            <select
              className="select"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              aria-label="Связать раунд с задачей"
            >
              <option value="">Связать с задачей (необязательно)</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ marginTop: 36 }}>
        <div className="stat-grid stat-grid-3">
          <div className="stat">
            <div className="stat-ico"><Icon name="timer" size={19} /></div>
            <div>
              <div className="n tnum">{stats.todayMin}</div>
              <div className="l">мин сегодня · {stats.todayCount} раунд(ов)</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-ico"><Icon name="calendar" size={19} /></div>
            <div>
              <div className="n tnum">{stats.weekMin}</div>
              <div className="l">мин за 7 дней</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-ico"><Icon name="target" size={19} /></div>
            <div>
              <div className="n tnum">{stats.allMin}</div>
              <div className="l">мин всего</div>
            </div>
          </div>
        </div>

        <section className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Последние 7 дней</div>
          {state.sessions.length === 0 ? (
            <EmptyState icon="timer" title="Пока ни одного раунда" hint="Запустите таймер — 25 минут тишины творят чудеса." />
          ) : (
            <div className="bars">
              {stats.days.map((d) => (
                <div className="bar-col" key={d.key}>
                  <div
                    className={`bar-fill${d.min === stats.max && d.min > 0 ? ' max' : ''}`}
                    style={{ height: `${Math.max(3, (d.min / stats.max) * 100)}%` }}
                    title={`${d.min} мин`}
                  />
                  <span className="bar-lbl">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
