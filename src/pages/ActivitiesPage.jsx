import { useState } from 'react'
import { ACTIVITIES } from '@/utils/mockData'
import { StatusBadge, Card, Table, EmptyState } from '@/components/ui/index'
import Input from '@/components/ui/Input'
import Icon from '@/components/ui/Icon'
import { formatDate } from '@/utils/helpers'

const ActivitiesPage = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const statuses = ['All', 'Approved', 'Pending', 'Under Review']
  const categories = ['All', ...Array.from(new Set(ACTIVITIES.map(a => a.category)))]

  const filtered = ACTIVITIES.filter((a) => {
    const matchSearch = [a.student, a.title, a.category].some(v => v.toLowerCase().includes(search.toLowerCase()))
    return matchSearch && (statusFilter === 'All' || a.status === statusFilter) && (categoryFilter === 'All' || a.category === categoryFilter)
  })

  const countByStatus = (s) => ACTIVITIES.filter(a => a.status === s).length

  const miniCard = (label, value, borderVar) => (
    <div key={label} className="glass rounded-xl p-4 border" style={{ borderColor: `var(${borderVar})` }}>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )

  const pillBtn = (label, active, onClick) => (
    <button key={label} onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
      style={active
        ? { background: 'var(--brand-600)/0.15', color: 'var(--brand-400)', borderColor: 'var(--brand-500)/0.3' }
        : { color: 'var(--text-muted)', borderColor: 'var(--border-base)' }
      }
    >{label}</button>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Activity Submissions</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>All submissions across the platform</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {miniCard('Total', ACTIVITIES.length, '--border-base')}
        {miniCard('Approved', countByStatus('Approved'), '--status-active-border')}
        {miniCard('Pending', countByStatus('Pending'), '--status-pending-border')}
        {miniCard('Under Review', countByStatus('Under Review'), '--status-review-border')}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input icon="search" placeholder="Search submissions…" value={search} onChange={(e) => setSearch(e.target.value)} containerClassName="flex-1" />
        <div className="flex gap-2 flex-wrap">{statuses.map(s => pillBtn(s, statusFilter === s, () => setStatusFilter(s)))}</div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all border"
            style={categoryFilter === c
              ? { background: 'var(--gold-500)/0.12', color: 'var(--gold-500)', borderColor: 'var(--gold-500)/0.3' }
              : { color: 'var(--text-muted)', borderColor: 'var(--border-base)' }
            }
          >{c}</button>
        ))}
      </div>

      <Card>
        {filtered.length === 0
          ? <EmptyState icon="activity" title="No submissions found" description="Adjust your filters." />
          : (
            <Table headers={['Student', 'Activity', 'Category', 'Submitted', 'Status', 'Certificate', '']}>
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.student}</td>
                  <td className="px-5 py-3.5 text-sm max-w-[180px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="truncate block">{a.title}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs border" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)', borderColor: 'var(--border-base)' }}>
                      {a.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(a.submittedOn)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: a.certificate ? 'var(--status-active-text)' : 'var(--text-muted)' }}>
                    {a.certificate ? <span className="flex items-center gap-1"><Icon name="check" size={12} /> Issued</span> : 'Not yet'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}>
                        <Icon name="eye" size={14} />
                      </button>
                      {a.status === 'Pending' && (
                        <button className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}>
                          <Icon name="check" size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )
        }
      </Card>
    </div>
  )
}

export default ActivitiesPage
