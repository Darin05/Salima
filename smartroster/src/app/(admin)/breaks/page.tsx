import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import BreakForm from './BreakForm'

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
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-2xl mb-3">☕</div>
            <div className="font-semibold text-slate-900">{b.name}</div>
            <div className="text-sm text-slate-500 mt-1">{b.break_time}</div>
            <div className="text-xs text-slate-400 mt-1">Max {b.max_concurrent} at once</div>
          </div>
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
