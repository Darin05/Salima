'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/roster', label: 'Weekly Planner' },
  { href: '/leave', label: 'Leave and Holidays' },
  { href: '/breaks', label: 'Break Control' },
  { href: '/shifts', label: 'Shifts' },
  { href: '/work-patterns', label: 'Work Patterns' },
  { href: '/teams', label: 'Team Setup' },
  { href: '/employees', label: 'Employees' },
]

export default function Sidebar({ orgName }: { orgName?: string }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="font-bold text-white text-sm">{orgName ?? 'SmartRoster'}</div>
        <div className="text-xs text-slate-400 mt-0.5">CX roster planner</div>
        <div className="text-xs text-slate-500 mt-0.5">Friday fixed off · weekly auto-plan</div>
        <div className="text-xs text-slate-500">leave-driven edits</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-700">
        <div className="text-xs text-slate-500 px-3 mb-2">Built for your CX operation</div>
        <button
          onClick={logout}
          className="flex items-center px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
