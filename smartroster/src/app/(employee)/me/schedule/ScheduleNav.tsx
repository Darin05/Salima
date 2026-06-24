'use client'
import { useRouter, usePathname } from 'next/navigation'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Use local date parts to avoid UTC/timezone drift
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toYM(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

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

// Use Wednesday (Sat+4) of the Sat-Fri week to determine which month it belongs to
function weekToMonth(satDate: Date): string {
  return toYM(addDays(satDate, 4))
}

// Return Sat-Fri weeks whose Wednesday falls in the given YYYY-MM month
function getWeeksInMonth(month: string): { label: string; weekStart: string }[] {
  const [yr, mo] = month.split('-').map(Number)
  const weeks: { label: string; weekStart: string }[] = []
  // First Wednesday of the month
  const firstWed = new Date(yr, mo - 1, 1)
  while (firstWed.getDay() !== 3) firstWed.setDate(firstWed.getDate() + 1)
  // Go back 4 days to get the Saturday of that week
  let cur = addDays(firstWed, -4)
  let idx = 1
  while (true) {
    const wed = addDays(cur, 4)
    const wedMonth = `${wed.getFullYear()}-${String(wed.getMonth() + 1).padStart(2, '0')}`
    if (wedMonth !== month) break
    const end = addDays(cur, 6)
    const s = cur.toLocaleDateString('en', { day: 'numeric', month: 'short' })
    const e = end.toLocaleDateString('en', { day: 'numeric', month: 'short' })
    weeks.push({ label: `Week ${idx}: ${s} – ${e}`, weekStart: toYMD(cur) })
    cur = addDays(cur, 7)
    idx++
  }
  return weeks
}

export default function ScheduleNav({ view, currentWeek, currentMonth }: {
  view: 'week' | 'month'
  currentWeek: string
  currentMonth: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  function nav(params: Record<string, string>) {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) sp.set(k, v)
    router.push(`${pathname}?${sp}`)
  }

  const weekDate = new Date(currentWeek + 'T00:00:00')
  const weekEnd = addDays(weekDate, 6)
  const prevWeek = toYMD(addDays(weekDate, -7))
  const nextWeek = toYMD(addDays(weekDate, 7))

  // Derive month from Wednesday of the week (not Saturday, to avoid month drift)
  const derivedWeekMonth = weekToMonth(weekDate)
  const weeksInMonth = getWeeksInMonth(derivedWeekMonth)

  const [curYr] = currentMonth.split('-').map(Number)
  const monthOptions: { value: string; label: string }[] = []
  for (let y = curYr - 1; y <= curYr + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      const val = `${y}-${String(m).padStart(2, '0')}`
      monthOptions.push({ value: val, label: `${MONTHS[m - 1]} ${y}` })
    }
  }

  const rangeLabel = `${weekDate.toLocaleDateString('en', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div className="mb-4">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => nav({ view: 'week', week: currentWeek })}
          className={`px-5 py-1.5 rounded-full text-sm font-semibold transition ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >Week</button>
        <button
          onClick={() => nav({ view: 'month', month: currentMonth })}
          className={`px-5 py-1.5 rounded-full text-sm font-semibold transition ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >Month</button>
      </div>

      {view === 'week' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => nav({ view: 'week', week: prevWeek })}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 font-medium">← Prev</button>
            <span className="flex-1 text-center text-sm font-semibold text-slate-700">{rangeLabel}</span>
            <button onClick={() => nav({ view: 'week', week: nextWeek })}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 font-medium">Next →</button>
          </div>
          <div className="flex gap-2">
            <select
              value={derivedWeekMonth}
              onChange={e => {
                const ws = getWeeksInMonth(e.target.value)
                nav({ view: 'week', week: ws[0]?.weekStart ?? currentWeek })
              }}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            >
              {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={currentWeek}
              onChange={e => nav({ view: 'week', week: e.target.value })}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            >
              {weeksInMonth.map(w => <option key={w.weekStart} value={w.weekStart}>{w.label}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <select
          value={currentMonth}
          onChange={e => nav({ view: 'month', month: e.target.value })}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium"
        >
          {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  )
}
