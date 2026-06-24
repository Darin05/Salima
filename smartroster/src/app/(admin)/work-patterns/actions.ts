'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createWorkPattern(data: {
  name: string
  working_days: number
  off_type: string
  off_days: string[]
  includes_weekends: boolean
  max_off_per_day: number
  org_id: string
}) {
  const admin = createAdminClient()
  const { error } = await admin.from('work_patterns').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/work-patterns')
  return { success: true }
}

export async function deleteWorkPattern(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('work_patterns').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/work-patterns')
  return { success: true }
}
