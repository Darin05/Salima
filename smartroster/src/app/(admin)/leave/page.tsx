import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AddLeaveForm from './AddLeaveForm'
import RemoveLeaveButton from './RemoveLeaveButton'
import LeaveActions from './LeaveActions'
import Badge from '@/components/ui/Badge'

const typeColor: Record<string, string> = {
  'Paid Leave': 'bg-orange-100 text-orange-700',
  'Casual Leave': 'bg-yellow-100 text-yellow-700',
  'Sick Leave': 'bg-red-100 text-red-700',
  'Eid Holiday': 'bg-purple-100 text-purple-700',
  'National Day': 'bg-blue-100 text-blue-700',
  'Unpaid Leave': 'bg-slate-100 text-slate-600',
  'annual': 'bg-orange-100 text-orange-700',
}

export default async function LeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user!.id).single()
  const orgId = profile!.org_id

  const [{ data: employees }, { data: requests }] = await Promise.all([
    admin.from('profiles').select('id, name').eq('org_id', orgId).eq('role', 'employee').eq('is_active', true).order('name'),
    admin.from('leave_requests').select('*, profiles(name)').eq('org_id', orgId).order('start_date', { ascending: false }),
  ])

  const approved = (requests ?? []).filter((r: any) => r.status === 'approved')
  const pending = (requests ?? []).filter((r: any) => r.status === 'pending')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Leave and Holidays</h1>
        <p className="text-xs text-slate-400 mt-0.5">Add leave directly or approve employee requests. Approved leave blocks the roster automatically.</p>
      </div>

      {/* Add leave form */}
      <AddLeaveForm employees={employees ?? []} orgId={orgId} />

      {/* Saved (approved) leave */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Saved leave</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Agent</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Start</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">End</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {approved.map((req: any) => (
              <tr key={req.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{req.profiles?.name}</td>
                <td className="px-5 py-3 text-slate-600">{req.start_date}</td>
                <td className="px-5 py-3 text-slate-600">{req.end_date}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[req.type] ?? 'bg-slate-100 text-slate-600'}`}>
                    {req.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <RemoveLeaveButton id={req.id} />
                </td>
              </tr>
            ))}
            {!approved.length && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">No approved leave records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pending requests from employees */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-700">Pending employee requests</h2>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Agent</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Dates</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pending.map((req: any) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{req.profiles?.name}</td>
                  <td className="px-5 py-3 text-slate-600">{req.start_date} → {req.end_date}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[req.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right"><LeaveActions id={req.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
