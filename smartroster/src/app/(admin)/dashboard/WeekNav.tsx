'use client'
import { useRouter, usePathname } from 'next/navigation'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function toMonday(d: Date): Date {
  const day = d.getDay()
  const r = new Date(d)
  r.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return r
}

function toYMD(d: Date): string { return d.toISOString().split('T')[0] }

function getWeeksOfMonth(year: number, month: number): { label: string; monday: string }[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const weeks: { label: string; monday: string }[] = []
  let cur = toMonday(first)
  let idx = 1
  while (cur <= last) {
    const end = addDays(cur, 6)
    const s = cur.toLocaleDateString('en', { day: 'numeric', month: 'short' })
    const e = end.toLocaleDateString('en', { day: 'numeric', month: 'short' })
    weeks.push({ label: `Week ${idx} · ${s} – ${e}`, monday: toYMD(cur) })
    cur = addDays(cur, 7)
    idx++
  }
  return weeks
}

export default function WeekNav({ monday, view }: { monday: string; view: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const mondayDate = new Date(monday + 'T00:00:00')
  const year = mondayDate.getFullYear()
  const month = mondayDate.getMonth()

  const prevWeek = toYMD(addDays(mondayDate, -7))
  const nextWeek = toYMD(addDays(mondayDate, 7))
  const weeks = getWeeksOfMonth(year, month)

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

      <div>
        <div className="text-xs text-slate-400 mb-1">Month</div>
        <select
          value={`${year}-${month}`}
          onChange={e => changeMonth(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

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
