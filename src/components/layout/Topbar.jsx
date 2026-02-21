import { useLocation } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import ThemeToggle from '@/components/ui/ThemeToggle'

const PAGE_TITLES = {
  '/admin':               { title: 'Dashboard',     sub: 'Overview of all platform activity' },
  '/admin/faculty':       { title: 'Faculty',        sub: 'Manage faculty members and invitations' },
  '/admin/students':      { title: 'Students',       sub: 'View and manage enrolled students' },
  '/admin/activities':    { title: 'Activities',     sub: 'Monitor all activity submissions' },
  '/admin/certificates':  { title: 'Certificates',   sub: 'Track certificate generation progress' },
}

const Topbar = ({ onMenuToggle }) => {
  const { pathname } = useLocation()
  const meta = PAGE_TITLES[pathname] ?? { title: 'Admin', sub: '' }
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 backdrop-blur-md border-b flex-shrink-0"
      style={{ background: 'var(--topbar-bg)', borderColor: 'var(--border-base)' }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
          aria-label="Toggle sidebar"
        >
          <Icon name="menu" size={18} />
        </button>
        <div>
          <h1 className="text-[var(--text-primary)] font-semibold text-base leading-tight">{meta.title}</h1>
          <p className="text-[var(--text-muted)] text-xs leading-tight hidden sm:block">{meta.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="hidden md:block text-[var(--text-muted)] text-xs font-medium">{dateStr}</span>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative p-2 rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]">
          <Icon name="bell" size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl bg-[var(--brand-600)] flex items-center justify-center text-white text-xs font-bold">A</div>
      </div>
    </header>
  )
}

export default Topbar
