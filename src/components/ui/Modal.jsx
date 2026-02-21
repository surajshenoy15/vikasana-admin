import { useEffect } from 'react'
import { cn } from '@/utils/helpers'
import Icon from './Icon'

const Modal = ({ open, onClose, title, children, size = 'md', className = '' }) => {
  useEffect(() => {
    if (!open) return
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative z-10 w-full bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl animate-fade-up', sizes[size], className)}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-[var(--text-primary)] font-semibold text-base">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all" aria-label="Close">
            <Icon name="x" size={17} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

export default Modal
