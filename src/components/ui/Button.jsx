import { cn } from '@/utils/helpers'
import Icon from './Icon'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary:
      'bg-[var(--brand-600)] hover:bg-[var(--brand-500)] text-white shadow-lg active:scale-[0.98]',
    secondary:
      'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-base)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-strong)] active:scale-[0.98]',
    ghost:
      'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:scale-[0.98]',
    danger:
      'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98]',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-sm px-6 py-3',
  }

  return (
    <button
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <Icon name="spinner" size={16} className="animate-spin" />
      ) : icon ? (
        <Icon name={icon} size={16} />
      ) : null}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={16} />}
    </button>
  )
}

export default Button
