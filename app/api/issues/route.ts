/**
 * /app/api/issues/route.ts
 * CRUD LIST + CREATE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {

  const supabase = createServiceClient()

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

  const body = await req.json()

  const {
    id,
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

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('issues')
    .insert({
      id,
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
