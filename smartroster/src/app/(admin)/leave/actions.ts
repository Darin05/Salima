'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateLeaveStatus(id: string, status: 'approved' | 'rejected') {
  const admin = createAdminClient()
  const { error } = await admin.from('leave_requests').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/leave')
  return { success: true }
}

export async function adminAddLeave(data: { employee_id: string; start_date: string; end_date: string; type: string; org_id: string }) {
  const admin = createAdminClient()
  const { error } = await admin.from('leave_requests').insert({ ...data, status: 'approved' })
  if (error) return { error: error.message }
  revalidatePath('/leave')
  return { success: true }
}

export async function removeLeave(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('leave_requests').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/leave')
  return { success: true }
}
