'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function toMonday(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().split('T')[0]
}

function getWorkingDays(start: string, end: string) {
  const days: string[] = []
  const d = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (d <= last) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 1)
  }
  return days
}

export async function generateRoster(orgId: string, weekStart: string, mode: 'week' | 'month') {
  const admin = createAdminClient()
  const monday = toMonday(weekStart)

  let workingDays: string[]
  let label: string

  if (mode === 'month') {
    // All Mon-Fri of the month containing the selected date
    const [year, month] = monday.split('-').map(Number)
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]
    workingDays = getWorkingDays(firstDay, lastDay)
    label = firstDay.slice(0, 7) // "2026-07"
  } else {
    workingDays = getWorkingDays(monday, '')
    // just 5 days Mon-Fri
    const friday = new Date(monday + 'T00:00:00')
    friday.setDate(friday.getDate() + 4)
    workingDays = getWorkingDays(monday, friday.toISOString().split('T')[0])
    label = monday
  }

  const { data: roster, error } = await admin
    .from('rosters')
    .insert({ org_id: orgId, week_start: mode === 'month' ? workingDays[0] : monday, status: 'draft' })
    .select().single()
  if (error || !roster) return { error: error?.message ?? 'Failed to create roster' }

  const weekEnd = workingDays[workingDays.length - 1]

  const [{ data: employees }, { data: shifts }, { data: leaves }, { data: breaks }] = await Promise.all([
    admin.from('profiles').select('id, name, shift_id').eq('org_id', orgId).eq('is_active', true).eq('role', 'employee').order('name'),
    admin.from('shifts').select('id').eq('org_id', orgId).limit(1),
    admin.from('leave_requests').select('employee_id, start_date, end_date').eq('org_id', orgId).eq('status', 'approved').lte('start_date', weekEnd).gte('end_date', workingDays[0]),
    admin.from('break_rules').select('id, max_concurrent').eq('org_id', orgId),
  ])
  const fallbackShift = shifts?.[0]?.id
  const breakIds = (breaks ?? []).map((b: any) => b.id)
  // Use the strictest (smallest) max_concurrent across all break rules; default 2
  const maxConcurrent = Math.min(...(breaks ?? []).map((b: any) => b.max_concurrent ?? 2).filter((n: number) => n > 0)) || 2

  const onLeave = new Set<string>()
  for (const leave of leaves ?? []) {
    let d = new Date((leave.start_date as string) + 'T00:00:00')
    const end = new Date((leave.end_date as string) + 'T00:00:00')
    while (d <= end) {
      onLeave.add(`${leave.employee_id}|${d.toISOString().split('T')[0]}`)
      d.setDate(d.getDate() + 1)
    }
  }

  if (employees?.length) {
    // Group employees by shift so slots are assigned within each shift independently
    const byShift = new Map<string, any[]>()
    for (const emp of employees as any[]) {
      const shiftId = emp.shift_id ?? fallbackShift
      if (!shiftId) continue
      if (!byShift.has(shiftId)) byShift.set(shiftId, [])
      byShift.get(shiftId)!.push(emp)
    }

    const entries: any[] = []
    for (const [shiftId, shiftEmps] of byShift) {
      // Employees already ordered by name; assign break_slot = pair index within this shift
      shiftEmps.forEach((emp, i) => {
        const breakSlot = Math.floor(i / maxConcurrent)
        workingDays
          .filter(date => !onLeave.has(`${emp.id}|${date}`))
          .forEach(date => entries.push({
            roster_id: roster.id,
            employee_id: emp.id,
            shift_id: shiftId,
            date,
            break_ids: breakIds,
            break_slot: breakSlot,
          }))
      })
    }
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
