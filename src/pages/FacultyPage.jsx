import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn, formatDate } from '@/utils/helpers'
import { StatusBadge, EmptyState, Avatar } from '@/components/ui/index'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AddFacultyModal from '@/components/AddFacultyModal'

const FacultyPage = () => {
  const { toast } = useOutletContext() ?? {}
  const { authFetch, bootstrapping, isAuthenticated } = useAuth()

  const [facultyList, setFacultyList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchFaculty = async () => {
    try {
      setLoading(true)
      const res = await authFetch('/faculty', { method: 'GET' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 401) toast?.error?.('Session expired. Please login again.')
        else toast?.error?.(data.detail ?? 'Failed to load faculty list')
        return
      }

      // backend returns array
      setFacultyList(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      toast?.error?.('Failed to load faculty list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  if (!bootstrapping && isAuthenticated) {
    fetchFaculty()
  }
}, [bootstrapping, isAuthenticated])

  const filtered = facultyList.filter((f) =>
    [f.full_name, f.college, f.email, f.role].some((v) =>
      (v ?? '').toLowerCase().includes(search.toLowerCase()),
    ),
  )

  const handleAddSuccess = ({ faculty, activation_email_sent }) => {
    setFacultyList((prev) => [faculty, ...prev])

    if (activation_email_sent) {
      toast?.success?.(`${faculty.full_name} added and activation email sent!`)
    } else {
      toast?.info?.(`${faculty.full_name} added. Email not sent (email not configured).`)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      const res = await authFetch(`/faculty/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTimeout(() => {
        setFacultyList((prev) => prev.filter((f) => f.id !== id))
        setDeletingId(null)
        toast?.info?.('Faculty removed.')
      }, 400)
    } catch {
      setDeletingId(null)
      toast?.error?.('Failed to remove faculty.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Faculty Members
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {facultyList.length} registered · {facultyList.filter((f) => !f.is_active).length} pending activation
          </p>
        </div>
        <Button icon="plus" onClick={() => setShowModal(true)}>
          Add Faculty Member
        </Button>
      </div>

      <Input
        icon="search"
        placeholder="Search by name, college, email or role…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Icon name="spinner" size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon="search"
          title="No faculty found"
          description={search ? 'Try adjusting your search terms.' : 'Add your first faculty member.'}
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-3">
          {filtered.map((f) => (
            <div
              key={f.id}
              className={cn(
                'glass glass-hover rounded-2xl p-5 border flex items-center gap-5 transition-all duration-300',
                deletingId === f.id && 'opacity-0 scale-95',
              )}
              style={{ borderColor: 'var(--border-base)', boxShadow: 'var(--shadow-card)' }}
            >
              {f.image_url ? (
                <img src={f.image_url} alt={f.full_name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <Avatar name={f.full_name} size="lg" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {f.full_name}
                  </span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs border"
                    style={{
                      background: 'var(--bg-badge)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-base)',
                    }}
                  >
                    {f.role}
                  </span>
                  <StatusBadge status={f.is_active ? 'Active' : 'Pending'} />
                </div>
                <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {f.college}
                </p>
                <p className="text-xs mt-0.5 truncate flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Icon name="mail" size={11} /> {f.email}
                </p>
              </div>

              <div
                className="hidden lg:block text-right flex-shrink-0 pl-6"
                style={{ borderLeft: '1px solid var(--border-base)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(f.created_at)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Joined
                </p>
              </div>

              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  className="p-2 rounded-xl transition-all"
                  style={{ color: 'var(--text-muted)' }}
                  title="View"
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-review-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Icon name="eye" size={16} />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-2 rounded-xl transition-all"
                  style={{ color: 'var(--text-muted)' }}
                  title="Remove"
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-inactive-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddFacultyModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleAddSuccess}
        toast={toast}
      />
    </div>
  )
}

export default FacultyPage