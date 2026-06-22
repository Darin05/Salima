'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createShift(data: { name: string; start_time: string; end_time: string; color: string; org_id: string }) {
  const admin = createAdminClient()
  const { error } = await admin.from('shifts').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/shifts')
  return { success: true }
}
