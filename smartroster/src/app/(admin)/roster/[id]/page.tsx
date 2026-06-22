import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import PublishButton from './PublishButton'
import RosterViewToggle from './RosterViewToggle'

export default async function RosterDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const { id } = await params
  const { view } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: roster } = await admin.from('rosters').select('*').eq('id', id).single()
  const { data: entries } = await admin
    .from('roster_entries')
    .select('*, profiles(name), shifts(name, start_time, end_time, color)')
    .eq('roster_id', id)
    .order('date')

  if (!roster) return <div className="p-8 text-slate-500">Roster not found.</div>

  // Get all unique dates
  const allDates = [...new Set((entries ?? []).map(e => e.date))].sort()

  // In week view, show first 5 days only
  const dates = view === 'month' ? allDates : allDates.slice(0, 5)
  const isMonth = allDates.length > 5

  const byEmployee: Record<string, { name: string; entries: any[] }> = {}
  for (const entry of entries ?? []) {
    const name = (entry.profiles as any)?.name ?? 'Unknown'
    if (!byEmployee[entry.employee_id]) byEmployee[entry.employee_id] = { name, entries: [] }
    byEmployee[entry.employee_id].entries.push(entry)
  }

  // Determine roster period label
  const firstDate = allDates[0] ?? roster.week_start
  const lastDate = allDates[allDates.length - 1] ?? roster.week_start
  const label = isMonth
    ? new Date(firstDate + 'T00:00:00').toLocaleDateString('en', { month: 'long', year: 'numeric' })
    : `Week of ${roster.week_start}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/roster" className="text-sm text-slate-400 hover:text-slate-600 mb-1 block">← Rosters</Link>
          <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{allDates.length} working days · {Object.keys(byEmployee).length} employees</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={roster.status} />
          {isMonth && <RosterViewToggle currentView={view ?? 'week'} />}
          {roster.status === 'draft' && <PublishButton id={roster.id} />}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-36 sticky left-0 bg-white">Employee</th>
              {dates.map(date => (
                <th key={date} className="px-2 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide text-center min-w-[90px]">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Object.values(byEmployee).map(({ name, entries }) => (
              <tr key={name} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900 sticky left-0 bg-white">{name}</td>
                {dates.map(date => {
                  const entry = entries.find(e => e.date === date)
                  const shift = entry?.shifts as any
                  const breakCount = Array.isArray(entry?.break_ids) ? entry.break_ids.length : 0
                  return (
                    <td key={date} className="px-2 py-3 text-center">
                      {shift ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium text-white"
                            style={{ backgroundColor: shift.color }}>
                            {shift.name}
                          </span>
                          {breakCount > 0 && (
                            <span className="text-xs text-slate-400">☕ ×{breakCount}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!Object.keys(byEmployee).length && (
          <div className="text-center py-16 text-slate-400">No entries in this roster.</div>
        )}
      </div>

      {isMonth && view !== 'month' && allDates.length > 5 && (
        <p className="text-center text-sm text-slate-400 mt-4">
          Showing first week only · <Link href={`/roster/${id}?view=month`} className="text-indigo-600 hover:underline">View full month ({allDates.length} days)</Link>
        </p>
      )}
    </div>
  )
}
