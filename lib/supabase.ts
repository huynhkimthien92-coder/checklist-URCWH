import { createClient } from '@supabase/supabase-js'


// ✅ Client cho frontend
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  console.log('ENV DEBUG:', { url, key }) // ✅ thêm dòng này

  if (!url || !key) {
    throw new Error('Missing Supabase env variables')
  }

  return createClient(url, key)
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
