import { Link } from 'react-router-dom'
import VikasanaLogo from '@/components/ui/VikasanaLogo'
import Button from '@/components/ui/Button'

const NotFoundPage = () => (
  <div className="min-h-screen mesh-bg flex flex-col items-center justify-center text-center p-6" style={{ background: 'var(--bg-base)' }}>
    <VikasanaLogo variant="icon" size="lg" className="mb-8" />
    <p className="text-8xl font-display font-bold" style={{ color: 'var(--text-faint)' }}>404</p>
    <h1 className="text-2xl font-display font-bold mb-2 mt-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
    <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/admin"><Button iconRight="arrowRight">Back to Dashboard</Button></Link>
  </div>
)

export default NotFoundPage
