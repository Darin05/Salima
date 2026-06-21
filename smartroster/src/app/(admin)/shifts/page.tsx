import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import ShiftForm from './ShiftForm'

export default async function ShiftsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user!.id).single()
  const { data: shifts } = await supabase.from('shifts').select('*').eq('org_id', profile!.org_id).order('name')

  return (
    <div>
      <PageHeader title="Shifts" subtitle="Define your shift types" action={<ShiftForm orgId={profile!.org_id} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts?.map(shift => (
          <div key={shift.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: shift.color }} />
            <div>
              <div className="font-semibold text-slate-900">{shift.name}</div>
              <div className="text-sm text-slate-500 mt-0.5">{shift.start_time} – {shift.end_time}</div>
            </div>
          </div>
        ))}
        {!shifts?.length && (
          <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            No shifts yet. Create your first shift type.
          </div>
        )}
      </div>
    </div>
  )
}
