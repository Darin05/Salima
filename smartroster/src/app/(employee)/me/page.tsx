import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LogoutButton from './LogoutButton'
import { computeBreakTime } from '@/lib/breakTime'

function formatTime(t: string) { return t?.slice(0, 5) ?? '' }

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })

  const monday = (() => {
    const d = new Date(today + 'T00:00:00'); const day = d.getDay()
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); return d.toISOString().split('T')[0]
  })()
  const sunday = (() => {
    const d = new Date(monday + 'T00:00:00'); d.setDate(d.getDate() + 6); return d.toISOString().split('T')[0]
  })()

  const [{ data: profile }, { data: entry }, { data: leaveToday }, { data: weekEntries }] = await Promise.all([
    admin.from('profiles').select('name, org_id, shift_id, shifts(name, start_time, end_time, color)').eq('id', user.id).single(),
    admin.from('roster_entries').select('*, shifts(name, start_time, end_time, color), break_ids, break_slot').eq('employee_id', user.id).eq('date', today).maybeSingle(),
    admin.from('leave_requests').select('type').eq('employee_id', user.id).eq('status', 'approved').lte('start_date', today).gte('end_date', today).maybeSingle(),
    admin.from('roster_entries').select('date').eq('employee_id', user.id).gte('date', monday).lte('date', sunday),
  ])

  const workingDaysThisWeek = (weekEntries ?? []).length

  // Fetch breaks if on roster
  let breaks: any[] = []
  if (entry?.break_ids?.length && profile?.org_id) {
    const { data: br } = await admin.from('break_rules').select('*').in('id', entry.break_ids).order('offset_minutes')
    breaks = br ?? []
  }

  const shift = (entry?.shifts ?? (profile as any)?.shifts) as any
  const profileName = profile?.name ?? ''
  const firstName = profileName.split(' ')[0]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initials(profileName)}
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400">{todayLabel}</p>
          <h1 className="text-xl font-bold text-slate-900">Hi, {firstName} 👋</h1>
        </div>
        <LogoutButton />
      </div>

      {/* Today's status */}
      {leaveToday ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">On Leave Today</div>
          <div className="text-lg font-bold text-orange-800 capitalize">{leaveToday.type}</div>
          <div className="text-sm text-orange-600 mt-1">Enjoy your time off 🌴</div>
        </div>
      ) : shift ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Today's Shift</p>
            <div className="flex items-center gap-4">
              <div className="w-4 h-14 rounded-full flex-shrink-0" style={{ backgroundColor: shift.color }} />
              <div>
                <div className="text-xl font-bold text-slate-900">{shift.name}</div>
                <div className="text-slate-500 text-sm mt-0.5">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</div>
              </div>
            </div>
          </div>
          {breaks.length > 0 && (
            <div className="px-5 py-4 bg-slate-50">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Breaks Today</p>
              <div className="space-y-2">
                {breaks.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <span className="text-base">☕</span>
                    <div>
                      <div className="text-sm font-medium text-slate-700">Break {i + 1} — {computeBreakTime(shift.start_time, shift.end_time, b.offset_from ?? 'start', b.offset_minutes ?? 120, (entry?.break_slot ?? 0) * 15)}</div>
                      <div className="text-xs text-slate-400">{b.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="text-3xl mb-3">🎉</div>
          <div className="font-semibold text-slate-700">No shift today</div>
          <div className="text-sm text-slate-400 mt-1">Enjoy your day off</div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-400 font-medium uppercase">This week</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{workingDaysThisWeek}</div>
          <div className="text-xs text-slate-400 mt-0.5">Working days</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-400 font-medium uppercase">Shifts</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{shift?.name?.slice(0, 6) ?? '—'}</div>
          <div className="text-xs text-slate-400 mt-0.5">Assigned shift</div>
        </div>
      </div>
    </div>
  )
}
