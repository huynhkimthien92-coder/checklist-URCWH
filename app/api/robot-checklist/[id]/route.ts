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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Checklist not found' },
      { status: 404 }
    )
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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const supabase = createServiceClient()

    // ✅ build payload có kiểm soát (TRÁNH overwrite lỗi)
    const payload: any = {
      updated_at: new Date().toISOString(),
    }

    // ✅ chỉ update field có gửi lên
    if (body.items !== undefined) {
      if (!Array.isArray(body.items)) {
        return NextResponse.json(
          { error: 'Invalid items format' },
          { status: 400 }
        )
      }
      payload.items = body.items
    }

    if (body.operator_signatures !== undefined) {
      payload.operator_signatures = body.operator_signatures
    }

    if (body.supervisor_signatures !== undefined) {
      payload.supervisor_signatures = body.supervisor_signatures
    }

    if (body.incidents !== undefined) {
      if (!Array.isArray(body.incidents)) {
        return NextResponse.json(
          { error: 'Invalid incidents format' },
          { status: 400 }
        )
      }
      payload.incidents = body.incidents
    }

    if (body.notes !== undefined) {
      payload.notes = body.notes
    }

    // ✅ status validation
    if (body.status !== undefined) {
      const allowedStatus = ['draft', 'submitted', 'reviewed', 'approved']
      if (!allowedStatus.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
      payload.status = body.status
    }

    // ✅ update DB
    const { data, error } = await supabase
      .from('robot_checklists')
      .update(payload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('PATCH ERROR:', error)

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (err: any) {
    console.error('PATCH FAILED:', err)

    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    )
  }
}
