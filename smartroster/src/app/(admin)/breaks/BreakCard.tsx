'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBreak } from './actions'

export default function BreakCard({ id, name, break_time, max_concurrent }: { id: string; name: string; break_time: string; max_concurrent: number }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function remove() {
    setLoading(true)
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
