import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import Icon from '@/components/ui/Icon'
import VikasanaLogo from '@/components/ui/VikasanaLogo'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin',               label: 'Dashboard',    icon: 'dashboard',   end: true },
  { to: '/admin/faculty',       label: 'Faculty',       icon: 'faculty'               },
  { to: '/admin/students',      label: 'Students',      icon: 'users'                 },
  { to: '/admin/activities',    label: 'Activities',    icon: 'activity'              },
  // { to: '/admin/sessions', label: 'Sessions', icon: 'activity' },
  { to: '/admin/certificates',  label: 'Certificates',  icon: 'certificate'           },
]

const NavItem = ({ to, label, icon, end, collapsed }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative border',
      isActive
        ? 'bg-[var(--brand-500)]/10 text-[var(--brand-400)] border-[var(--brand-500)]/20'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border-transparent',
    )}
    title={collapsed ? label : undefined}
  >
    {({ isActive }) => (
      <>
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--brand-400)] rounded-full" />}
        <span className="flex-shrink-0"><Icon name={icon} size={18} /></span>
        {!collapsed && <span className="truncate">{label}</span>}
      </>
    )}
  </NavLink>
)

const Sidebar = ({ collapsed }) => {
  const { logout, admin } = useAuth()

  return (
    <aside
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      className={cn(
        'flex flex-col h-full border-r transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div
        className={cn('flex items-center border-b flex-shrink-0', collapsed ? 'justify-center px-3 py-[18px]' : 'px-4 py-[17px]')}
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        {collapsed ? <VikasanaLogo variant="icon" size="sm" /> : <VikasanaLogo variant="default" size="sm" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
      </nav>

      {/* Profile + Logout */}
      <div className="flex-shrink-0 p-2 space-y-1" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        {!collapsed && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-base)' }}
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--brand-600)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
            <div className="min-w-0 flex-1">
              <p className="text-[var(--text-primary)] text-xs font-semibold truncate">{admin?.name ?? 'Admin'}</p>
              <p className="text-[var(--text-muted)] text-[10px] truncate">{admin?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium border border-transparent',
            'text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10',
            collapsed && 'justify-center',
          )}
        >
          <Icon name="logout" size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
