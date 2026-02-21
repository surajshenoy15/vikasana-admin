import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import LoginForm from '@/components/LoginForm'
import ThemeToggle from '@/components/ui/ThemeToggle'

// ── Drop your logo file in src/assets/ and update this import ──────────────
import vikasanaLogo from '@/assets/vikasana-logo.png' // .svg / .jpg also works
// ──────────────────────────────────────────────────────────────────────────

const LoginPage = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen mesh-bg flex flex-col lg:flex-row" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left Panel — Branding ──────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-12 relative overflow-hidden border-r"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-base)' }}
      >
        {/* Ambient glow */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--mesh-1) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--mesh-2) 0%, transparent 70%)' }} />

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* ── Logo — Left panel (full lockup) ─────────────────── */}
        <div className="relative flex items-center gap-3">
          <img
            src={vikasanaLogo}
            alt="Vikasana Foundation"
            className="h-10 w-auto object-contain"
          />
          <div>
            <p className="font-display font-bold text-base leading-tight"
              style={{ color: 'var(--text-primary)' }}>
              
            </p>
            <p className="text-[11px] leading-tight mt-0.5"
              style={{ color: 'var(--text-muted)' }}>
              
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{ background: 'var(--brand-500)/0.08', borderColor: 'var(--brand-500)/0.2', color: 'var(--brand-400)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
              style={{ background: 'var(--brand-400)' }} />
            Admin Control Panel
          </div>

          <h2 className="text-4xl xl:text-[2.75rem] font-display font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}>
            Empowering<br />
            <span className="gradient-text">Social Growth</span><br />
            Through Action
          </h2>

          <p className="text-base leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage faculty, track student activities, and generate achievement
            certificates — all from one unified platform.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Students',     value: '1,200+' },
              { label: 'Colleges',     value: '48'     },
              { label: 'Certificates', value: '3,800+' },
            ].map(({ label, value }) => (
              <div key={label} className="glass rounded-xl p-3.5 text-center">
                <p className="font-bold text-xl font-display"
                  style={{ color: 'var(--text-primary)' }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Vikasana Foundation. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right Panel — Login ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Theme toggle top right */}
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        {/* ── Logo — Mobile only (icon + name stacked) ─────────── */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-3 text-center">
          <img
            src={vikasanaLogo}
            alt="Vikasana Foundation"
            className="h-12 w-auto object-contain"
          />
          <p className="font-display font-bold text-lg leading-tight"
            style={{ color: 'var(--text-primary)' }}>
            Vikasana Foundation
          </p>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold mb-1"
              style={{ color: 'var(--text-primary)' }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sign in to access the admin portal
            </p>
          </div>

          {/* Form card */}
          <div className="glass rounded-2xl p-7 shadow-theme">
            <LoginForm />
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs"
            style={{ color: 'var(--text-muted)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secured with end-to-end encryption · Vikasana Foundation
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage