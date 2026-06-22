import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import WorkPatternForm from './WorkPatternForm'

const offTypeLabel: Record<string, string> = {
  fixed: 'Fixed Weekly Off',
  rotating_weekly: 'Rotating Off (Weekly)',
  rotating_monthly: 'Rotating Off (Monthly)',
}

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
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="font-semibold text-slate-900 text-lg mb-2">{p.name}</div>
            <div className="text-sm text-slate-600">📅 {p.working_days} working days/week</div>
            <div className="text-sm text-slate-500 mt-1">{offTypeLabel[p.off_type]}</div>
            {p.off_days?.length > 0 && (
              <div className="text-xs text-slate-400 mt-1">Off: {(p.off_days as string[]).join(', ')}</div>
            )}
          </div>
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
