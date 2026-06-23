'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { removeLeave } from './actions'

export default function RemoveLeaveButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function remove() {
    setLoading(true)
    await removeLeave(id)
    router.refresh()
  }

  if (confirming) return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-500">Sure?</span>
      <button onClick={remove} disabled={loading} className="text-xs text-white bg-red-500 px-2 py-1 rounded disabled:opacity-60">
        {loading ? '…' : 'Yes'}
      </button>
      <button onClick={() => setConfirming(false)} className="text-xs text-slate-500 px-2 py-1 rounded hover:bg-slate-100">No</button>
    </div>
  )

  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-slate-500 hover:text-red-600 px-3 py-1 border border-slate-200 rounded-lg hover:border-red-200 transition">
      Remove
    </button>
  )
}
