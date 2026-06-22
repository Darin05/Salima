'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleEmployee, deleteEmployee } from './actions'

export default function EmployeeActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    await toggleEmployee(id, isActive)
    router.refresh()
    setLoading(false)
  }
  async function remove() {
    setLoading(true)
    await deleteEmployee(id)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={toggle} disabled={loading} className="text-xs text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition disabled:opacity-60">
        {isActive ? 'Deactivate' : 'Activate'}
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
        <button onClick={() => setConfirming(true)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">
          Delete
        </button>
      )}
    </div>
  )
}
