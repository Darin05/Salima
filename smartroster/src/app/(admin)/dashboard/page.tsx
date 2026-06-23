import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import WeekNav from './WeekNav'

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

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const monday = week ? toMonday(week) : toMonday(today)
  const weekDates = [0,1,2,3,4,5,6].map(i => addDays(monday, i))
  const sunday = weekDates[6]

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
    { count: pendingLeave },
  ] = await Promise.all([
    admin.from('profiles').select('id, name, shift_id, team_id, shifts(name, start_time, end_time, color), teams(name)').eq('org_id', orgId).eq('is_active', true).eq('role', 'employee').order('name'),
    admin.from('shifts').select('*').eq('org_id', orgId),
    admin.from('break_rules').select('*').eq('org_id', orgId).order('break_time'),
    admin.from('leave_requests').select('employee_id, start_date, end_date, type, status').eq('org_id', orgId).in('status', ['approved', 'pending']).lte('start_date', sunday).gte('end_date', monday),
    admin.from('leave_requests').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'pending'),
  ])

  const approvedLeaves = (leaves ?? []).filter((l: any) => l.status === 'approved')

  // Build leave lookup: empId|date → leave type
  const leaveMap = new Map<string, string>()
  for (const lv of approvedLeaves) {
    let d = new Date((lv.start_date as string) + 'T00:00:00')
    const end = new Date((lv.end_date as string) + 'T00:00:00')
    while (d <= end) {
      leaveMap.set(`${lv.employee_id}|${d.toISOString().split('T')[0]}`, lv.type)
      d.setDate(d.getDate() + 1)
    }
  }

  const empList = (employees ?? []) as any[]
  const totalEmployees = empList.length

  // Per-day coverage
  const coverage = weekDates.map(date => {
    let working = 0, onLeave = 0, off = 0
    for (const emp of empList) {
      const lv = leaveMap.get(`${emp.id}|${date}`)
      if (lv) onLeave++
      else if (emp.shift_id) working++
      else off++
    }
    return { date, working, onLeave, off }
  })

  const todayCoverage = coverage.find(c => c.date === today) ?? coverage[0]
  const undercoveredDays = coverage.filter(c => c.working < Math.ceil(totalEmployees * 0.7)).length
  const leaveThisWeek = new Set(approvedLeaves.map((l: any) => l.employee_id)).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Selected week drives the roster. App generates the week, you edit only where needed.</p>
        </div>
        <WeekNav monday={monday} />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Active agents</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{totalEmployees}</div>
          <div className="text-xs text-slate-400 mt-1">Friday fixed off for all</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total weekly coverage</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{coverage.reduce((s,c) => s + c.working, 0)}</div>
          <div className="text-xs text-slate-400 mt-1">Required {totalEmployees * 5}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Under-covered days</div>
          <div className={`text-3xl font-bold mt-1 ${undercoveredDays > 0 ? 'text-red-600' : 'text-slate-900'}`}>{undercoveredDays}</div>
          <div className="text-xs text-slate-400 mt-1">This selected week</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Leave / holiday records</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{leaveThisWeek}</div>
          <div className="text-xs text-slate-400 mt-1">Affecting this week</div>
        </div>
      </div>

      {/* Daily overview */}
      {todayCoverage && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Daily overview · {new Date(todayCoverage.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(shifts ?? []).slice(0, 2).map((sh: any, i: number) => {
              const count = empList.filter(e => e.shift_id === sh.id && !leaveMap.has(`${e.id}|${todayCoverage.date}`)).length
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
              <div className="text-xs text-slate-500 font-medium">No shift assigned</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{todayCoverage.off}</div>
              <div className="text-xs text-slate-400">Missing shift setup</div>
            </div>
          </div>
        </div>
      )}

      {/* Week coverage snapshot */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Week coverage snapshot · {formatDay(monday)} – {formatDay(sunday)}
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
                  {off > 0 && <div>No shift {off}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Auto-generated weekly roster */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Auto-generated weekly roster · {formatDay(monday)} – {formatDay(sunday)}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Based on each employee's assigned shift and approved leave.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 w-44 sticky left-0 bg-slate-50">Employee</th>
                {weekDates.map(date => (
                  <th key={date} className={`px-2 py-3 font-medium text-slate-500 text-center min-w-[110px] ${date === today ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                    <div>{new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    <div className="font-normal text-slate-400">Avail {coverage.find(c=>c.date===date)?.working} · Req {totalEmployees}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {empList.map(emp => {
                const shift = emp.shifts as any
                const team = emp.teams as any
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
                          <div className="text-slate-400 text-xs">{team?.name ?? (shift?.name ?? 'No shift')}</div>
                        </div>
                      </div>
                    </td>
                    {weekDates.map(date => {
                      const lvType = leaveMap.get(`${emp.id}|${date}`)
                      if (lvType) {
                        return (
                          <td key={date} className="px-2 py-2">
                            <div className="rounded-lg bg-orange-50 border border-orange-100 p-2 text-center">
                              <div className="font-semibold text-orange-700 uppercase text-xs">LEAVE</div>
                              <div className="text-orange-500 text-xs capitalize mt-0.5">{lvType}</div>
                            </div>
                          </td>
                        )
                      }
                      if (!shift) {
                        return (
                          <td key={date} className="px-2 py-2">
                            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 text-center">
                              <div className="text-slate-400 text-xs">No shift</div>
                            </div>
                          </td>
                        )
                      }
                      return (
                        <td key={date} className="px-2 py-2">
                          <div className="rounded-lg bg-green-50 border border-green-100 p-2">
                            <div className="font-semibold text-green-800 uppercase text-xs">WORK</div>
                            <div className="text-green-700 text-xs mt-0.5">{shift.name} · {formatTime(shift.start_time)}–{formatTime(shift.end_time)}</div>
                            {(breaks as any[])?.map((b: any, i: number) => (
                              <div key={b.id} className="text-green-600 text-xs mt-0.5">B{i+1} {formatTime(b.break_time)}</div>
                            ))}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!empList.length && (
            <div className="text-center py-16 text-slate-400 text-sm">No employees yet. Add employees and assign shifts to see the roster.</div>
          )}
        </div>
      </div>
    </div>
  )
}
