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

// For contact-center (Sat–Fri) patterns: find the Saturday that starts the week
function getWeekSaturday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 6 ? 0 : dow + 1))
  return d.toISOString().split('T')[0]
}

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Sat-based week sequence number (weeks since a fixed Saturday epoch)
function getSatWeekNumber(satDateStr: string): number {
  const d = new Date(satDateStr + 'T00:00:00')
  const epoch = new Date('2023-12-30T00:00:00') // a known Saturday
  return Math.round((d.getTime() - epoch.getTime()) / (7 * 24 * 60 * 60 * 1000))
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
    // Use original weekStart (passed as YYYY-MM-01) to get the month,
    // not monday — toMonday() can shift July 1 → June 29, causing wrong month.
    const [year, month] = weekStart.split('-').map(Number)
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

  // Pre-compute rotating off day per employee per week.
  // Contact-center patterns (includes_weekends) use Sat-Fri weeks to avoid
  // two rotating offs appearing in the same Sat-Fri operational week.
  // Office patterns use Mon-Sun (ISO) weeks.
  const rotatingOffMap = new Map<string, number>() // key: `${empId}|${weekStart}` → DOW off

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

    // Pool of days the rotating off can fall on
    const allDows = [0, 1, 2, 3, 4, 5, 6]
    const excluded = new Set<number>(fixedOffDows)
    if (!includesWeekends) { excluded.add(0); excluded.add(6) }
    // Exclude days adjacent to any fixed-off day to prevent 3-day streaks
    // e.g. Friday fixed → exclude Thursday (before) and Saturday (after)
    for (const fixedDow of fixedOffDows) {
      excluded.add((fixedDow + 6) % 7) // day before fixed off
      excluded.add((fixedDow + 1) % 7) // day after fixed off
    }
    const pool = allDows.filter(d => !excluded.has(d))

    if (pool.length === 0) continue

    // Build set of operational week-start dates for this pattern
    const weekStartFn = includesWeekends ? getWeekSaturday : getWeekMonday
    const weekNumFn = includesWeekends ? getSatWeekNumber : getISOWeek
    const weekStartSet = new Set<string>()
    for (const d of allDays) weekStartSet.add(weekStartFn(d))

    for (const weekStart of weekStartSet) {
      const weekNum = weekNumFn(weekStart)
      group.forEach((emp, i) => {
        const slot = (Math.floor(i / maxOffPerDay) + weekNum) % pool.length
        rotatingOffMap.set(`${emp.id}|${weekStart}`, pool[slot])
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

        // Rotating off day check — use the same week-start as was stored in rotatingOffMap
        if (isRotating) {
          const weekStart = includesWeekends ? getWeekSaturday(dateStr) : getWeekMonday(dateStr)
          const rotDow = rotatingOffMap.get(`${emp.id}|${weekStart}`)
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
