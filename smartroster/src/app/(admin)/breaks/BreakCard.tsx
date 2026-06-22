'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBreak, updateBreak } from './actions'

export default function BreakCard({ id, name, break_time, max_concurrent }: { id: string; name: string; break_time: string; max_concurrent: number }) {
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name, break_time, max_concurrent })
  const [error, setError] = useState('')
  const router = useRouter()

  async function remove() {
    setLoading(true)
    await deleteBreak(id)
    router.refresh()
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await updateBreak(id, form)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-indigo-200 p-6">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Break Name</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
            <input type="time" value={form.break_time} onChange={e => setForm(f => ({ ...f, break_time: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Max Concurrent</label>
            <input type="number" min={1} value={form.max_concurrent} onChange={e => setForm(f => ({ ...f, max_concurrent: +e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between">
      <div>
        <div className="text-2xl mb-3">☕</div>
        <div className="font-semibold text-slate-900">{name}</div>
        <div className="text-sm text-slate-500 mt-1">{break_time}</div>
        <div className="text-xs text-slate-400 mt-1">Max {max_concurrent} at once</div>
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
