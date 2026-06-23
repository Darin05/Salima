import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function formatTime(t: string) { return t?.slice(0, 5) ?? '' }

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const future = new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0]

  const [{ data: entries }, { data: leaves }, { data: profile }] = await Promise.all([
    admin.from('roster_entries')
      .select('date, shift_id, break_ids, shifts(name, start_time, end_time, color), rosters!inner(status)')
      .eq('employee_id', user.id)
      .eq('rosters.status', 'published')
      .gte('date', today)
      .lte('date', future)
      .order('date'),
    admin.from('leave_requests')
      .select('start_date, end_date, type, status')
      .eq('employee_id', user.id)
      .in('status', ['approved', 'pending'])
      .gte('end_date', today)
      .order('start_date'),
    admin.from('profiles').select('org_id').eq('id', user.id).single(),
  ])

  // Fetch all break rules for the org
  let allBreaks: any[] = []
  if (profile?.org_id) {
    const { data: br } = await admin.from('break_rules').select('*').eq('org_id', profile.org_id).order('break_time')
    allBreaks = br ?? []
  }

  // Build leave date lookup
  const leaveMap = new Map<string, string>()
  for (const lv of leaves ?? []) {
    let d = new Date(lv.start_date + 'T00:00:00')
    const end = new Date(lv.end_date + 'T00:00:00')
    while (d <= end) {
      leaveMap.set(d.toISOString().split('T')[0], lv.type)
      d.setDate(d.getDate() + 1)
    }
  }

  // Group entries by week
  const byWeek: Record<string, any[]> = {}
  for (const entry of entries ?? []) {
    const d = new Date(entry.date + 'T00:00:00')
    const dow = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
    const key = monday.toISOString().split('T')[0]
    if (!byWeek[key]) byWeek[key] = []
    byWeek[key].push(entry)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900 pt-2">My Schedule</h1>

      {Object.entries(byWeek).length > 0 ? (
        Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b)).map(([weekMonday, weekEntries]) => {
          const weekEnd = new Date(weekMonday + 'T00:00:00')
          weekEnd.setDate(weekEnd.getDate() + 6)
          const label = `${new Date(weekMonday + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
          return (
            <div key={weekMonday}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</h2>
              <div className="space-y-2">
                {weekEntries.map((entry: any) => {
                  const shift = entry.shifts as any
                  const lv = leaveMap.get(entry.date)
                  const breakIds: string[] = Array.isArray(entry.break_ids) ? entry.break_ids : []
                  const entryBreaks = allBreaks.filter(b => breakIds.includes(b.id))
                  const isToday = entry.date === today
                  return (
                    <div key={entry.date} className={`bg-white rounded-xl border p-4 ${isToday ? 'border-indigo-300 ring-1 ring-indigo-300' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="text-center w-10 flex-shrink-0">
                          <div className="text-xs text-slate-400">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}</div>
                          <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>{new Date(entry.date + 'T00:00:00').getDate()}</div>
                        </div>
                        {lv ? (
                          <div className="flex-1 bg-orange-50 rounded-lg px-3 py-2">
                            <div className="text-xs font-semibold text-orange-600 uppercase">Leave</div>
                            <div className="text-sm text-orange-700 capitalize">{lv}</div>
                          </div>
                        ) : (
                          <>
                            <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: shift?.color ?? '#6366f1' }} />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 text-sm">{shift?.name}</div>
                              <div className="text-xs text-slate-500">{formatTime(shift?.start_time)} – {formatTime(shift?.end_time)}</div>
                            </div>
                            {entryBreaks.length > 0 && (
                              <div className="text-right">
                                {entryBreaks.map((b, i) => (
                                  <div key={b.id} className="text-xs text-slate-400">☕ {formatTime(b.break_time)}</div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        {isToday && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Today</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      ) : (
        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="text-3xl mb-3">📅</div>
          <div className="font-medium">No upcoming shifts</div>
          <div className="text-sm mt-1">Your schedule will appear here once the roster is published.</div>
        </div>
      )}
    </div>
  )
}
