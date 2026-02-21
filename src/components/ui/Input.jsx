import { cn } from '@/utils/helpers'
import Icon from './Icon'

const Input = ({
  label,
  icon,
  error,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-secondary)] tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-3.5 flex items-center text-[var(--text-muted)] pointer-events-none">
            <Icon name={icon} size={16} />
          </span>
        )}
        <input
          className={cn(
            'w-full rounded-xl bg-[var(--bg-input)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm transition-all duration-200',
            'focus:outline-none focus:ring-1',
            icon ? 'pl-10 pr-4' : 'px-4',
            'py-3',
            error
              ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20'
              : 'border-[var(--border-input)] focus:border-[var(--brand-500)] focus:ring-[var(--brand-500)]/20',
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <Icon name="x" size={12} /> {error}
        </p>
      )}
    </div>
  )
}

export default Input
