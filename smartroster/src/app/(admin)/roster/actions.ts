'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const DAY_NAME_TO_DOW: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

function getAllDaysInRange(start: string, end: string): string[] {
  const days: string[] = []
  const d = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (d <= last) {
    days.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 1)
  }
  return days
}

function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split('T')[0]
}

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function toMonday(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().split('T')[0]
}

export async function generateRoster(orgId: string, weekStart: string, mode: 'week' | 'month') {
  const admin = createAdminClient()
  const monday = toMonday(weekStart)

  let rangeStart: string, rangeEnd: string

  if (mode === 'month') {
    const [year, month] = monday.split('-').map(Number)
    rangeStart = `${year}-${String(month).padStart(2, '0')}-01`
    rangeEnd = new Date(year, month, 0).toISOString().split('T')[0]
  } else {
    rangeStart = monday
    // Full Mon–Sun week so weekend workers are included
    const sun = new Date(monday + 'T00:00:00')
    sun.setDate(sun.getDate() + 6)
    rangeEnd = sun.toISOString().split('T')[0]
  }

  const { data: roster, error } = await admin
    .from('rosters')
    .insert({ org_id: orgId, week_start: rangeStart, status: 'draft' })
    .select().single()
  if (error || !roster) return { error: error?.message ?? 'Failed to create roster' }

  const [{ data: employees }, { data: shifts }, { data: leaves }, { data: breaks }] = await Promise.all([
    admin.from('profiles')
      .select('id, name, shift_id, work_pattern_id, work_patterns(working_days, off_type, off_days, includes_weekends, max_off_per_day)')
      .eq('org_id', orgId).eq('is_active', true).eq('role', 'employee').order('name'),
    admin.from('shifts').select('id').eq('org_id', orgId).limit(1),
    admin.from('leave_requests').select('employee_id, start_date, end_date')
      .eq('org_id', orgId).eq('status', 'approved')
      .lte('start_date', rangeEnd).gte('end_date', rangeStart),
    admin.from('break_rules').select('id, max_concurrent').eq('org_id', orgId),
  ])

  const fallbackShift = shifts?.[0]?.id
  const breakIds = (breaks ?? []).map((b: any) => b.id)
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

  const allDays = getAllDaysInRange(rangeStart, rangeEnd)

  // Collect all unique week Mondays in the range
  const weekMondaySet = new Set<string>()
  for (const d of allDays) weekMondaySet.add(getWeekMonday(d))

  // Pre-compute rotating off day per employee per week
  // Group employees by work_pattern_id so slot assignment is within each pattern group
  const rotatingOffMap = new Map<string, number>() // key: `${empId}|${weekMonday}` → DOW off

  const patternGroups = new Map<string, any[]>()
  for (const emp of (employees ?? []) as any[]) {
    const pattern = emp.work_patterns
    if (!pattern || pattern.off_type !== 'rotating_weekly') continue
    const key = emp.work_pattern_id as string
    if (!patternGroups.has(key)) patternGroups.set(key, [])
    patternGroups.get(key)!.push(emp)
  }

  for (const [, group] of patternGroups) {
    const pattern = group[0].work_patterns
    const fixedOffDows = (pattern.off_days ?? ['Friday']).map((d: string) => DAY_NAME_TO_DOW[d.toLowerCase()] ?? 5)
    const maxOffPerDay = pattern.max_off_per_day ?? 2
    const includesWeekends = pattern.includes_weekends ?? false

    // Pool of days the rotating off can fall on:
    // All DOWs minus fixed-off days, and exclude weekends if office pattern
    const allDows = [0, 1, 2, 3, 4, 5, 6]
    const excluded = new Set<number>(fixedOffDows)
    if (!includesWeekends) { excluded.add(0); excluded.add(6) }
    const pool = allDows.filter(d => !excluded.has(d))

    if (pool.length === 0) continue

    for (const weekMonday of weekMondaySet) {
      const weekNum = getISOWeek(weekMonday)
      // Each pair of maxOffPerDay employees shares a slot; slot rotates each week
      group.forEach((emp, i) => {
        const slot = (Math.floor(i / maxOffPerDay) + weekNum) % pool.length
        rotatingOffMap.set(`${emp.id}|${weekMonday}`, pool[slot])
      })
    }
  }

  if (!employees?.length) {
    revalidatePath('/roster')
    return { success: true, rosterId: roster.id }
  }

  // Group by shift for break_slot assignment
  const byShift = new Map<string, any[]>()
  for (const emp of employees as any[]) {
    const shiftId = emp.shift_id ?? fallbackShift
    if (!shiftId) continue
    if (!byShift.has(shiftId)) byShift.set(shiftId, [])
    byShift.get(shiftId)!.push(emp)
  }

  const entries: any[] = []
  for (const [shiftId, shiftEmps] of byShift) {
    shiftEmps.forEach((emp, i) => {
      const breakSlot = Math.floor(i / maxConcurrent)
      const pattern = (emp.work_patterns ?? null) as any
      const fixedOffDows = new Set<number>(
        (pattern?.off_days ?? ['Friday']).map((d: string) => DAY_NAME_TO_DOW[d.toLowerCase()] ?? 5)
      )
      const includesWeekends = pattern?.includes_weekends ?? false
      const isRotating = pattern?.off_type === 'rotating_weekly'

      for (const dateStr of allDays) {
        if (onLeave.has(`${emp.id}|${dateStr}`)) continue

        const dow = new Date(dateStr + 'T00:00:00').getDay()

        // Fixed off days (e.g. Friday)
        if (fixedOffDows.has(dow)) continue

        // If no work pattern or office-only: skip weekends
        if (!includesWeekends && (dow === 0 || dow === 6)) continue

        // Rotating off day check
        if (isRotating) {
          const weekMonday = getWeekMonday(dateStr)
          const rotDow = rotatingOffMap.get(`${emp.id}|${weekMonday}`)
          if (rotDow !== undefined && dow === rotDow) continue
        }

        entries.push({
          roster_id: roster.id,
          employee_id: emp.id,
          shift_id: shiftId,
          date: dateStr,
          break_ids: breakIds,
          break_slot: breakSlot,
        })
      }
    })
  }

  if (entries.length) await admin.from('roster_entries').insert(entries)

  revalidatePath('/roster')
  revalidatePath('/dashboard')
  revalidatePath('/me')
  revalidatePath('/me/schedule')
  return { success: true, rosterId: roster.id }
}

export async function publishRoster(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('rosters').update({ status: 'published' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/roster')
  revalidatePath('/dashboard')
  revalidatePath('/me')
  revalidatePath('/me/schedule')
  return { success: true }
}

export async function deleteRoster(id: string) {
  const admin = createAdminClient()
  await admin.from('rosters').delete().eq('id', id)
  revalidatePath('/roster')
  return { success: true }
}
