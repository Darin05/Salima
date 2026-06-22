'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTeam } from './actions'

export default function TeamCard({ id, name, count }: { id: string; name: string; count: number }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function remove() {
    setLoading(true)
    await deleteTeam(id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between">
      <div>
        <div className="font-semibold text-slate-900 text-lg">{name}</div>
        <div className="text-sm text-slate-500 mt-1">{count} employees</div>
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
