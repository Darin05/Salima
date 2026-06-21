import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import PublishButton from './PublishButton'

export default async function RosterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: roster } = await supabase.from('rosters').select('*').eq('id', id).single()
  const { data: entries } = await supabase
    .from('roster_entries')
    .select('*, profiles(name), shifts(name, start_time, end_time, color)')
    .eq('roster_id', id)
    .order('date')

  if (!roster) return <div className="p-8 text-slate-500">Roster not found.</div>

  // Group entries by employee
  const byEmployee: Record<string, { name: string; entries: any[] }> = {}
  for (const entry of entries ?? []) {
    const name = (entry.profiles as any)?.name ?? 'Unknown'
    if (!byEmployee[entry.employee_id]) byEmployee[entry.employee_id] = { name, entries: [] }
    byEmployee[entry.employee_id].entries.push(entry)
  }

  // Get unique dates for column headers
  const dates = [...new Set((entries ?? []).map(e => e.date))].sort()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/roster" className="text-sm text-slate-400 hover:text-slate-600 mb-1 block">← Rosters</Link>
          <h1 className="text-2xl font-bold text-slate-900">Week of {roster.week_start}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={roster.status} />
          {roster.status === 'draft' && <PublishButton id={roster.id} />}
        </div>
      </div>

      {/* Roster Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-40">Employee</th>
              {dates.map(date => (
                <th key={date} className="px-3 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide text-center">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Object.values(byEmployee).map(({ name, entries }) => (
              <tr key={name} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{name}</td>
                {dates.map(date => {
                  const entry = entries.find(e => e.date === date)
                  const shift = entry?.shifts as any
                  return (
                    <td key={date} className="px-3 py-3 text-center">
                      {shift ? (
                        <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium text-white"
                          style={{ backgroundColor: shift.color }}>
                          {shift.name}
                        </span>
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
    </div>
  )
}
