'use client'
import { useRouter } from 'next/navigation'
import { toggleEmployee, deleteEmployee } from './actions'

export default function EmployeeActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter()

  async function toggle() {
    await toggleEmployee(id, isActive)
    router.refresh()
  }
  async function remove() {
    if (!confirm('Delete this employee?')) return
    await deleteEmployee(id)
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
