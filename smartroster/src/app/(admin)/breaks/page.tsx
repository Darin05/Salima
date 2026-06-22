import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import BreakForm from './BreakForm'
import BreakCard from './BreakCard'

export default async function BreaksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user!.id).single()
  const { data: breaks } = await admin.from('break_rules').select('*').eq('org_id', profile!.org_id).order('break_time')

  return (
    <div>
      <PageHeader title="Break Rules" subtitle="Set break times and capacity" action={<BreakForm orgId={profile!.org_id} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {breaks?.map(b => (
          <BreakCard key={b.id} id={b.id} name={b.name} break_time={b.break_time} max_concurrent={b.max_concurrent} />
        ))}
        {!breaks?.length && (
          <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            No break rules yet.
          </div>
        )}
      </div>
    </div>
  )
}
