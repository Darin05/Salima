import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import EmployeeActions from './EmployeeActions'
import AddEmployeeButton from './AddEmployeeButton'
import EditEmployeeButton from './EditEmployeeButton'

export default async function EmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) return null

  const [{ data: employees }, { data: teams }, { data: shifts }, { data: workPatterns }] = await Promise.all([
    admin.from('profiles').select('id, name, email, employee_number, is_active, team_id, shift_id, work_pattern_id, teams(name), shifts(name), work_patterns(name, working_days, off_type)').eq('org_id', profile.org_id).eq('role', 'employee').order('name'),
    admin.from('teams').select('id, name').eq('org_id', profile.org_id).order('name'),
    admin.from('shifts').select('id, name, color').eq('org_id', profile.org_id).order('name'),
    admin.from('work_patterns').select('id, name, working_days, off_type').eq('org_id', profile.org_id).order('name'),
  ])

  return (
    <div>
      <PageHeader title="Employees" subtitle={`${employees?.length ?? 0} total`} action={<AddEmployeeButton orgId={profile.org_id} />} />
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">ID</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Team</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Shift</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Work Pattern</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees?.map((emp: any) => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">{emp.name}</div>
                  <div className="text-xs text-slate-400">{emp.email}</div>
                </td>
                <td className="px-5 py-4 text-slate-500">{emp.employee_number ?? '—'}</td>
                <td className="px-5 py-4 text-slate-500">{emp.teams?.name ?? '—'}</td>
                <td className="px-5 py-4 text-slate-500">{emp.shifts?.name ?? '—'}</td>
                <td className="px-5 py-4">
                  {emp.work_patterns ? (
                    <div>
                      <div className="text-slate-800 font-medium text-xs">{emp.work_patterns.name}</div>
                      <div className="text-xs text-slate-400">{emp.work_patterns.working_days}d · {emp.work_patterns.off_type === 'rotating_weekly' ? 'rotating' : 'fixed'}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">— None</span>
                  )}
                </td>
                <td className="px-5 py-4"><Badge status={emp.is_active ? 'active' : 'inactive'} /></td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <EditEmployeeButton
                      employee={{ id: emp.id, name: emp.name, team_id: emp.team_id, shift_id: emp.shift_id, work_pattern_id: emp.work_pattern_id }}
                      teams={teams ?? []}
                      shifts={shifts ?? []}
                      workPatterns={workPatterns ?? []}
                    />
                    <EmployeeActions id={emp.id} isActive={emp.is_active} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!employees?.length && (
          <div className="text-center py-16 text-slate-400">No employees yet. Add your first one.</div>
        )}
      </div>
    </div>
  )
}
