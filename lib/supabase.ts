import { createClient } from '@supabase/supabase-js'


// ✅ Client cho frontend

let browserClient: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (browserClient) return browserClient 

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase env variables')
  }

  browserClient = createClient(url, key)
  return browserClient
}



// ✅ Client cho server
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service env variables')
  }

  return createClient(url, key)
}
