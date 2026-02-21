import { useState } from 'react'
import { CERTIFICATES, STUDENTS } from '@/utils/mockData'
import { Card, EmptyState } from '@/components/ui/index'
import Input from '@/components/ui/Input'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { formatDate, pct } from '@/utils/helpers'

const CertificatesPage = () => {
  const [search, setSearch] = useState('')

  const filtered = CERTIFICATES.filter(c =>
    [c.student, c.title, c.category].some(v => v.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Certificates</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{CERTIFICATES.length} certificates issued</p>
        </div>
        <Button icon="download" variant="secondary">Export All</Button>
      </div>

      <Card title="Per-Student Progress">
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STUDENTS.map((s) => {
            const p = pct(s.certificates, s.activities)
            return (
              <div key={s.id} className="glass glass-hover rounded-xl p-4 border" style={{ borderColor: 'var(--border-base)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.college}</p>
                  </div>
                  <span className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                    {p}<span className="text-base font-normal" style={{ color: 'var(--text-muted)' }}>%</span>
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--border-base)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${p}%`, background: p === 100 ? 'var(--status-active-text)' : 'var(--brand-500)' }} />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {s.certificates} of {s.activities} certified
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Issued Certificates</h3>
          <Input icon="search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} containerClassName="w-56" />
        </div>
        {filtered.length === 0
          ? <EmptyState icon="certificate" title="No certificates found" />
          : (
            <div className="grid gap-3">
              {filtered.map((c) => (
                <div key={c.id} className="glass glass-hover rounded-2xl p-4 border flex items-center gap-4" style={{ borderColor: 'var(--border-base)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--gold-500)/0.10', border: '1px solid var(--gold-500)/0.22', color: 'var(--gold-500)' }}>
                    <Icon name="certificate" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.student} · {c.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(c.submittedOn)}</p>
                    <p className="text-xs font-medium mt-0.5 flex items-center gap-1 justify-end" style={{ color: 'var(--status-active-text)' }}>
                      <Icon name="check" size={11} /> Issued
                    </p>
                  </div>
                  <button className="p-2 rounded-xl transition-all flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    <Icon name="download" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

export default CertificatesPage
