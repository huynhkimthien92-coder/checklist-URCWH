import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// ===== GET USERS FOR ASSIGNEE (SEARCH / SELECT) =====
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  // ✅ chỉ cần login (KHÔNG cần admin)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, name')   // ✅ chỉ lấy field cần cho dropdown
    .eq('active', true)   // ✅ chỉ user active
    .order('name', { ascending: true })

  if (error) {
    console.error('[USER SEARCH ERROR]', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
