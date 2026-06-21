'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/me', label: 'Today', icon: '📅' },
  { href: '/me/schedule', label: 'Schedule', icon: '📆' },
  { href: '/me/leave', label: 'Leave', icon: '🏖️' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex">
      {nav.map(({ href, label, icon }) => {
        const active = path === href || (href !== '/me' && path.startsWith(href))
        return (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className="text-xl">{icon}</span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
