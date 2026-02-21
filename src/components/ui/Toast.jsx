import { cn } from '@/utils/helpers'
import Icon from './Icon'

const STYLES = {
  success: { bg: 'bg-[var(--status-active-bg)]  border-[var(--status-active-border)]  text-[var(--status-active-text)]',  icon: 'check' },
  error:   { bg: 'bg-[var(--status-inactive-bg)] border-[var(--status-inactive-border)] text-[var(--status-inactive-text)]', icon: 'x'     },
  info:    { bg: 'bg-[var(--brand-500)]/10 border-[var(--brand-500)]/25 text-[var(--brand-400)]', icon: 'bell' },
}

const Toast = ({ message, type = 'info' }) => {
  const s = STYLES[type] ?? STYLES.info
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md text-sm font-medium shadow-xl animate-fade-up bg-[var(--bg-surface)]', s.bg)}>
      <Icon name={s.icon} size={15} />
      {message}
    </div>
  )
}

export const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => <Toast key={t.id} {...t} />)}
  </div>
)

export default Toast
