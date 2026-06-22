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
  const admin = createAdminClient()

  // Create auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  })
  if (authError) return { error: authError.message }

  // Create profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: authUser.user.id,
    org_id: formData.org_id,
    name: formData.name,
    email: formData.email,
    employee_number: formData.employee_number || null,
    role: 'employee',
    is_active: true,
  })
  if (profileError) return { error: profileError.message }

  revalidatePath('/employees')
  return { success: true }
}
