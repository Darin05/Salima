'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function generateRoster(orgId: string, weekStart: string) {
  const admin = createAdminClient()
  const { data: roster, error } = await admin
    .from('rosters')
    .insert({ org_id: orgId, week_start: weekStart, status: 'draft' })
    .select().single()
  if (error || !roster) return { error: error?.message ?? 'Failed to create roster' }

  const [{ data: employees }, { data: shifts }] = await Promise.all([
    admin.from('profiles').select('id').eq('org_id', orgId).eq('is_active', true).eq('role', 'employee'),
    admin.from('shifts').select('id').eq('org_id', orgId).limit(1),
  ])
  const defaultShift = shifts?.[0]?.id

  if (employees?.length && defaultShift) {
    const entries = employees.flatMap(emp =>
      [0, 1, 2, 3, 4].map(offset => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + offset)
        return { roster_id: roster.id, employee_id: emp.id, shift_id: defaultShift, date: d.toISOString().split('T')[0] }
      })
    )
    await admin.from('roster_entries').insert(entries)
  }

  revalidatePath('/roster')
  return { success: true, rosterId: roster.id }
}

export async function publishRoster(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('rosters').update({ status: 'published' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/roster')
  return { success: true }
}

export async function deleteRoster(id: string) {
  const admin = createAdminClient()
  await admin.from('rosters').delete().eq('id', id)
  revalidatePath('/roster')
  return { success: true }
}
