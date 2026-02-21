import { cn, getInitials } from '@/utils/helpers'
import Icon from './Icon'

/* ── StatusBadge ─────────────────────────────────────────────────────────── */
export const StatusBadge = ({ status }) => {
  const styles = {
    Active:         'bg-[var(--status-active-bg)]   text-[var(--status-active-text)]   border-[var(--status-active-border)]',
    Approved:       'bg-[var(--status-active-bg)]   text-[var(--status-active-text)]   border-[var(--status-active-border)]',
    Pending:        'bg-[var(--status-pending-bg)]  text-[var(--status-pending-text)]  border-[var(--status-pending-border)]',
    'Under Review': 'bg-[var(--status-review-bg)]   text-[var(--status-review-text)]   border-[var(--status-review-border)]',
    Inactive:       'bg-[var(--status-inactive-bg)] text-[var(--status-inactive-text)] border-[var(--status-inactive-border)]',
    Rejected:       'bg-[var(--status-inactive-bg)] text-[var(--status-inactive-text)] border-[var(--status-inactive-border)]',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border', styles[status] ?? 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-base)]')}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  )
}

/* ── StatCard ────────────────────────────────────────────────────────────── */
export const StatCard = ({ label, value, sub, icon, accent = 'brand', trend, index = 0 }) => {
  const accents = {
    brand:   { border: 'border-[var(--brand-500)]/20',    icon: 'bg-[var(--brand-500)]/10 text-[var(--brand-400)]' },
    gold:    { border: 'border-[var(--gold-500)]/20',     icon: 'bg-[var(--gold-500)]/10  text-[var(--gold-500)]'  },
    emerald: { border: 'border-emerald-500/20',           icon: 'bg-emerald-500/10 text-[var(--status-active-text)]' },
    amber:   { border: 'border-amber-500/20',             icon: 'bg-amber-500/10 text-[var(--status-pending-text)]' },
  }
  const a = accents[accent] ?? accents.brand

  return (
    <div
      className={cn('glass glass-hover rounded-2xl p-5 border shadow-theme opacity-0-start animate-fade-up', a.border)}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', a.icon)}>
          <Icon name={icon} size={20} />
        </div>
        {trend !== undefined && (
          <span className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-[var(--status-active-text)]' : 'text-[var(--status-inactive-text)]')}>
            <Icon name="trendUp" size={12} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
      <p className="text-sm font-medium text-[var(--text-secondary)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  )
}

/* ── ProgressBar ─────────────────────────────────────────────────────────── */
export const ProgressBar = ({ value = 0, color = '', className = '' }) => (
  <div className={cn('w-full rounded-full h-1.5 overflow-hidden', 'bg-[var(--border-base)]', className)}>
    <div
      className={cn('h-full rounded-full transition-all duration-700', color || 'bg-[var(--brand-500)]')}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)

/* ── Avatar ──────────────────────────────────────────────────────────────── */
export const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }
  if (src) return <img src={src} alt={name} className={cn('rounded-xl object-cover flex-shrink-0', sizes[size], className)} />
  return (
    <div className={cn('rounded-xl flex items-center justify-center font-semibold flex-shrink-0 border', 'bg-[var(--brand-600)]/20 text-[var(--brand-400)] border-[var(--brand-500)]/20', sizes[size], className)}>
      {getInitials(name)}
    </div>
  )
}

/* ── Card ────────────────────────────────────────────────────────────────── */
export const Card = ({ children, className = '', title, action }) => (
  <div className={cn('glass rounded-2xl border border-[var(--border-base)] shadow-theme', className)}>
    {(title || action) && (
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        {title && <h3 className="font-semibold text-[var(--text-primary)] text-sm">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
)

/* ── Table ───────────────────────────────────────────────────────────────── */
export const Table = ({ headers, children, className = '' }) => (
  <div className={cn('overflow-x-auto', className)}>
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--border-subtle)]">
          {headers.map((h) => (
            <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border-subtle)]">{children}</tbody>
    </table>
  </div>
)

/* ── EmptyState ──────────────────────────────────────────────────────────── */
export const EmptyState = ({ icon = 'search', title = 'No results', description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-base)] flex items-center justify-center text-[var(--text-muted)] mb-4">
      <Icon name={icon} size={24} />
    </div>
    <p className="text-[var(--text-primary)] font-medium">{title}</p>
    {description && <p className="text-[var(--text-muted)] text-sm mt-1">{description}</p>}
  </div>
)
