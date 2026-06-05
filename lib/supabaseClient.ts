import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Use only on the server (do NOT expose SERVICE_ROLE_KEY to the client)
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return createClient(url, serviceRole)
}
