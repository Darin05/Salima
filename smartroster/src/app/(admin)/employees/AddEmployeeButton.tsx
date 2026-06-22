'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEmployee } from './actions'

export default function AddEmployeeButton({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', employee_number: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await createEmployee({ ...form, org_id: orgId })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setOpen(false)
    setForm({ name: '', email: '', employee_number: '', password: '' })
    router.refresh()
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
        + Add Employee
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-5">Add Employee</h2>
            <form onSubmit={save} className="space-y-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith', required: true },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@company.com', required: true },
                { key: 'employee_number', label: 'Employee Number', type: 'text', placeholder: 'EMP001', required: false },
                { key: 'password', label: 'Temporary Password', type: 'password', placeholder: '••••••••', required: true },
              ].map(({ key, label, type, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input
                    type={type}
                    required={required}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={set(key)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setOpen(false); setError('') }}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
