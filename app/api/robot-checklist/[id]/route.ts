// app/api/robot-checklist/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ======================= GET =======================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// ======================= PATCH =======================
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const supabase = createServiceClient()

  // ✅ chỉ update field cần thiết (giống xe nâng)
  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  }

  if (body.items !== undefined) {
    updatePayload.items = body.items
  }

  if (body.operator_signatures !== undefined) {
    updatePayload.operator_signatures = body.operator_signatures
  }

  if (body.supervisor_signatures !== undefined) {
    updatePayload.supervisor_signatures = body.supervisor_signatures
  }

  if (body.incidents !== undefined) {
    updatePayload.incidents = body.incidents
  }

  if (body.notes !== undefined) {
    updatePayload.notes = body.notes
  }

  if (body.status !== undefined) {
    updatePayload.status = body.status
  }

  const { data, error } = await supabase
    .from('robot_checklists')
    .update(updatePayload)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
