import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import ShiftForm from './ShiftForm'
import ShiftCard from './ShiftCard'

export default async function ShiftsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user!.id).single()
  const { data: shifts } = await admin.from('shifts').select('*').eq('org_id', profile!.org_id).order('name')

  return (
    <div>
      <PageHeader title="Shifts" subtitle="Define your shift types" action={<ShiftForm orgId={profile!.org_id} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts?.map(shift => (
          <ShiftCard key={shift.id} id={shift.id} name={shift.name} start_time={shift.start_time} end_time={shift.end_time} color={shift.color} />
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
