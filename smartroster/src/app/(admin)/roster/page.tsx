import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import RosterActions from './RosterActions'
import GenerateRoster from './GenerateRoster'
import Link from 'next/link'

export default async function RosterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user!.id).single()
  const { data: rosters } = await supabase
    .from('rosters').select('*').eq('org_id', profile!.org_id).order('week_start', { ascending: false })

  return (
    <div>
      <PageHeader title="Roster" subtitle="Generate and publish weekly rosters" action={<GenerateRoster orgId={profile!.org_id} />} />
      <div className="space-y-3">
        {rosters?.map(roster => (
          <div key={roster.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Week of {roster.week_start}</div>
              <div className="text-sm text-slate-400 mt-0.5">Created {new Date(roster.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-4">
              <Badge status={roster.status} />
              <Link href={`/roster/${roster.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View →
              </Link>
              <RosterActions id={roster.id} status={roster.status} />
            </div>
          </div>
        ))}
        {!rosters?.length && (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
            No rosters yet. Generate your first roster above.
          </div>
        )}
      </div>
    </div>
  )
}
