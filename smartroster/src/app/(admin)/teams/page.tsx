import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import TeamForm from './TeamForm'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user!.id).single()
  const { data: teams } = await admin
    .from('teams').select('id, name, profiles(count)').eq('org_id', profile!.org_id).order('name')

  return (
    <div>
      <PageHeader title="Teams" subtitle="Organize employees into teams" action={<TeamForm orgId={profile!.org_id} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams?.map((team: any) => (
          <div key={team.id} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="font-semibold text-slate-900 text-lg">{team.name}</div>
            <div className="text-sm text-slate-500 mt-1">{team.profiles?.[0]?.count ?? 0} employees</div>
          </div>
        ))}
        {!teams?.length && (
          <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            No teams yet. Create your first team.
          </div>
        )}
      </div>
    </div>
  )
}
