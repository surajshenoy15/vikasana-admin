import { cn } from '@/utils/helpers'

/**
 * VikasanaLogo
 * ─────────────
 * Replace LOGO_SRC with your actual logo import when ready.
 *
 * Usage:
 *   <VikasanaLogo />                — icon + wordmark
 *   <VikasanaLogo variant="icon" /> — icon only
 *   <VikasanaLogo variant="full" /> — icon + wordmark + tagline
 */

const LOGO_SRC = null // ← import logo from '@/assets/vikasana-logo.svg'

const VikasanaLogo = ({ variant = 'default', className = '', size = 'md' }) => {
  const sizes = {
    sm: { mark: 'w-8 h-8',  text: 'text-sm',  sub: 'text-[10px]' },
    md: { mark: 'w-9 h-9',  text: 'text-base', sub: 'text-[11px]' },
    lg: { mark: 'w-12 h-12',text: 'text-xl',   sub: 'text-xs'    },
  }
  const s = sizes[size] ?? sizes.md

  const Logomark = () =>
    LOGO_SRC ? (
      <img src={LOGO_SRC} alt="Vikasana Foundation" className={cn('object-contain flex-shrink-0', s.mark)} />
    ) : (
      <div
        className={cn('flex-shrink-0 rounded-xl flex items-center justify-center font-bold tracking-tight border', s.mark)}
        style={{
          background: 'linear-gradient(135deg, var(--brand-700), var(--brand-500))',
          borderColor: 'var(--brand-400)/0.3',
          color: '#ffffff',
          fontSize: size === 'lg' ? '1.25rem' : size === 'sm' ? '0.8rem' : '0.9rem',
        }}
        title="Replace with Vikasana Foundation logo"
      >
        VF
      </div>
    )

  if (variant === 'icon') return <Logomark />

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Logomark />
      <div>
        <p className={cn('font-display font-bold leading-tight', s.text)} style={{ color: 'var(--text-primary)' }}>
          Vikasana Foundation
        </p>
        {variant === 'full' && (
          <p className={cn('leading-tight mt-0.5', s.sub)} style={{ color: 'var(--text-muted)' }}>
            Social Activity Tracker
          </p>
        )}
      </div>
    </div>
  )
}

export default VikasanaLogo
