import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Icon from '@/components/ui/Icon'
import { FACULTY_ROLES } from '@/utils/mockData'
import { useAuth } from '@/context/AuthContext'

const INITIAL = { name: '', college: '', email: '', role: 'Faculty' }

const AddFacultyModal = ({ open, onClose, onSuccess, toast }) => {
  const { authFetch } = useAuth()

  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setForm(INITIAL)
      setErrors({})
      setSent(false)
      setPhotoFile(null)
      setPhotoPreview('')
    }, 300)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.college.trim()) e.college = 'College is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    return e
  }

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }))
  }

  const handlePickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((er) => ({ ...er, photo: 'Please upload an image file.' }))
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrors((er) => ({ ...er, photo: 'Image must be under 3 MB.' }))
      return
    }

    setErrors((er) => ({ ...er, photo: '' }))
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('full_name', form.name)
      fd.append('college', form.college)
      fd.append('email', form.email)

      // backend expects lower-case role like "faculty"
      const role = (form.role || 'Faculty').toLowerCase()
      fd.append('role', role === 'faculty' ? 'faculty' : role)

      if (photoFile) fd.append('image', photoFile)

      const res = await authFetch('/faculty', {
        method: 'POST',
        body: fd,
        // don't set Content-Type manually for FormData
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErrors((er) => ({ ...er, api: data.detail ?? 'Failed to add faculty. Please try again.' }))
        setLoading(false)
        return
      }

      setSent(true)

      // Backend response: { faculty: {...}, activation_email_sent: bool, message: str }
      const faculty = data.faculty
      const activation_email_sent = !!data.activation_email_sent

      onSuccess?.({ faculty, activation_email_sent })

      setLoading(false)
    } catch {
      setErrors((er) => ({ ...er, api: 'Cannot reach server. Please try again.' }))
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={sent ? 'Invitation Sent' : 'Add New Faculty Member'}>
      {!sent ? (
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Faculty Profile Pic</label>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[var(--border-input)] bg-[var(--bg-input)] flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Faculty" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="users" size={22} className="text-[var(--text-muted)]" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex">
                  <input type="file" accept="image/*" onChange={handlePickPhoto} className="hidden" />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer border border-[var(--border-input)] bg-[var(--bg-input)] text-[var(--text-primary)] hover:opacity-90 transition">
                    <Icon name="upload" size={15} />
                    {photoFile ? 'Change' : 'Upload'}
                  </span>
                </label>

                {photoFile && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-red-500/30 text-red-400 hover:opacity-90 transition"
                  >
                    <Icon name="x" size={14} />
                    Remove
                  </button>
                )}
              </div>
            </div>

            {errors.photo && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <Icon name="x" size={12} /> {errors.photo}
              </p>
            )}
          </div>

          <Input label="Full Name" icon="users" placeholder="Dr. Jane Doe" value={form.name} onChange={set('name')} error={errors.name} />
          <Input label="College / Institution" icon="faculty" placeholder="IIT Bombay" value={form.college} onChange={set('college')} error={errors.college} />
          <Input label="Official Email" icon="mail" type="email" placeholder="jane@institution.ac.in" value={form.email} onChange={set('email')} error={errors.email} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Role</label>
            <select
              value={form.role}
              onChange={set('role')}
              className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm px-4 py-3 focus:outline-none focus:border-[var(--brand-500)] transition-all"
            >
              {FACULTY_ROLES.map((r) => (
                <option key={r} value={r} style={{ background: 'var(--bg-surface)' }}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border text-sm" style={{ background: 'var(--brand-500)/0.08', borderColor: 'var(--brand-500)/0.2', color: 'var(--brand-400)' }}>
            <Icon name="mail" size={14} className="flex-shrink-0 mt-0.5" />
            <span className="text-[var(--text-secondary)] text-xs">
              An activation email will be attempted for <strong className="text-[var(--text-primary)]">{form.email || 'the provided address'}</strong>.
            </span>
          </div>

          {errors.api && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-sm">
              <Icon name="x" size={15} className="flex-shrink-0 mt-0.5" />
              <span>{errors.api}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} icon={!loading ? 'mail' : undefined} className="flex-1">
              {loading ? 'Sending…' : 'Add & Send Invite'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-[var(--status-active-text)]" style={{ background: 'var(--status-active-bg)', border: '1px solid var(--status-active-border)' }}>
            <Icon name="check" size={30} strokeWidth={2} />
          </div>
          <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-1 text-display">Faculty Added!</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-1">
            <span className="text-[var(--text-primary)] font-medium">{form.name}</span> added as{' '}
            <span className="text-[var(--text-primary)] font-medium">{form.role}</span>.
          </p>
          <p className="text-[var(--text-muted)] text-xs mb-6">
            Check the faculty list for activation status.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setSent(false)
                setForm(INITIAL)
                setPhotoFile(null)
                setPhotoPreview('')
              }}
            >
              Add Another
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AddFacultyModal