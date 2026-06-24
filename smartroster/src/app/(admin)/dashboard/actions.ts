'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateRosterEntry({
  entryId, employeeId, date, status, shiftId, rosterId,
}: {
  entryId: string | null
  employeeId: string
  date: string
  status: 'work' | 'off'
  shiftId: string | null
  rosterId: string | null
}) {
  const admin = createAdminClient()

  if (status === 'off') {
    if (entryId) await admin.from('roster_entries').delete().eq('id', entryId)
  } else {
    if (entryId) {
      await admin.from('roster_entries').update({ shift_id: shiftId }).eq('id', entryId)
    } else if (rosterId && shiftId) {
      await admin.from('roster_entries').insert({
        roster_id: rosterId,
        employee_id: employeeId,
        date,
        shift_id: shiftId,
        break_slot: 0,
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/me')
  revalidatePath('/me/schedule')
  return { success: true }
}
