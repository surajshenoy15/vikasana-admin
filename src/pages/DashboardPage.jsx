import { useOutletContext } from 'react-router-dom'
import { StatCard, ProgressBar, Card, Table, StatusBadge } from '@/components/ui/index'
import { STATS, ACTIVITIES, STUDENTS, ACTIVITY_CATEGORIES } from '@/utils/mockData'
import { formatDate, pct } from '@/utils/helpers'

const DashboardPage = () => {
  const recentActivities = [...ACTIVITIES].sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn)).slice(0, 6)

  const categoryData = ACTIVITY_CATEGORIES.map(({ label, color }) => {
    const count    = ACTIVITIES.filter(a => a.category === label).length
    const approved = ACTIVITIES.filter(a => a.category === label && a.status === 'Approved').length
    return { label, color, count, approved, p: pct(approved, count) }
  })

  // CSS gradient strings for category progress bars
  const barColors = {
    emerald: '#10b981',
    pink:    '#ec4899',
    blue:    'var(--brand-500)',
    amber:   '#f59e0b',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Platform Overview</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Live summary as of today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Students"      value={STATS.totalStudents}    sub={`${STATS.activeStudents} active`}                    icon="users"       accent="brand"   trend={8}  index={0} />
        <StatCard label="Faculty Members"     value={STATS.totalFaculty}     sub={`${STATS.pendingFaculty} pending activation`}         icon="faculty"     accent="gold"              index={1} />
        <StatCard label="Activities Submitted"value={STATS.totalActivities}  sub={`${STATS.approvedActivities} approved`}              icon="activity"    accent="emerald" trend={14} index={2} />
        <StatCard label="Certificates Issued" value={STATS.totalCertificates}sub={`${pct(STATS.totalCertificates, STATS.approvedActivities)}% of approved`} icon="certificate" accent="amber" trend={5} index={3} />
      </div>

      {/* Progress panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Submission Progress by Category">
          <div className="p-5 space-y-4">
            {categoryData.map(({ label, color, count, approved, p }) => (
              <div key={label}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{approved}</span>/{count} approved
                    <span className="ml-2">({p}%)</span>
                  </span>
                </div>
                <ProgressBar value={p} color="" className=""
                  // custom inline bar since we need CSS var colors
                />
                {/* Overriding with inline styled bar for precise theming */}
                <div className="w-full rounded-full h-1.5 overflow-hidden -mt-1.5" style={{ background: 'var(--border-base)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: barColors[color] }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Certificate Progress per Student">
          <div className="p-5 space-y-4">
            {STUDENTS.filter(s => s.activities > 0).map((s) => {
              const p = pct(s.certificates, s.activities)
              return (
                <div key={s.id}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.certificates}</span>/{s.activities}
                      <span className="ml-1">({p}%)</span>
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--border-base)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: 'var(--brand-500)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card title="Recent Submissions">
        <Table headers={['Student', 'Activity', 'Category', 'Submitted', 'Status', 'Certificate']}>
          {recentActivities.map((a) => (
            <tr key={a.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
              <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.student}</td>
              <td className="px-5 py-3.5 text-sm max-w-[180px] truncate" style={{ color: 'var(--text-secondary)' }}>{a.title}</td>
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs border" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)', borderColor: 'var(--border-base)' }}>
                  {a.category}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(a.submittedOn)}</td>
              <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
              <td className="px-5 py-3.5 text-xs" style={{ color: a.certificate ? 'var(--status-active-text)' : 'var(--text-muted)' }}>
                {a.certificate ? '✓ Issued' : '—'}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}

export default DashboardPage
