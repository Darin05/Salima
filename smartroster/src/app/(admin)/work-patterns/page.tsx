import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import WorkPatternForm from './WorkPatternForm'
import WorkPatternCard from './WorkPatternCard'

export default async function WorkPatternsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user!.id).single()
  const { data: patterns } = await admin.from('work_patterns').select('*').eq('org_id', profile!.org_id)

  return (
    <div>
      <PageHeader title="Work Patterns" subtitle="Configure working days and off rules" action={<WorkPatternForm orgId={profile!.org_id} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {patterns?.map(p => (
          <WorkPatternCard key={p.id} id={p.id} name={p.name} working_days={p.working_days} off_type={p.off_type} off_days={p.off_days ?? []} />
        ))}
        {!patterns?.length && (
          <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            No work patterns yet.
          </div>
        )}
      </div>
    </div>
  )
}
