'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function requestLeave(data: { employee_id: string; org_id: string; type: string; start_date: string; end_date: string; notes: string }) {
  const admin = createAdminClient()
  const { error } = await admin.from('leave_requests').insert({ ...data, status: 'pending' })
  if (error) return { error: error.message }
  revalidatePath('/me/leave')
  return { success: true }
}
