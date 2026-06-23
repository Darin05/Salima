import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/layout/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let orgName: string | undefined
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const admin = createAdminClient()
      const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user.id).single()
      if (profile) {
        const { data: org } = await admin.from('organizations').select('name').eq('id', profile.org_id).single()
        orgName = org?.name
      }
    }
  } catch {}

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar orgName={orgName} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  )
}
