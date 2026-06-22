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
