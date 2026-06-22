'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateRoster } from './actions'

function getMonday(d: Date) {
  const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(new Date(d).setDate(diff)).toISOString().split('T')[0]
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7) // "2026-07"
}

export default function GenerateRoster({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'week' | 'month'>('week')
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [month, setMonth] = useState(currentMonth())
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setError('')
    // For month mode, pass first day of selected month
    const dateInput = mode === 'month' ? `${month}-01` : weekStart
    const result = await generateRoster(orgId, dateInput, mode)
    setGenerating(false)
    if (result.error) { setError(result.error); return }
    setOpen(false)
    router.push(`/roster/${result.rosterId}`)
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
            <p className="text-sm text-slate-500 mb-5">Creates a draft roster for all active employees. Breaks are assigned automatically.</p>
            <form onSubmit={generate} className="space-y-4">
              {/* Mode toggle */}
              <div className="flex rounded-lg border border-slate-200 p-1 gap-1">
                <button type="button" onClick={() => setMode('week')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  Week
                </button>
                <button type="button" onClick={() => setMode('month')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  Month
                </button>
              </div>

              {mode === 'week' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Week Starting (Monday)</label>
                  <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <p className="text-xs text-slate-400 mt-1">Generates Mon–Fri (5 days)</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                  <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <p className="text-xs text-slate-400 mt-1">Generates all Mon–Fri of the month</p>
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setOpen(false); setError('') }} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
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
