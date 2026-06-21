import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import LeaveRequestForm from './LeaveRequestForm'

export default async function MyLeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user!.id).single()
  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Leave</h1>
        <LeaveRequestForm employeeId={user!.id} orgId={profile!.org_id} />
      </div>
      <div className="space-y-3">
        {requests?.map(req => (
          <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-900 capitalize">{req.type}</span>
              <Badge status={req.status} />
            </div>
            <div className="text-sm text-slate-500">{req.start_date} → {req.end_date}</div>
            {req.notes && <div className="text-xs text-slate-400 mt-1">{req.notes}</div>}
          </div>
        ))}
        {!requests?.length && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            No leave requests yet.
          </div>
        )}
      </div>
    </div>
  )
}
