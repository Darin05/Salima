'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAddLeave } from './actions'

const LEAVE_TYPES = ['Paid Leave', 'Casual Leave', 'Sick Leave', 'Eid Holiday', 'National Day', 'Unpaid Leave']

type Employee = { id: string; name: string }

export default function AddLeaveForm({ employees, orgId }: { employees: Employee[]; orgId: string }) {
  const [form, setForm] = useState({ employee_id: employees[0]?.id ?? '', start_date: '', end_date: '', type: 'Paid Leave' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await adminAddLeave({ ...form, org_id: orgId })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setForm(f => ({ ...f, start_date: '', end_date: '' }))
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Leave and Holidays</h2>
      <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mb-4">
        Add individual leave here. Approved leaves automatically block the employee from the roster.
      </div>
      <form onSubmit={save}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Agent</label>
            <select value={form.employee_id} onChange={set('employee_id')} required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
            <input type="date" required value={form.start_date} onChange={set('start_date')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
            <input type="date" required value={form.end_date} onChange={set('end_date')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select value={form.type} onChange={set('type')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium">
            {saving ? 'Adding…' : 'Add leave'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  )
}
