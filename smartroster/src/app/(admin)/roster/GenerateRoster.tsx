'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function getMonday(d: Date) {
  const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

export default function GenerateRoster({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [generating, setGenerating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)

    // Create roster draft
    const { data: roster } = await supabase
      .from('rosters')
      .insert({ org_id: orgId, week_start: weekStart, status: 'draft' })
      .select().single()

    if (!roster) { setGenerating(false); return }

    // Fetch employees + their assigned shift (first shift as default)
    const { data: employees } = await supabase
      .from('profiles')
      .select('id, team_id')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .eq('role', 'employee')

    const { data: shifts } = await supabase.from('shifts').select('id').eq('org_id', orgId).limit(1)
    const defaultShift = shifts?.[0]?.id

    if (employees?.length && defaultShift) {
      // Generate 5 working days Mon–Fri per employee
      const entries = employees.flatMap(emp =>
        [0, 1, 2, 3, 4].map(offset => {
          const d = new Date(weekStart)
          d.setDate(d.getDate() + offset)
          return { roster_id: roster.id, employee_id: emp.id, shift_id: defaultShift, date: d.toISOString().split('T')[0] }
        })
      )
      await supabase.from('roster_entries').insert(entries)
    }

    setGenerating(false)
    setOpen(false)
    router.push(`/roster/${roster.id}`)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
        ⚡ Generate Roster
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Generate Roster</h2>
            <p className="text-sm text-slate-500 mb-5">Creates a draft roster for all active employees.</p>
            <form onSubmit={generate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Week Starting</label>
                <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={generating} className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                  {generating ? 'Generating…' : '⚡ Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
