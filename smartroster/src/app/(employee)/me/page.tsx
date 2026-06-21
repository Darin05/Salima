import { createClient } from '@/lib/supabase/server'

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single()

  const today = new Date().toISOString().split('T')[0]
  const { data: entry } = await supabase
    .from('roster_entries')
    .select('*, shifts(name, start_time, end_time, color), rosters(status)')
    .eq('employee_id', user!.id)
    .eq('date', today)
    .eq('rosters.status', 'published')
    .maybeSingle()

  const shift = entry?.shifts as any

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Hi, {profile?.name?.split(' ')[0]} 👋</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Today's Shift</p>
        {shift ? (
          <div className="flex items-center gap-4">
            <div className="w-4 h-14 rounded-full" style={{ backgroundColor: shift.color }} />
            <div>
              <div className="text-xl font-bold text-slate-900">{shift.name}</div>
              <div className="text-slate-500 mt-1">{shift.start_time} – {shift.end_time}</div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 py-4 text-center">No shift scheduled today 🎉</div>
        )}
      </div>
    </div>
  )
}
