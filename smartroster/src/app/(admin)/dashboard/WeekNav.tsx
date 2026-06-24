'use client'
import { useRouter, usePathname } from 'next/navigation'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Use local date parts — avoids UTC/timezone drift from toISOString()
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDaysTo(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function toMonday(d: Date): Date {
  const day = d.getDay()
  const r = new Date(d)
  r.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return r
}

// Use the week's Thursday to determine which month/year the week "belongs to"
// (ISO 8601 standard — prevents Jun-29 week showing as June when it's July's Week 1)
function weekMonth(monday: Date): { year: number; month: number } {
  const thu = addDaysTo(monday, 3)
  return { year: thu.getFullYear(), month: thu.getMonth() }
}

// Return weeks whose Thursday falls in the given month
function getWeeksOfMonth(year: number, month: number): { label: string; monday: string }[] {
  const weeks: { label: string; monday: string }[] = []
  // Find first Thursday in the month
  const firstThu = new Date(year, month, 1)
  while (firstThu.getDay() !== 4) firstThu.setDate(firstThu.getDate() + 1)
  // Step back to Monday of that week
  let cur = addDaysTo(firstThu, -3)
  let idx = 1
  while (true) {
    const thu = addDaysTo(cur, 3)
    if (thu.getFullYear() !== year || thu.getMonth() !== month) break
    const end = addDaysTo(cur, 6)
    const s = cur.toLocaleDateString('en', { day: 'numeric', month: 'short' })
    const e = end.toLocaleDateString('en', { day: 'numeric', month: 'short' })
    weeks.push({ label: `Week ${idx} · ${s} – ${e}`, monday: toYMD(cur) })
    cur = addDaysTo(cur, 7)
    idx++
  }
  return weeks
}

export default function WeekNav({ monday, view }: { monday: string; view: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const mondayDate = new Date(monday + 'T00:00:00')
  const { year, month } = weekMonth(mondayDate)

  const prevWeek = toYMD(addDaysTo(mondayDate, -7))
  const nextWeek = toYMD(addDaysTo(mondayDate, 7))
  const weeks = getWeeksOfMonth(year, month)
  const currentMonthVal = `${year}-${month}` // "2026-6" for July

  const monthOptions: { value: string; label: string }[] = []
  for (let i = -6; i <= 6; i++) {
    const d = new Date(year, month + i, 1)
    const val = `${d.getFullYear()}-${d.getMonth()}`
    monthOptions.push({ value: val, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` })
  }

  const isMonth = view === 'month'

  function buildUrl(w: string, v: string) {
    return v === 'month' ? `${pathname}?week=${w}&view=month` : `${pathname}?week=${w}`
  }

  function go(w: string) { router.push(buildUrl(w, view)) }

  function changeMonth(val: string) {
    const [y, m] = val.split('-').map(Number)
    const ws = getWeeksOfMonth(y, m)
    const w = ws.length > 0 ? ws[0].monday : monday
    router.push(buildUrl(w, view))
  }

  function switchView(v: string) {
    router.push(buildUrl(monday, v))
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* View toggle */}
      <div className="flex rounded-lg border border-slate-200 p-0.5 gap-0.5">
        <button
          onClick={() => switchView('week')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${!isMonth ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Week
        </button>
        <button
          onClick={() => switchView('month')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${isMonth ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Month
        </button>
      </div>

      {/* Month dropdown */}
      <div>
        <div className="text-xs text-slate-400 mb-1">Month</div>
        <select
          value={currentMonthVal}
          onChange={e => changeMonth(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Week dropdown — only in week view */}
      {!isMonth && (
        <>
          <div>
            <div className="text-xs text-slate-400 mb-1">Week</div>
            <select
              value={monday}
              onChange={e => go(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {weeks.map(w => <option key={w.monday} value={w.monday}>{w.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => go(prevWeek)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 bg-white text-slate-600 transition">
              ← Previous week
            </button>
            <button onClick={() => go(nextWeek)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 bg-white text-slate-600 transition">
              Next week →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
