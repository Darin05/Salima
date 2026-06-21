import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'

async function getKPIs(orgId: string) {
  const supabase = await createClient()
  const [employees, shifts, leave, rosters] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_active', true),
    supabase.from('shifts').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'pending'),
    supabase.from('rosters').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'published'),
  ])
  return {
    employees: employees.count ?? 0,
    shifts: shifts.count ?? 0,
    pendingLeave: leave.count ?? 0,
    publishedRosters: rosters.count ?? 0,
  }
}

const kpiCards = [
  { key: 'employees', label: 'Active Employees', icon: '👥', color: 'bg-indigo-50 text-indigo-600' },
  { key: 'shifts', label: 'Shift Types', icon: '🕐', color: 'bg-blue-50 text-blue-600' },
  { key: 'pendingLeave', label: 'Pending Leave', icon: '🏖️', color: 'bg-yellow-50 text-yellow-600' },
  { key: 'publishedRosters', label: 'Published Rosters', icon: '📅', color: 'bg-green-50 text-green-600' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id, name').eq('id', user.id).single()
  if (!profile) return null
  const kpis = await getKPIs(profile.org_id)

  return (
    <div>
      <PageHeader
        title={`Good morning 👋`}
        subtitle="Here's what's happening with your team today."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ key, label, icon, color }) => (
          <div key={key} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl ${color} mb-4`}>
              {icon}
            </div>
            <div className="text-3xl font-bold text-slate-900">{kpis[key as keyof typeof kpis]}</div>
            <div className="text-sm text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
