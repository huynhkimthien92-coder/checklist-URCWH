/**
 * /app/api/issues/route.ts
 * CRUD LIST + CREATE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

async function getPermissions(supabase, userId: string) {
  const { data } = await supabase
    .from('issue_permissions')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = (session.user as any)?.role
  const supabase = createServiceClient()

  // ✅ chỉ check permission nếu KHÔNG phải admin
  if (userRole !== 'admin') {
    const perm = await getPermissions(supabase, session.user.id)

    if (!perm?.can_view) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // ✅ chạy query cho ALL user (kể cả admin)
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = (session.user as any)?.role
  const supabase = createServiceClient()

  // ✅ CHỈ CHECK PERMISSION nếu KHÔNG phải admin
  if (userRole !== 'admin') {
    const perm = await getPermissions(supabase, session.user.id)

    if (!perm?.can_create) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await req.json()

  const {
    title,
    description,
    image_before,
    priority,
    due_date,
    assigned_to,
    x_percent,
    y_percent
  } = body

  if (!title || !image_before) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('issues')
    .insert({
      title,
      description,
      image_before,
      priority,
      due_date,
      assigned_to,
      x_percent,
      y_percent,
      created_by: session.user.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
