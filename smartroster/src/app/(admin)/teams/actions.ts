'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createTeam(name: string, orgId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('teams').insert({ name, org_id: orgId })
  if (error) return { error: error.message }
  revalidatePath('/teams')
  return { success: true }
}

export async function deleteTeam(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('teams').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/teams')
  return { success: true }
}
