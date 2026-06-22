'use client'
import { useRouter } from 'next/navigation'
import { deleteBreak } from './actions'

export default function BreakCard({ id, name, break_time, max_concurrent }: { id: string; name: string; break_time: string; max_concurrent: number }) {
  const router = useRouter()

  async function remove() {
    if (!confirm(`Delete break "${name}"?`)) return
    await deleteBreak(id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between">
      <div>
        <div className="text-2xl mb-3">☕</div>
        <div className="font-semibold text-slate-900">{name}</div>
        <div className="text-sm text-slate-500 mt-1">{break_time}</div>
        <div className="text-xs text-slate-400 mt-1">Max {max_concurrent} at once</div>
      </div>
      <button onClick={remove} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">
        Delete
      </button>
    </div>
  )
}
