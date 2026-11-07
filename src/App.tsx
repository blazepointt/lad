import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { ToastProvider } from './components/ui'
import { Icon, Logo, type IconName } from './components/Icon'
import { TodayPage } from './pages/Today'
import { TasksPage } from './pages/Tasks'
import { NotesPage } from './pages/Notes'
import { CalendarPage } from './pages/Calendar'
import { HabitsPage } from './pages/Habits'
import { FocusPage } from './pages/Focus'
import { ToolsPage } from './pages/Tools'
import { SettingsPage } from './pages/Settings'

export type PageId =
  | 'today' | 'tasks' | 'notes' | 'calendar'
  | 'habits' | 'focus' | 'tools' | 'settings'

const PAGES: Array<{ id: PageId; label: string; icon: IconName }> = [
  { id: 'today', label: 'Главная', icon: 'home' },
  { id: 'tasks', label: 'Задачи', icon: 'tasks' },
  { id: 'notes', label: 'Заметки', icon: 'note' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar' },
  { id: 'habits', label: 'Привычки', icon: 'repeat' },
  { id: 'focus', label: 'Фокус', icon: 'timer' },
  { id: 'tools', label: 'Инструменты', icon: 'spark' },
  { id: 'settings', label: 'Настройки', icon: 'settings' },
]

function pageFromHash(): PageId {
  const h = window.location.hash.replace(/^#\/?/, '')
  return (PAGES.some((p) => p.id === h) ? h : 'today') as PageId
}

function Shell() {
  const { state } = useStore()
  const [page, setPage] = useState<PageId>(pageFromHash)
  const [drawer, setDrawer] = useState(false)

  useEffect(() => {
    const onHash = () => {
      setPage(pageFromHash())
      setDrawer(false)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (p: PageId) => {
    if (p === page) {
      setDrawer(false)
      return
    }
    window.location.hash = `#/${p}`
  }

  // Заголовок вкладки браузера
  useEffect(() => {
    const label = PAGES.find((p) => p.id === page)?.label ?? ''
    document.title = `Лад — ${label}`
  }, [page])

  const activeCount = state.tasks.filter((t) => !t.done).length
  const current = PAGES.find((p) => p.id === page)!

  const resolvedTheme =
    state.settings.theme === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : state.settings.theme

  const toggleTheme = () => {
    // Требуется доступ к dispatch — используем событие, обработаем в Settings-подобном месте.
    // Проще: переключаем напрямую через data-theme и обновим настройку через хранилище ниже.
    window.dispatchEvent(
      new CustomEvent('lad:toggle-theme', { detail: resolvedTheme === 'dark' ? 'light' : 'dark' }),
    )
  }

  const nav = (
    <>
      {PAGES.map((p) => (
        <button
          key={p.id}
          className={`nav-btn${p.id === page ? ' on' : ''}`}
          onClick={() => go(p.id)}
        >
          <Icon name={p.icon} size={19} />
          {p.label}
          {p.id === 'tasks' && activeCount > 0 && <span className="nav-count">{activeCount}</span>}
        </button>
      ))}
    </>
  )

  const pageEl = (() => {
    switch (page) {
      case 'today': return <TodayPage go={go} />
      case 'tasks': return <TasksPage />
      case 'notes': return <NotesPage />
      case 'calendar': return <CalendarPage />
      case 'habits': return <HabitsPage />
      case 'focus': return <FocusPage />
      case 'tools': return <ToolsPage />
      case 'settings': return <SettingsPage />
    }
  })()

  return (
    <div className="shell">
      <aside className={`sidebar${drawer ? ' open' : ''}`}>
        <div className="brand">
          <Logo />
          <div className="brand-text">
            <div className="brand-name">Лад</div>
            <div className="brand-sub">личное пространство</div>
          </div>
        </div>
        <nav aria-label="Разделы">{nav}</nav>
        <div className="side-foot">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Переключить тему"
            title="Переключить тему"
          >
            <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
          <span className="side-version">версия 1.0</span>
        </div>
      </aside>

      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setDrawer(true)} aria-label="Меню">
            <Icon name="menu" size={20} />
          </button>
          <span className="topbar-title">{current.label}</span>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Переключить тему">
            <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </header>
        <div className="page-wrap">
          <div className="page" key={page}>
            {pageEl}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Слушатель переключения темы из шапки — меняет настройку в хранилище */
function ThemeToggleBridge() {
  const { dispatch } = useStore()
  useEffect(() => {
    const handler = (e: Event) => {
      const theme = (e as CustomEvent<'light' | 'dark'>).detail
      dispatch({ t: 'settings', patch: { theme } })
    }
    window.addEventListener('lad:toggle-theme', handler)
    return () => window.removeEventListener('lad:toggle-theme', handler)
  }, [dispatch])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <ThemeToggleBridge />
        <Shell />
      </ToastProvider>
    </StoreProvider>
  )
}
