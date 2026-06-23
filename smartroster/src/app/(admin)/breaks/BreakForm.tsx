'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBreak } from './actions'

export default function BreakForm({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', offset_from: 'start', offset_minutes: 120, max_concurrent: 3 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await createBreak({ ...form, org_id: orgId })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setOpen(false)
    setForm({ name: '', offset_from: 'start', offset_minutes: 120, max_concurrent: 3 })
    router.refresh()
  }

  const hrs = Math.floor(form.offset_minutes / 60)
  const mins = form.offset_minutes % 60

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
        + Add Break Rule
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-1">Add Break Rule</h2>
            <p className="text-xs text-slate-400 mb-5">Break time auto-calculates based on each employee's shift start/end.</p>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Break Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Morning Break / Lunch / Afternoon Break"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Offset from</label>
                <select value={form.offset_from} onChange={e => setForm(f => ({ ...f, offset_from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="start">Shift Start</option>
                  <option value="end">Shift End</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time offset — {hrs}h {mins > 0 ? `${mins}m` : ''} {form.offset_from === 'end' ? 'before end' : 'after start'}
                </label>
                <div className="flex gap-2 items-center">
                  <input type="number" min={0} max={23} value={hrs}
                    onChange={e => setForm(f => ({ ...f, offset_minutes: +e.target.value * 60 + (f.offset_minutes % 60) }))}
                    className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-500">hr</span>
                  <input type="number" min={0} max={59} step={5} value={mins}
                    onChange={e => setForm(f => ({ ...f, offset_minutes: Math.floor(f.offset_minutes / 60) * 60 + +e.target.value }))}
                    className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-500">min</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  e.g. Agent at 8:00 → break at {(() => {
                    const base = form.offset_from === 'end' ? (17 * 60 + 30) : (8 * 60)
                    const t = form.offset_from === 'end' ? base - form.offset_minutes : base + form.offset_minutes
                    return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`
                  })()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Concurrent Employees</label>
                <input type="number" min={1} value={form.max_concurrent}
                  onChange={e => setForm(f => ({ ...f, max_concurrent: +e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setOpen(false); setError('') }}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
