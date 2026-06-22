'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function toMonday(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export async function generateRoster(orgId: string, weekStart: string) {
  const admin = createAdminClient()
  const monday = toMonday(weekStart)

  const { data: roster, error } = await admin
    .from('rosters')
    .insert({ org_id: orgId, week_start: monday, status: 'draft' })
    .select().single()
  if (error || !roster) return { error: error?.message ?? 'Failed to create roster' }

  // Build the 5 weekdays (Mon–Fri)
  const weekDates = [0, 1, 2, 3, 4].map(offset => {
    const d = new Date(monday + 'T00:00:00')
    d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
  })
  const weekEnd = weekDates[4]

  const [{ data: employees }, { data: shifts }, { data: leaves }] = await Promise.all([
    admin.from('profiles').select('id, shift_id').eq('org_id', orgId).eq('is_active', true).eq('role', 'employee'),
    admin.from('shifts').select('id').eq('org_id', orgId).limit(1),
    admin.from('leave_requests').select('employee_id, start_date, end_date').eq('org_id', orgId).eq('status', 'approved').lte('start_date', weekEnd).gte('end_date', monday),
  ])
  const fallbackShift = shifts?.[0]?.id

  // Build a set of "employeeId|date" for approved leave days
  const onLeave = new Set<string>()
  for (const leave of leaves ?? []) {
    let d = new Date(leave.start_date + 'T00:00:00')
    const end = new Date(leave.end_date + 'T00:00:00')
    while (d <= end) {
      onLeave.add(`${leave.employee_id}|${d.toISOString().split('T')[0]}`)
      d.setDate(d.getDate() + 1)
    }
  }

  if (employees?.length) {
    const entries = (employees as any[]).flatMap(emp => {
      const shiftId = emp.shift_id ?? fallbackShift
      if (!shiftId) return []
      return weekDates
        .filter(date => !onLeave.has(`${emp.id}|${date}`))
        .map(date => ({ roster_id: roster.id, employee_id: emp.id, shift_id: shiftId, date }))
    })
    if (entries.length) await admin.from('roster_entries').insert(entries)
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
