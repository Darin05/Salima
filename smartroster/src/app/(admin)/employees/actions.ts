'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createEmployee(formData: {
  name: string
  email: string
  employee_number: string
  password: string
  org_id: string
}) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Server config missing: SUPABASE_SERVICE_ROLE_KEY not set in Vercel' }
  }

  const admin = createAdminClient()

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  })
  if (authError) return { error: `Auth error: ${authError.message}` }

  const { error: profileError } = await admin.from('profiles').insert({
    id: authUser.user.id,
    org_id: formData.org_id,
    name: formData.name,
    email: formData.email,
    employee_number: formData.employee_number || null,
    role: 'employee',
    is_active: true,
  })
  if (profileError) return { error: `Profile error: ${profileError.message}` }

  revalidatePath('/employees')
  return { success: true }
}

export async function updateEmployee(id: string, data: { name: string; team_id: string | null; shift_id: string | null; work_pattern_id?: string | null }) {
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/employees')
  return { success: true }
}

export async function toggleEmployee(id: string, isActive: boolean) {
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ is_active: !isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/employees')
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const admin = createAdminClient()
  await admin.from('profiles').delete().eq('id', id)
  await admin.auth.admin.deleteUser(id)
  revalidatePath('/employees')
  return { success: true }
}
