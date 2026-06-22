'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkPattern } from './actions'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function WorkPatternForm({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', working_days: 5, off_type: 'fixed', off_days: ['Friday', 'Saturday'] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      off_days: f.off_days.includes(day) ? f.off_days.filter(d => d !== day) : [...f.off_days, day]
    }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await createWorkPattern({ ...form, org_id: orgId })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setOpen(false)
    setForm({ name: '', working_days: 5, off_type: 'fixed', off_days: ['Friday', 'Saturday'] })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
        + New Pattern
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-5">New Work Pattern</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pattern Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Standard 5-day" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Working Days per Week</label>
                <div className="flex gap-2">
                  {[5, 6, 7].map(n => (
                    <button key={n} type="button" onClick={() => setForm(f => ({ ...f, working_days: n }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${form.working_days === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {n} days
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Off Type</label>
                <select value={form.off_type} onChange={e => setForm(f => ({ ...f, off_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="fixed">Fixed Weekly Off</option>
                  <option value="rotating_weekly">Rotating Off (Weekly)</option>
                  <option value="rotating_monthly">Rotating Off (Monthly)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Off Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${form.off_days.includes(day) ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setOpen(false); setError('') }} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Pattern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
