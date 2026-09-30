import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileText,
  LayoutGrid,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import './workspace.css'

type User = { id: number; username: string }
type Todo = { id: number; title: string; description: string | null }
type AuthResponse = { user: User; access_token: { access_token: string } }
type TaskFilter = 'all' | 'notes' | 'no-notes'

const SESSION_KEY = 'jira-lite-session'

function getSavedSession(): { user: User; token: string } | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY)
    return saved ? (JSON.parse(saved) as { user: User; token: string }) : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

async function getError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string | { msg?: string }[] }
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) return body.detail.map((item) => item.msg).filter(Boolean).join(', ')
  } catch {
    return `Request failed (${response.status})`
  }
  return `Request failed (${response.status})`
}

function App() {
  const [session] = useState(getSavedSession)
  const [user, setUser] = useState<User | null>(session?.user ?? null)
  const [token, setToken] = useState(session?.token ?? '')
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(Boolean(session))
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [pageError, setPageError] = useState('')
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [showComposer, setShowComposer] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!token) return
    let active = true
    async function loadTodos() {
      setLoading(true)
      setPageError('')
      try {
        const response = await fetch('/todo/my-todos', { headers: { Authorization: `Bearer ${token}` } })
        if (response.status === 401) {
          localStorage.removeItem(SESSION_KEY)
          if (active) {
            setToken('')
            setUser(null)
            setAuthError('Your session expired. Please sign in again.')
          }
          return
        }
        if (!response.ok) throw new Error(await getError(response))
        const items = (await response.json()) as Todo[]
        if (active) setTodos(items)
      } catch (error) {
        if (active) setPageError(error instanceof Error ? error.message : 'Could not load your tasks.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadTodos()
    return () => { active = false }
  }, [token])

  const visibleTodos = useMemo(() => todos.filter((todo) => {
    const text = `${todo.title} ${todo.description ?? ''}`.toLowerCase()
    const matchesText = text.includes(query.trim().toLowerCase())
    const hasNote = Boolean(todo.description?.trim())
    return matchesText && (filter === 'all' || (filter === 'notes' ? hasNote : !hasNote))
  }), [filter, query, todos])
  const notedCount = todos.filter((todo) => Boolean(todo.description?.trim())).length

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setAuthError('')
    try {
      if (authMode === 'register') {
        const registration = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        if (!registration.ok) throw new Error(await getError(registration))
      }
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) throw new Error(await getError(response))
      const result = (await response.json()) as AuthResponse
      const nextSession = { user: result.user, token: result.access_token.access_token }
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      setUser(nextSession.user)
      setToken(nextSession.token)
      setPassword('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    setPageError('')
    try {
      const response = await fetch('/todo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      })
      if (!response.ok) throw new Error(await getError(response))
      const created = (await response.json()) as Todo
      setTodos((current) => [created, ...current])
      setTitle('')
      setDescription('')
      setShowComposer(false)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Could not create this task.')
    } finally {
      setBusy(false)
    }
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    setToken('')
    setTodos([])
    setAuthError('')
    setPageError('')
  }

  if (!user) return (
    <main className="auth-screen">
      <section className="auth-story">
        <a className="brand brand-light" href="/" aria-label="Jira Lite home"><span className="brand-mark"><LayoutGrid size={18} /></span><span>jira<span className="brand-dot">.</span>lite</span></a>
        <div className="story-copy"><span className="eyebrow"><Sparkles size={14} /> YOUR WORK, IN FOCUS</span><h1>Make room<br />for the work<br /><em>that matters.</em></h1><p>A clear place to collect what’s next, and keep your attention where it belongs.</p></div>
        <div className="story-footer"><span>01</span><span className="story-rule" /><span>PERSONAL WORKSPACE</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top"><span>Workspace access</span><CircleHelp size={18} /></div>
        <form className="auth-form" onSubmit={handleAuth}>
          <span className="form-kicker">{authMode === 'login' ? 'WELCOME BACK' : 'A FRESH START'}</span>
          <h2>{authMode === 'login' ? 'Sign in to your space' : 'Create your account'}</h2>
          <p>{authMode === 'login' ? 'Pick up right where you left off.' : 'Set up a personal workspace in seconds.'}</p>
          <label htmlFor="username">Username</label>
          <input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Your username" required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required />
          {authError && <p className="inline-error" role="alert">{authError}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" size={17} />}{authMode === 'login' ? 'Sign in' : 'Create account'}{!busy && <ArrowRight size={17} />}</button>
          <div className="auth-switch"><span>{authMode === 'login' ? 'New around here?' : 'Already have an account?'}</span><button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></div>
        </form>
        <p className="auth-footnote">A quieter way to move things forward.</p>
      </section>
    </main>
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Jira Lite home"><span className="brand-mark"><LayoutGrid size={18} /></span><span>jira<span className="brand-dot">.</span>lite</span></a>
        <div className="workspace-picker"><div className="workspace-avatar">{user.username.slice(0, 1).toUpperCase()}</div><div className="workspace-name"><strong>{user.username}</strong><span>Personal workspace</span></div><ChevronDown size={15} /></div>
        <span className="nav-label">WORKSPACE</span>
        <nav className="primary-nav" aria-label="Main navigation"><a className="nav-item active" href="#tasks"><ClipboardList size={17} /><span>My tasks</span><span className="nav-count">{todos.length}</span></a><a className="nav-item" href="#overview"><LayoutGrid size={17} /><span>Overview</span></a></nav>
        <div className="sidebar-bottom"><div className="sidebar-note"><Sparkles size={15} /><span>Keep it simple.<br />Keep it moving.</span></div><button className="profile-button" type="button" onClick={signOut}><span className="profile-avatar">{user.username.slice(0, 1).toUpperCase()}</span><span className="profile-label"><strong>{user.username}</strong><small>Personal account</small></span><LogOut size={16} /></button></div>
      </aside>
      <main className="main-area" id="overview">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>My tasks</strong></div><div className="topbar-actions"><span className="connection-label"><span className="status-dot" />Connected</span><button className="icon-button" type="button" title="Sign out" aria-label="Sign out" onClick={signOut}><LogOut size={17} /></button></div></header>
        <div className="page-content" id="tasks">
          <section className="page-heading"><div><span className="eyebrow heading-eyebrow">YOUR PERSONAL WORKSPACE</span><h1>Your task space<span className="heading-period">.</span></h1><p>One thing at a time. You’ve got this.</p></div><button className="button button-primary create-button" type="button" onClick={() => setShowComposer((open) => !open)}>{showComposer ? <X size={17} /> : <Plus size={18} />}{showComposer ? 'Close' : 'New task'}</button></section>
          {pageError && <div className="notice-error" role="alert">{pageError}<button type="button" aria-label="Dismiss error" onClick={() => setPageError('')}><X size={16} /></button></div>}
          <section className="summary-grid" aria-label="Task summary"><article className="summary-card"><span className="summary-icon"><ClipboardList size={18} /></span><span className="summary-caption">IN YOUR SPACE</span><strong>{todos.length.toString().padStart(2, '0')}</strong><span className="summary-foot">{todos.length === 1 ? 'task collected' : 'tasks collected'}</span></article><article className="summary-card summary-notes"><span className="summary-icon"><FileText size={18} /></span><span className="summary-caption">WITH A NOTE</span><strong>{notedCount.toString().padStart(2, '0')}</strong><span className="summary-foot">with extra context</span></article><article className="summary-aside"><div className="aside-asterisk">✳</div><div><strong>Small steps count.</strong><span>Keep collecting the things you want to move forward.</span></div></article></section>
          {showComposer && <form className="composer" onSubmit={handleCreateTodo}><div className="composer-heading"><div><span className="form-kicker">ADD TO YOUR SPACE</span><h2>A new thing to tackle</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close task form" onClick={() => setShowComposer(false)}><X size={17} /></button></div><label htmlFor="task-title">Task title</label><input id="task-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs your attention?" maxLength={200} required /><label htmlFor="task-description">A little context <span>optional</span></label><textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a note to your future self..." rows={3} maxLength={2000} /><div className="composer-footer"><span>{title.length}/200</span><button className="button button-primary" type="submit" disabled={busy || !title.trim()}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}Add task</button></div></form>}
          <section className="task-section" aria-label="Your tasks">
            <div className="list-heading"><div><span className="form-kicker">YOUR PERSONAL BACKLOG</span><h2>Tasks <span>{todos.length}</span></h2></div><div className="list-tools"><label className="search-box"><Search size={16} /><input aria-label="Search tasks" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" /><kbd>/</kbd></label><button className="filter-button" type="button" title="Cycle task filter" onClick={() => setFilter((current) => current === 'all' ? 'notes' : current === 'notes' ? 'no-notes' : 'all')}><ArrowDownUp size={15} /><span>{filter === 'all' ? 'All tasks' : filter === 'notes' ? 'With notes' : 'No notes'}</span><ChevronDown size={14} /></button></div></div>
            {loading ? <div className="loading-state"><LoaderCircle className="spin" size={23} /><span>Gathering your tasks...</span></div> : visibleTodos.length ? <div className="task-list">{visibleTodos.map((todo, index) => <article className="task-row" key={todo.id} style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}><div className="task-marker"><span>{(index + 1).toString().padStart(2, '0')}</span><span className="marker-line" /></div><div className="task-copy"><div className="task-title-line"><h3>{todo.title}</h3><span className="task-id">#{todo.id.toString().padStart(3, '0')}</span></div>{todo.description ? <p>{todo.description}</p> : <p className="no-description">No additional notes</p>}</div><span className={`task-tag ${todo.description ? 'tag-notes' : 'tag-simple'}`}>{todo.description ? <><FileText size={12} />Notes</> : <><Check size={12} />Captured</>}</span></article>)}</div> : <div className="empty-state"><div className="empty-icon"><ClipboardList size={22} /></div><h3>{query || filter !== 'all' ? 'Nothing matches just yet.' : 'A little room to begin.'}</h3><p>{query || filter !== 'all' ? 'Try another search or change the filter.' : 'Your next good idea can start right here.'}</p>{!query && filter === 'all' && <button className="text-action" type="button" onClick={() => setShowComposer(true)}>Add your first task <ArrowRight size={15} /></button>}</div>}
            <footer className="list-footer"><span>{visibleTodos.length} {visibleTodos.length === 1 ? 'item' : 'items'} shown</span><span><span className="footer-dot" />Synced to your workspace</span></footer>
          </section>
          <div className="page-bottom"><span>JIRA LITE <span className="brand-dot">/</span> PERSONAL WORKSPACE</span><span>Make progress, not noise.</span></div>
        </div>
      </main>
    </div>
  )
}

export default App
