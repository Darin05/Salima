'use client'
import { useRouter } from 'next/navigation'
import { deleteShift } from './actions'

export default function ShiftCard({ id, name, start_time, end_time, color }: { id: string; name: string; start_time: string; end_time: string; color: string }) {
  const router = useRouter()

  async function remove() {
    if (!confirm(`Delete shift "${name}"?`)) return
    await deleteShift(id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{name}</div>
        <div className="text-sm text-slate-500 mt-0.5">{start_time} – {end_time}</div>
      </div>
      <button onClick={remove} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">
        Delete
      </button>
    </div>
  )
}
