import { useState } from 'react'
import { STUDENTS } from '@/utils/mockData'
import { StatusBadge, Card, Table, EmptyState, Avatar } from '@/components/ui/index'
import Input from '@/components/ui/Input'
import Icon from '@/components/ui/Icon'
import { pct } from '@/utils/helpers'

const StudentsPage = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = STUDENTS.filter((s) => {
    const matchSearch = [s.name, s.college, s.email, s.faculty].some((v) => v.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'All' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const filterBtn = (label) => (
    <button key={label} onClick={() => setStatusFilter(label)}
      className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border"
      style={statusFilter === label
        ? { background: 'var(--brand-500)/0.1', color: 'var(--brand-400)', borderColor: 'var(--brand-500)/0.3' }
        : { color: 'var(--text-muted)', borderColor: 'transparent' }
      }
    >{label}</button>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Students</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {STUDENTS.length} enrolled · {STUDENTS.filter(s => s.status === 'Active').length} active
          </p>
        </div>
        <div className="flex items-center gap-2">{['All','Active','Inactive'].map(filterBtn)}</div>
      </div>

      <Input icon="search" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <Card>
        {filtered.length === 0
          ? <EmptyState icon="users" title="No students found" description="Adjust the search or filter." />
          : (
            <Table headers={['Student', 'College', 'Faculty Mentor', 'Activities', 'Certificates', 'Status', '']}>
              {filtered.map((s) => {
                const p = pct(s.certificates, s.activities)
                return (
                  <tr key={s.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" />
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{s.college}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{s.faculty}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.activities}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-[100px]">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.certificates}</span>
                        {s.activities > 0 && (
                          <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--border-base)' }}>
                            <div className="h-full rounded-full" style={{ width: `${p}%`, background: 'var(--brand-500)', transition: 'width 0.7s ease' }} />
                          </div>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.activities > 0 ? `${p}%` : '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3.5">
                      <button className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}>
                        <Icon name="eye" size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </Table>
          )
        }
      </Card>
    </div>
  )
}

export default StudentsPage
