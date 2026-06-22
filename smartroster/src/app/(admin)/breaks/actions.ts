'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createBreak(data: { name: string; break_time: string; max_concurrent: number; org_id: string }) {
  const admin = createAdminClient()
  const { error } = await admin.from('break_rules').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/breaks')
  return { success: true }
}
