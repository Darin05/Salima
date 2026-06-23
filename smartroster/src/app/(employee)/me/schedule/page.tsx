import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ScheduleNav from './ScheduleNav'
import { computeBreakTime } from '@/lib/breakTime'

function fmt(t: string) { return t?.slice(0, 5) ?? '' }

function toYMD(d: Date): string { return d.toISOString().split('T')[0] }

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

// Week starts Saturday
function getWeekStart(d: Date): Date {
  const dow = d.getDay()
  const diff = dow === 6 ? 0 : dow + 1
  const sat = new Date(d)
  sat.setDate(d.getDate() - diff)
  return sat
}

// SAT=6→col0, SUN=0→col1, MON=1→col2, TUE=2→col3, WED=3→col4, THU=4→col5, FRI=5→col6
function dowToCol(dow: number): number { return dow === 6 ? 0 : dow + 1 }

type DayStatus = 'working' | 'leave' | 'friday' | 'off'

interface DayInfo {
  date: string
  dow: number
  status: DayStatus
  entry?: any
  leaveType?: string
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; week?: string; month?: string }>
}) {
  const params = await searchParams
  const view = params.view === 'month' ? 'month' : 'week'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let rangeStart: Date, rangeEnd: Date, currentWeekStart: Date, currentMonth: string

  if (view === 'week') {
    const base = params.week ? new Date(params.week + 'T00:00:00') : today
    currentWeekStart = getWeekStart(base)
    rangeStart = currentWeekStart
    rangeEnd = addDays(currentWeekStart, 6)
    currentMonth = `${rangeStart.getFullYear()}-${String(rangeStart.getMonth() + 1).padStart(2, '0')}`
  } else {
    currentMonth = params.month ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const [yr, mo] = currentMonth.split('-').map(Number)
    rangeStart = new Date(yr, mo - 1, 1)
    rangeEnd = new Date(yr, mo, 0)
    currentWeekStart = getWeekStart(today)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const [{ data: profile }, { data: entries }, { data: leaves }] = await Promise.all([
    admin.from('profiles')
      .select('name, org_id, shift_id, shifts(name, start_time, end_time, color)')
      .eq('id', user.id)
      .single(),
    admin.from('roster_entries')
      .select('date, shift_id, break_ids, break_slot, shifts(name, start_time, end_time, color), rosters!inner(status)')
      .eq('employee_id', user.id)
      .eq('rosters.status', 'published')
      .gte('date', toYMD(rangeStart))
      .lte('date', toYMD(rangeEnd))
      .order('date'),
    admin.from('leave_requests')
      .select('start_date, end_date, type, status')
      .eq('employee_id', user.id)
      .eq('status', 'approved')
      .lte('start_date', toYMD(rangeEnd))
      .gte('end_date', toYMD(rangeStart)),
  ])

  let allBreaks: any[] = []
  if (profile?.org_id) {
    const { data: br } = await admin.from('break_rules').select('*').eq('org_id', profile.org_id).order('offset_minutes')
    allBreaks = br ?? []
  }

  const entryMap = new Map<string, any>()
  for (const e of entries ?? []) entryMap.set(e.date, e)

  const leaveMap = new Map<string, string>()
  for (const lv of leaves ?? []) {
    let d = new Date(lv.start_date + 'T00:00:00')
    const end = new Date(lv.end_date + 'T00:00:00')
    while (d <= end) { leaveMap.set(toYMD(d), lv.type); d.setDate(d.getDate() + 1) }
  }

  const days: DayInfo[] = []
  let d = new Date(rangeStart)
  while (d <= rangeEnd) {
    const ymd = toYMD(d)
    const dow = d.getDay()
    const leaveType = leaveMap.get(ymd)
    const entry = entryMap.get(ymd)
    let status: DayStatus
    if (leaveType) status = 'leave'
    else if (entry) status = 'working'
    else if (dow === 5) status = 'friday'
    else status = 'off'
    days.push({ date: ymd, dow, status, entry, leaveType })
    d.setDate(d.getDate() + 1)
  }

  const workingDays = days.filter(x => x.status === 'working').length
  const leaveDays = days.filter(x => x.status === 'leave').length
  const offDays = days.filter(x => x.status === 'off' || x.status === 'friday').length
  const baseShift = (profile as any)?.shifts as any
  const todayYMD = toYMD(today)

  // Build month calendar grid (pad to SAT-FRI rows)
  let calendarCells: (DayInfo | null)[] = []
  if (view === 'month') {
    const firstCol = dowToCol(days[0].dow)
    calendarCells = [...Array(firstCol).fill(null), ...days]
    while (calendarCells.length % 7 !== 0) calendarCells.push(null)
  }

  const statusBadge = (s: DayStatus) => {
    if (s === 'working') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Working</span>
    if (s === 'leave') return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">On Leave</span>
    if (s === 'friday') return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Friday Off</span>
    return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Day Off</span>
  }

  return (
    <div>
      <ScheduleNav view={view} currentWeek={toYMD(currentWeekStart)} currentMonth={currentMonth} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Working days</div>
          <div className="text-2xl font-bold text-slate-900">{workingDays}</div>
          <div className="text-xs text-slate-400">{view === 'week' ? 'this week' : 'this month'}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Days off</div>
          <div className="text-2xl font-bold text-slate-900">{offDays}</div>
          <div className="text-xs text-slate-400">incl. {view === 'week' ? 'Friday' : 'Fridays'}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Leave days</div>
          <div className="text-2xl font-bold text-slate-900">{leaveDays}</div>
          <div className="text-xs text-slate-400">{view === 'week' ? 'this week' : 'this month'}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Base shift</div>
          <div className="text-base font-bold text-slate-900">{baseShift?.name ?? '—'}</div>
          <div className="text-xs text-slate-400">{baseShift ? `${fmt(baseShift.start_time)}-${fmt(baseShift.end_time)}` : 'Not assigned'}</div>
        </div>
      </div>

      {view === 'week' ? (
        <div className="space-y-3">
          {days.map(day => {
            const shift = (day.entry?.shifts ?? baseShift) as any
            const breakIds: string[] = Array.isArray(day.entry?.break_ids) ? day.entry.break_ids : []
            const dayBreaks = allBreaks.filter(b => breakIds.includes(b.id))
            const isToday = day.date === todayYMD
            const dt = new Date(day.date + 'T00:00:00')
            const dayLabel = dt.toLocaleDateString('en', { weekday: 'long' })
            const dateLabel = dt.toLocaleDateString('en', { day: 'numeric', month: 'short' })
            return (
              <div key={day.date} className={`bg-white rounded-2xl border p-4 ${isToday ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-800">{dayLabel}</div>
                    <div className="text-xs text-slate-400">{dateLabel}{isToday && <span className="ml-2 text-blue-500 font-medium">Today</span>}</div>
                  </div>
                  {statusBadge(day.status)}
                </div>
                {day.status === 'working' && shift && (
                  <>
                    <div className="text-sm font-semibold text-cyan-600 mb-2">
                      {shift.name} · {fmt(shift.start_time)} - {fmt(shift.end_time)}
                    </div>
                    {dayBreaks.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Breaks &amp; Lunch</div>
                        <div className="space-y-0.5">
                          {dayBreaks.map(b => (
                            <div key={b.id} className="text-xs text-slate-600">{b.name}: {computeBreakTime(shift?.start_time ?? '08:00', shift?.end_time ?? '17:00', b.offset_from ?? 'start', b.offset_minutes ?? 120, (day.entry?.break_slot ?? 0) * 15)}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {day.status === 'leave' && (
                  <div className="text-sm text-orange-600 capitalize mt-1">{day.leaveType}</div>
                )}
                {day.status === 'friday' && (
                  <div className="text-sm text-slate-400 mt-1">Friday fixed</div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // Month calendar grid — SAT SUN MON TUE WED THU FRI
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {['SAT','SUN','MON','TUE','WED','THU','FRI'].map(h => (
              <div key={h} className="py-2 text-center text-xs font-semibold text-slate-400">{h}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarCells.map((cell, i) => {
              if (!cell) return <div key={i} className="min-h-[72px] border-b border-r border-slate-100 last:border-r-0" />
              const dt = new Date(cell.date + 'T00:00:00')
              const dateNum = dt.getDate()
              const isToday = cell.date === todayYMD
              const shift = (cell.entry?.shifts ?? baseShift) as any
              const cellBg =
                cell.status === 'working' ? 'bg-green-50' :
                cell.status === 'leave' ? 'bg-orange-50' :
                cell.status === 'friday' ? 'bg-red-50' : ''
              const textColor =
                cell.status === 'working' ? 'text-green-700' :
                cell.status === 'leave' ? 'text-orange-600' :
                cell.status === 'friday' ? 'text-red-500' : 'text-slate-400'
              return (
                <div key={cell.date} className={`min-h-[72px] border-b border-r border-slate-100 last:border-r-0 p-1.5 ${cellBg} ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}`}>
                  <div className={`text-xs font-bold mb-0.5 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{dateNum}</div>
                  {cell.status === 'working' && shift && (
                    <>
                      <div className="text-[10px] font-semibold text-green-700 leading-tight">Working</div>
                      <div className="text-[10px] text-green-600 leading-tight">{fmt(shift.start_time)}-{fmt(shift.end_time)}</div>
                    </>
                  )}
                  {cell.status === 'leave' && (
                    <div className="text-[10px] font-semibold text-orange-600 leading-tight">Leave</div>
                  )}
                  {cell.status === 'friday' && (
                    <div className="text-[10px] font-semibold text-red-500 leading-tight">Fri Off</div>
                  )}
                  {cell.status === 'off' && (
                    <div className="text-[10px] text-slate-400 leading-tight">Day Off</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
