import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import WeekNav from './WeekNav'
import EditEntryButton from './EditEntryButton'
import { computeBreakTime } from '@/lib/breakTime'

function toMonday(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getAllDays(start: string, end: string): string[] {
  const days: string[] = []
  const d = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (d <= last) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1) }
  return days
}

function getWeeksInRange(days: string[]): string[][] {
  const groups = new Map<string, string[]>()
  for (const d of days) {
    const date = new Date(d + 'T00:00:00')
    const dow = date.getDay()
    const mon = new Date(date)
    mon.setDate(date.getDate() + (dow === 0 ? -6 : 1 - dow))
    const key = mon.toISOString().split('T')[0]
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(d)
  }
  return [...groups.values()]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xfffff
  return colors[h % colors.length]
}

function formatDay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(t: string) { return t?.slice(0, 5) ?? '' }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ week?: string; view?: string }> }) {
  const { week, view } = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const monday = week ? toMonday(week) : toMonday(today)
  const isMonthView = view === 'month'

  // Compute date range
  let rangeStart: string, rangeEnd: string
  if (isMonthView) {
    const d = new Date(monday + 'T00:00:00')
    // Use mid-week (Thursday) to determine the "month" of this week
    const thu = new Date(monday + 'T00:00:00'); thu.setDate(thu.getDate() + 3)
    const yr = thu.getFullYear(), mo = thu.getMonth()
    rangeStart = `${yr}-${String(mo + 1).padStart(2, '0')}-01`
    rangeEnd = new Date(yr, mo + 1, 0).toISOString().split('T')[0]
  } else {
    rangeStart = monday
    rangeEnd = addDays(monday, 6)
  }

  const displayDates = getAllDays(rangeStart, rangeEnd)
  const weekGroups = isMonthView ? getWeeksInRange(displayDates) : [displayDates]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id, name').eq('id', user.id).single()
  if (!profile) return null
  const orgId = profile.org_id

  const [
    { data: employees },
    { data: shifts },
    { data: breaks },
    { data: leaves },
    { data: rosterEntries },
    { data: rosters },
    { count: pendingLeave },
  ] = await Promise.all([
    admin.from('profiles').select('id, name, shift_id, team_id, shifts(name, start_time, end_time, color), teams(name)').eq('org_id', orgId).eq('is_active', true).eq('role', 'employee').order('name'),
    admin.from('shifts').select('*').eq('org_id', orgId),
    admin.from('break_rules').select('*').eq('org_id', orgId).order('offset_minutes'),
    admin.from('leave_requests').select('employee_id, start_date, end_date, type, status').eq('org_id', orgId).in('status', ['approved', 'pending']).lte('start_date', rangeEnd).gte('end_date', rangeStart),
    admin.from('roster_entries').select('id, employee_id, date, shift_id, break_slot, roster_id, shifts(name, start_time, end_time, color), rosters!inner(status, org_id)')
      .eq('rosters.org_id', orgId)
      .gte('date', rangeStart).lte('date', rangeEnd),
    admin.from('rosters').select('id, week_start, status').eq('org_id', orgId).gte('week_start', rangeStart).lte('week_start', rangeEnd),
    admin.from('leave_requests').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'pending'),
  ])

  const approvedLeaves = (leaves ?? []).filter((l: any) => l.status === 'approved')
  const leaveMap = new Map<string, string>()
  for (const lv of approvedLeaves) {
    let d = new Date((lv.start_date as string) + 'T00:00:00')
    const end = new Date((lv.end_date as string) + 'T00:00:00')
    while (d <= end) {
      leaveMap.set(`${lv.employee_id}|${d.toISOString().split('T')[0]}`, lv.type)
      d.setDate(d.getDate() + 1)
    }
  }

  const entryMap = new Map<string, any>()
  for (const e of rosterEntries ?? []) entryMap.set(`${e.employee_id}|${e.date}`, e)
  const hasRoster = (rosterEntries ?? []).length > 0

  // Build a date → roster_id map so we can link edits to the right roster
  const rosterByDate = new Map<string, string>() // date → roster_id
  for (const e of rosterEntries ?? []) {
    if (e.roster_id && !rosterByDate.has(e.date)) rosterByDate.set(e.date, e.roster_id)
  }
  // Fallback: try from rosters list (use first roster's id for the whole range)
  const fallbackRosterId = (rosters ?? [])[0]?.id ?? null

  const empList = (employees ?? []) as any[]
  const totalEmployees = empList.length
  const shiftList = (shifts ?? []) as any[]

  const maxConcurrent = Math.min(...(breaks ?? []).map((b: any) => b.max_concurrent ?? 2).filter((n: number) => n > 0)) || 2
  const empBreakSlotFallback = new Map<string, number>()
  const byShift = new Map<string, any[]>()
  for (const emp of empList) {
    if (!emp.shift_id) continue
    if (!byShift.has(emp.shift_id)) byShift.set(emp.shift_id, [])
    byShift.get(emp.shift_id)!.push(emp)
  }
  for (const group of byShift.values()) {
    group.sort((a: any, b: any) => a.name.localeCompare(b.name))
    group.forEach((emp: any, i: number) => empBreakSlotFallback.set(emp.id, Math.floor(i / maxConcurrent)))
  }

  const coverage = displayDates.map(date => {
    let working = 0, onLeave = 0, off = 0
    for (const emp of empList) {
      const lv = leaveMap.get(`${emp.id}|${date}`)
      if (lv) { onLeave++; continue }
      if (hasRoster) {
        if (entryMap.has(`${emp.id}|${date}`)) working++
        else off++
      } else {
        if (emp.shift_id) working++
        else off++
      }
    }
    return { date, working, onLeave, off }
  })

  const weekDates = getAllDays(monday, addDays(monday, 6))
  const todayCoverage = coverage.find(c => c.date === today) ?? coverage.find(c => c.date >= today) ?? coverage[0]
  const undercoveredDays = coverage.filter(c => c.working < Math.ceil(totalEmployees * 0.7)).length
  const leaveThisWeek = new Set(approvedLeaves.map((l: any) => l.employee_id)).size

  function RosterCell({ emp, date }: { emp: any; date: string }) {
    const lvType = leaveMap.get(`${emp.id}|${date}`)
    const entry = entryMap.get(`${emp.id}|${date}`)
    const defaultShift = emp.shifts as any
    const rosterId = rosterByDate.get(date) ?? fallbackRosterId

    if (lvType) {
      return (
        <div className="rounded-lg bg-orange-50 border border-orange-100 p-2">
          <div className="font-semibold text-orange-700 uppercase text-xs">LEAVE</div>
          <div className="text-orange-500 text-xs capitalize mt-0.5">{lvType}</div>
          <EditEntryButton
            employeeId={emp.id} employeeName={emp.name} date={date}
            entryId={entry?.id ?? null} currentStatus="leave"
            currentShiftId={entry?.shift_id ?? emp.shift_id}
            shifts={shiftList} rosterId={rosterId}
          />
        </div>
      )
    }

    if (hasRoster && !entry) {
      return (
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
          <div className="text-slate-400 text-xs font-medium">Day Off</div>
          <EditEntryButton
            employeeId={emp.id} employeeName={emp.name} date={date}
            entryId={null} currentStatus="off"
            currentShiftId={emp.shift_id}
            shifts={shiftList} rosterId={rosterId}
          />
        </div>
      )
    }

    const shift = (entry?.shifts ?? defaultShift) as any
    if (!shift) {
      return (
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
          <div className="text-slate-400 text-xs">No shift</div>
        </div>
      )
    }

    const breakSlot = entry?.break_slot ?? empBreakSlotFallback.get(emp.id) ?? 0
    return (
      <div className="rounded-lg bg-green-50 border border-green-100 p-2">
        <div className="font-semibold text-green-800 uppercase text-xs">WORK</div>
        <div className="text-green-700 text-xs mt-0.5">{shift.name} · {formatTime(shift.start_time)}–{formatTime(shift.end_time)}</div>
        {(breaks as any[])?.map((b: any, i: number) => (
          <div key={b.id} className="text-green-600 text-xs mt-0.5">
            B{i+1} {computeBreakTime(shift.start_time, shift.end_time, b.offset_from ?? 'start', b.offset_minutes ?? 120, breakSlot * 15)}
          </div>
        ))}
        <EditEntryButton
          employeeId={emp.id} employeeName={emp.name} date={date}
          entryId={entry?.id ?? null} currentStatus="work"
          currentShiftId={entry?.shift_id ?? emp.shift_id}
          shifts={shiftList} rosterId={rosterId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {hasRoster ? 'Showing actual generated roster.' : 'No roster generated — showing estimated coverage from shifts.'}
          </p>
        </div>
        <WeekNav monday={monday} view={view ?? 'week'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Active agents</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{totalEmployees}</div>
          <div className="text-xs text-slate-400 mt-1">Friday fixed off for all</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total coverage</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{coverage.reduce((s, c) => s + c.working, 0)}</div>
          <div className="text-xs text-slate-400 mt-1">{isMonthView ? 'This month' : 'This week'} · {hasRoster ? 'From roster' : 'Estimated'}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Under-covered days</div>
          <div className={`text-3xl font-bold mt-1 ${undercoveredDays > 0 ? 'text-red-600' : 'text-slate-900'}`}>{undercoveredDays}</div>
          <div className="text-xs text-slate-400 mt-1">Below 70% headcount</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">On leave</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{leaveThisWeek}</div>
          <div className="text-xs text-slate-400 mt-1">Employees affected</div>
        </div>
      </div>

      {todayCoverage && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Daily overview · {new Date(todayCoverage.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {shiftList.slice(0, 2).map((sh: any, i: number) => {
              const count = empList.filter(e => {
                if (leaveMap.has(`${e.id}|${todayCoverage.date}`)) return false
                if (hasRoster) return entryMap.get(`${e.id}|${todayCoverage.date}`)?.shift_id === sh.id
                return e.shift_id === sh.id
              }).length
              return (
                <div key={sh.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">{sh.name}</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{count}</div>
                  <div className="text-xs text-slate-400">{i === 0 ? 'Primary coverage' : 'Secondary coverage'}</div>
                </div>
              )
            })}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 font-medium">On leave</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{todayCoverage.onLeave}</div>
              <div className="text-xs text-slate-400">Unavailable today</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 font-medium">{hasRoster ? 'Day off (roster)' : 'No shift'}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{todayCoverage.off}</div>
              <div className="text-xs text-slate-400">{hasRoster ? 'Per generated roster' : 'Missing shift setup'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Coverage snapshot (week view only) */}
      {!isMonthView && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Week coverage · {formatDay(monday)} – {formatDay(addDays(monday, 6))}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {coverage.map(({ date, working, onLeave, off }) => {
              const isToday = date === today
              return (
                <div key={date} className={`rounded-lg p-3 border ${isToday ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
                  <div className={`text-xs font-medium ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${working < Math.ceil(totalEmployees * 0.7) ? 'text-red-600' : 'text-slate-900'}`}>{working}</div>
                  <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                    <div>Working {working}</div>
                    {onLeave > 0 && <div>Leave {onLeave}</div>}
                    {off > 0 && <div>Off {off}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Roster table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">
            {isMonthView
              ? `Monthly roster · ${new Date(rangeStart + 'T00:00:00').toLocaleDateString('en', { month: 'long', year: 'numeric' })}`
              : `Weekly roster · ${formatDay(monday)} – ${formatDay(addDays(monday, 6))}`}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {hasRoster ? 'Actual generated roster. Use Edit to adjust individual days.' : 'No roster generated — estimated from shift assignments.'}
          </p>
        </div>

        {isMonthView ? (
          /* Month view: weeks stacked vertically */
          <div className="overflow-x-auto">
            {weekGroups.map((weekDays, wi) => {
              const weekStart = weekDays[0]
              const weekEnd = weekDays[weekDays.length - 1]
              return (
                <div key={wi} className={wi > 0 ? 'border-t-2 border-slate-200' : ''}>
                  <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {formatDay(weekStart)} – {formatDay(weekEnd)}
                    {' · '}
                    <span className="font-normal text-slate-400">{coverage.filter(c => weekDays.includes(c.date)).reduce((s,c)=>s+c.working,0)} working</span>
                  </div>
                  <table className="w-full text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-2 font-medium text-slate-500 w-40 sticky left-0 bg-white">Employee</th>
                        {weekDays.map(date => (
                          <th key={date} className={`px-1.5 py-2 font-medium text-slate-500 text-center min-w-[90px] ${date === today ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                            <div>{new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}</div>
                            <div className="font-normal text-slate-400">W{coverage.find(c=>c.date===date)?.working ?? 0}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {empList.map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 sticky left-0 bg-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: avatarColor(emp.name) }}>
                                {initials(emp.name)}
                              </div>
                              <span className="font-medium text-slate-800 truncate max-w-[80px]">{emp.name.split(' ')[0]}</span>
                            </div>
                          </td>
                          {weekDays.map(date => (
                            <td key={date} className="px-1.5 py-1.5">
                              <RosterCell emp={emp} date={date} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        ) : (
          /* Week view */
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500 w-44 sticky left-0 bg-slate-50">Employee</th>
                  {displayDates.map(date => (
                    <th key={date} className={`px-2 py-3 font-medium text-slate-500 text-center min-w-[110px] ${date === today ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                      <div>{new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                      <div className="font-normal text-slate-400">W {coverage.find(c=>c.date===date)?.working ?? 0}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {empList.map(emp => {
                  const team = emp.teams as any
                  const defaultShift = emp.shifts as any
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 sticky left-0 bg-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: avatarColor(emp.name) }}>
                            {initials(emp.name)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 text-xs leading-tight">{emp.name}</div>
                            <div className="text-slate-400 text-xs">{team?.name ?? (defaultShift?.name ?? 'No shift')}</div>
                          </div>
                        </div>
                      </td>
                      {displayDates.map(date => (
                        <td key={date} className="px-2 py-2">
                          <RosterCell emp={emp} date={date} />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!empList.length && (
              <div className="text-center py-16 text-slate-400 text-sm">No employees yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
