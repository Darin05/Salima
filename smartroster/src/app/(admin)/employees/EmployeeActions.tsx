'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EmployeeActions({ id, isActive }: { id: string; isActive: boolean }) {
  const supabase = createClient()
  const router = useRouter()

  async function toggle() {
    await supabase.from('profiles').update({ is_active: !isActive }).eq('id', id)
    router.refresh()
  }
  async function remove() {
    if (!confirm('Delete this employee?')) return
    await supabase.from('profiles').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button onClick={toggle} className="text-xs text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition">
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button onClick={remove} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">
        Delete
      </button>
    </div>
  )
}
