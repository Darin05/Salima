import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import EmployeeActions from './EmployeeActions'
import AddEmployeeButton from './AddEmployeeButton'

export default async function EmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) return null

  const { data: employees } = await supabase
    .from('profiles')
    .select('id, name, email, employee_number, is_active, teams(name)')
    .eq('org_id', profile.org_id)
    .eq('role', 'employee')
    .order('name')

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
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees?.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">{emp.name}</div>
                  <div className="text-xs text-slate-400">{emp.email}</div>
                </td>
                <td className="px-5 py-4 text-slate-500">{emp.employee_number ?? '—'}</td>
                <td className="px-5 py-4 text-slate-500">{(emp.teams as any)?.name ?? '—'}</td>
                <td className="px-5 py-4">
                  <Badge status={emp.is_active ? 'active' : 'inactive'} />
                </td>
                <td className="px-5 py-4 text-right">
                  <EmployeeActions id={emp.id} isActive={emp.is_active} />
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
