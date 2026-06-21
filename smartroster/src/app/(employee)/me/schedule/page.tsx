import { createClient } from '@/lib/supabase/server'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get next 28 days of published roster entries
  const from = new Date().toISOString().split('T')[0]
  const to = new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0]

  const { data: entries } = await supabase
    .from('roster_entries')
    .select('date, shifts(name, start_time, end_time, color), rosters!inner(status)')
    .eq('employee_id', user!.id)
    .eq('rosters.status', 'published')
    .gte('date', from)
    .lte('date', to)
    .order('date')

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Schedule</h1>
      <div className="space-y-3">
        {entries?.map((entry: any, i) => {
          const shift = entry.shifts
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="text-center w-12 flex-shrink-0">
                <div className="text-xs text-slate-400">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}</div>
                <div className="text-lg font-bold text-slate-900">{new Date(entry.date + 'T00:00:00').getDate()}</div>
              </div>
              <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: shift?.color }} />
              <div>
                <div className="font-medium text-slate-900">{shift?.name}</div>
                <div className="text-sm text-slate-500">{shift?.start_time} – {shift?.end_time}</div>
              </div>
            </div>
          )
        })}
        {!entries?.length && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            No upcoming shifts scheduled.
          </div>
        )}
      </div>
    </div>
  )
}
