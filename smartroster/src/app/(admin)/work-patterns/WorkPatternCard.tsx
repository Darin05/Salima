'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteWorkPattern } from './actions'

export default function WorkPatternCard({
  id, name, working_days, off_type, off_days, includes_weekends, max_off_per_day,
}: {
  id: string; name: string; working_days: number; off_type: string; off_days: string[]
  includes_weekends: boolean; max_off_per_day: number
}) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function remove() {
    setLoading(true)
    await deleteWorkPattern(id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between">
      <div>
        <div className="font-semibold text-slate-900 text-base mb-2">{name}</div>
        <div className="text-sm text-slate-500">{includes_weekends ? '📞 Contact Center (Sat–Thu)' : '🏢 Office (Mon–Fri)'}</div>
        <div className="text-sm text-slate-600 mt-1">📅 {working_days} working days/week</div>
        {off_type === 'rotating_weekly' ? (
          <div className="text-sm text-indigo-600 mt-1">🔄 Rotating weekly off · max {max_off_per_day} per day</div>
        ) : (
          <div className="text-sm text-slate-500 mt-1">Fixed off days only</div>
        )}
        {off_days?.length > 0 && (
          <div className="text-xs text-slate-400 mt-1">Fixed off: {off_days.join(', ')}</div>
        )}
      </div>
      {confirming ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">Sure?</span>
          <button onClick={remove} disabled={loading} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition disabled:opacity-60">
            {loading ? '…' : 'Yes'}
          </button>
          <button onClick={() => setConfirming(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition">
            No
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">
          Delete
        </button>
      )}
    </div>
  )
}
