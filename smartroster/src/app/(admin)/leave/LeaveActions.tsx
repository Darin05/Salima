'use client'
import { useRouter } from 'next/navigation'
import { updateLeaveStatus } from './actions'

export default function LeaveActions({ id }: { id: string }) {
  const router = useRouter()

  const update = (status: 'approved' | 'rejected') => async () => {
    await updateLeaveStatus(id, status)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button onClick={update('approved')} className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 font-medium transition">Approve</button>
      <button onClick={update('rejected')} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 font-medium transition">Reject</button>
    </div>
  )
}
