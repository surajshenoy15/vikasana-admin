import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/helpers'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const LoginForm = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }))
    if (apiError) setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setApiError('')
    const result = await login(form)
    setLoading(false)
    if (result.success) navigate('/admin', { replace: true })
    else setApiError(result.message ?? 'Login failed. Please try again.')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input
        label="Email Address"
        icon="mail"
        type="email"
        placeholder="admin@vikasanafoundation.org"
        value={form.email}
        onChange={handleChange('email')}
        error={errors.email}
        autoComplete="email"
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)] tracking-wide">Password</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-[var(--text-muted)] pointer-events-none">
            <Icon name="shield" size={16} />
          </span>
          <input
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange('password')}
            placeholder="Enter your password"
            autoComplete="current-password"
            className={cn(
              'w-full rounded-xl bg-[var(--bg-input)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm transition-all duration-200',
              'focus:outline-none focus:ring-1 pl-10 pr-10 py-3',
              errors.password
                ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20'
                : 'border-[var(--border-input)] focus:border-[var(--brand-500)] focus:ring-[var(--brand-500)]/20',
            )}
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute inset-y-0 right-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <Icon name={showPwd ? 'x' : 'eye'} size={16} />
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <Icon name="x" size={12} /> {errors.password}
          </p>
        )}
      </div>

      {apiError && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-sm">
          <Icon name="x" size={15} className="flex-shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full mt-1"
        iconRight={!loading ? 'arrowRight' : undefined}
      >
        {loading ? 'Authenticating…' : 'Sign In to Portal'}
      </Button>
    </form>
  )
}

export default LoginForm