'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEmployee } from './actions'

type Team = { id: string; name: string }
type Shift = { id: string; name: string; color: string }
type WorkPattern = { id: string; name: string; working_days: number; off_type: string }

export default function EditEmployeeButton({
  employee,
  teams,
  shifts,
  workPatterns,
}: {
  employee: { id: string; name: string; team_id: string | null; shift_id: string | null; work_pattern_id: string | null }
  teams: Team[]
  shifts: Shift[]
  workPatterns: WorkPattern[]
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: employee.name,
    team_id: employee.team_id ?? '',
    shift_id: employee.shift_id ?? '',
    work_pattern_id: employee.work_pattern_id ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await updateEmployee(employee.id, {
      name: form.name,
      team_id: form.team_id || null,
      shift_id: form.shift_id || null,
      work_pattern_id: form.work_pattern_id || null,
    })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition">
        Edit
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-5">Edit Employee</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Team</label>
                <select value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— No team —</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Shift</label>
                <select value={form.shift_id} onChange={e => setForm(f => ({ ...f, shift_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— No shift —</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Work Pattern</label>
                <select value={form.work_pattern_id} onChange={e => setForm(f => ({ ...f, work_pattern_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— No pattern —</option>
                  {workPatterns.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.working_days}d{p.off_type === 'rotating_weekly' ? ', rotating' : ''})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Controls working days and rotating off day logic.</p>
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
