'use client'
import { useRouter, usePathname } from 'next/navigation'

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getWeekLabel(monday: string) {
  const start = new Date(monday + 'T00:00:00')
  const end = new Date(monday + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  const weekNum = Math.ceil((start.getDate() + new Date(start.getFullYear(), start.getMonth(), 1).getDay()) / 7)
  const fmt = (d: Date) => d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
  return `Week ${weekNum}  ·  ${fmt(start)} – ${fmt(end)}`
}

function getMonthStr(monday: string) {
  return new Date(monday + 'T00:00:00').toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

function getWeeksOfMonth(monday: string) {
  const d = new Date(monday + 'T00:00:00')
  const year = d.getFullYear()
  const month = d.getMonth()
  const weeks: { label: string; monday: string }[] = []
  const first = new Date(year, month, 1)
  // Find first Monday of or before the 1st
  let cur = new Date(first)
  const dow = cur.getDay()
  cur.setDate(cur.getDate() - (dow === 0 ? 6 : dow - 1))
  while (true) {
    const mon = cur.toISOString().split('T')[0]
    const sun = new Date(cur)
    sun.setDate(sun.getDate() + 6)
    // Include week if it overlaps the month
    if (cur.getMonth() <= month && sun.getMonth() >= month || cur.getFullYear() < year && sun.getMonth() >= month) {
      weeks.push({ label: getWeekLabel(mon), monday: mon })
    }
    cur.setDate(cur.getDate() + 7)
    if (cur.getFullYear() > year || (cur.getFullYear() === year && cur.getMonth() > month)) break
  }
  return weeks
}

export default function WeekNav({ monday }: { monday: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const prevWeek = addDays(monday, -7)
  const nextWeek = addDays(monday, 7)
  const weeks = getWeeksOfMonth(monday)

  function go(w: string) { router.push(`${pathname}?week=${w}`) }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div>
        <div className="text-xs text-slate-400 mb-1">Month</div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
          {getMonthStr(monday)}
        </div>
      </div>
      <div>
        <div className="text-xs text-slate-400 mb-1">Week</div>
        <select
          value={monday}
          onChange={e => go(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {weeks.map(w => (
            <option key={w.monday} value={w.monday}>{w.label}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => go(prevWeek)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          ← Previous week
        </button>
        <button onClick={() => go(nextWeek)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          Next week →
        </button>
      </div>
    </div>
  )
}
