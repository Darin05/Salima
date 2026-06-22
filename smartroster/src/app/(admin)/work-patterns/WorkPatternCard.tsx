'use client'
import { useRouter } from 'next/navigation'
import { deleteWorkPattern } from './actions'

const offTypeLabel: Record<string, string> = {
  fixed: 'Fixed Weekly Off',
  rotating_weekly: 'Rotating Off (Weekly)',
  rotating_monthly: 'Rotating Off (Monthly)',
}

export default function WorkPatternCard({ id, name, working_days, off_type, off_days }: { id: string; name: string; working_days: number; off_type: string; off_days: string[] }) {
  const router = useRouter()

  async function remove() {
    if (!confirm(`Delete pattern "${name}"?`)) return
    await deleteWorkPattern(id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between">
      <div>
        <div className="font-semibold text-slate-900 text-lg mb-2">{name}</div>
        <div className="text-sm text-slate-600">📅 {working_days} working days/week</div>
        <div className="text-sm text-slate-500 mt-1">{offTypeLabel[off_type]}</div>
        {off_days?.length > 0 && (
          <div className="text-xs text-slate-400 mt-1">Off: {off_days.join(', ')}</div>
        )}
      </div>
      <button onClick={remove} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">
        Delete
      </button>
    </div>
  )
}
