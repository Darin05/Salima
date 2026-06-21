'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LeaveActions({ id }: { id: string }) {
  const supabase = createClient()
  const router = useRouter()

  const update = (status: string) => async () => {
    await supabase.from('leave_requests').update({ status }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button onClick={update('approved')} className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 font-medium transition">Approve</button>
      <button onClick={update('rejected')} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 font-medium transition">Reject</button>
    </div>
  )
}
