'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { publishRoster, deleteRoster } from './actions'

export default function RosterActions({ id, status }: { id: string; status: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function publish() {
    setLoading(true)
    await publishRoster(id)
    setLoading(false)
    router.refresh()
  }
  async function remove() {
    setLoading(true)
    await deleteRoster(id)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'draft' && (
        <button onClick={publish} disabled={loading} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-60">
          {loading ? '…' : 'Publish'}
        </button>
      )}
      {confirming ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">Sure?</span>
          <button onClick={remove} disabled={loading} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition disabled:opacity-60">
            {loading ? '…' : 'Yes'}
          </button>
          <button onClick={() => setConfirming(false)} className="text-xs text-slate-500 px-2 py-1 rounded hover:bg-slate-100 transition">No</button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">
          Delete
        </button>
      )}
    </div>
  )
}
