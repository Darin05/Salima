'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteShift, updateShift } from './actions'

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function ShiftCard({ id, name, start_time, end_time, color }: { id: string; name: string; start_time: string; end_time: string; color: string }) {
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name, start_time, end_time, color })
  const [error, setError] = useState('')
  const router = useRouter()

  async function remove() {
    setLoading(true)
    await deleteShift(id)
    router.refresh()
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await updateShift(id, form)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-indigo-200 p-5">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Shift Name</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-6 h-6 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(false)} className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{name}</div>
        <div className="text-sm text-slate-500 mt-0.5">{start_time} – {end_time}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <button onClick={() => setEditing(true)} className="text-xs text-indigo-400 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition">
          Edit
        </button>
        {confirming ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">Sure?</span>
            <button onClick={remove} disabled={loading} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition disabled:opacity-60">
              {loading ? '…' : 'Yes'}
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs text-slate-500 px-2 py-1 rounded hover:bg-slate-100 transition">No</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
