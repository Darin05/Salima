import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import LeaveActions from './LeaveActions'

export default async function LeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user!.id).single()
  const { data: requests } = await admin
    .from('leave_requests')
    .select('*, profiles(name, email)')
    .eq('org_id', profile!.org_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="Manage team leave" />
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Employee</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Dates</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests?.map((req: any) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">{req.profiles?.name}</div>
                  <div className="text-xs text-slate-400">{req.profiles?.email}</div>
                </td>
                <td className="px-5 py-4 text-slate-600 capitalize">{req.type}</td>
                <td className="px-5 py-4 text-slate-600">{req.start_date} → {req.end_date}</td>
                <td className="px-5 py-4"><Badge status={req.status} /></td>
                <td className="px-5 py-4 text-right">
                  {req.status === 'pending' && <LeaveActions id={req.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!requests?.length && (
          <div className="text-center py-16 text-slate-400">No leave requests yet.</div>
        )}
      </div>
    </div>
  )
}
