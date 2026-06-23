import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LeaveRequestForm from './LeaveRequestForm'

const statusStyle: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const typeColor: Record<string, string> = {
  'annual': 'bg-blue-50 text-blue-700',
  'Paid Leave': 'bg-orange-50 text-orange-700',
  'Sick Leave': 'bg-red-50 text-red-700',
  'sick': 'bg-red-50 text-red-700',
  'emergency': 'bg-red-50 text-red-700',
  'unpaid': 'bg-slate-100 text-slate-600',
  'Casual Leave': 'bg-yellow-50 text-yellow-700',
}

export default async function MyLeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id, name').eq('id', user.id).single()
  const { data: requests } = await admin
    .from('leave_requests')
    .select('*')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })

  const approved = (requests ?? []).filter(r => r.status === 'approved')
  const pending = (requests ?? []).filter(r => r.status === 'pending')
  const rejected = (requests ?? []).filter(r => r.status === 'rejected')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-slate-900">My Leave</h1>
        {profile?.org_id && <LeaveRequestForm employeeId={user.id} orgId={profile.org_id} />}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{approved.length}</div>
          <div className="text-xs text-green-600 mt-0.5">Approved</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">{pending.length}</div>
          <div className="text-xs text-yellow-600 mt-0.5">Pending</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{rejected.length}</div>
          <div className="text-xs text-red-600 mt-0.5">Rejected</div>
        </div>
      </div>

      {/* Request list */}
      <div className="space-y-3">
        {requests?.map(req => (
          <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[req.type] ?? 'bg-slate-100 text-slate-600'}`}>
                  {req.type}
                </span>
                <div className="text-sm text-slate-600 mt-2">
                  {req.start_date} → {req.end_date}
                </div>
                {req.notes && <div className="text-xs text-slate-400 mt-1">{req.notes}</div>}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyle[req.status]}`}>
                {req.status}
              </span>
            </div>
          </div>
        ))}
        {!requests?.length && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="text-3xl mb-3">🏖️</div>
            <div className="font-medium">No leave requests yet</div>
            <div className="text-sm mt-1">Tap "Request Leave" to submit one</div>
          </div>
        )}
      </div>
    </div>
  )
}
