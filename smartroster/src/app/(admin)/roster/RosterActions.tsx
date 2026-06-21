'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RosterActions({ id, status }: { id: string; status: string }) {
  const supabase = createClient()
  const router = useRouter()

  async function publish() {
    await supabase.from('rosters').update({ status: 'published' }).eq('id', id)
    router.refresh()
  }
  async function remove() {
    if (!confirm('Delete this roster?')) return
    await supabase.from('rosters').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'draft' && (
        <button onClick={publish} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium transition">
          Publish
        </button>
      )}
      <button onClick={remove} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">
        Delete
      </button>
    </div>
  )
}
