'use client'
import { useRouter } from 'next/navigation'
import { deleteTeam } from './actions'

export default function TeamCard({ id, name, count }: { id: string; name: string; count: number }) {
  const router = useRouter()

  async function remove() {
    if (!confirm(`Delete team "${name}"?`)) return
    await deleteTeam(id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between">
      <div>
        <div className="font-semibold text-slate-900 text-lg">{name}</div>
        <div className="text-sm text-slate-500 mt-1">{count} employees</div>
      </div>
      <button onClick={remove} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">
        Delete
      </button>
    </div>
  )
}
