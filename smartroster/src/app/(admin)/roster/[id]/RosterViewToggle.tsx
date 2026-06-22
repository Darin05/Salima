'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function RosterViewToggle({ currentView }: { currentView: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex rounded-lg border border-slate-200 p-0.5 gap-0.5">
      <button
        onClick={() => router.push(pathname)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${currentView !== 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
        Week
      </button>
      <button
        onClick={() => router.push(`${pathname}?view=month`)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${currentView === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
        Full Month
      </button>
    </div>
  )
}
