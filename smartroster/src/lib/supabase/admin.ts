import { createServerClient } from '@supabase/ssr'

// Service role client — bypasses RLS for admin server components
export const createAdminClient = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
