/**
 * /app/api/issues/[id]/route.ts
 * UPDATE + DELETE issue 5S
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// ===== PATCH (UPDATE ISSUE) =====
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  // ✅ FIX CHUẨN (check user)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const issueId = params.id

  const body = await req.json()

  const supabase = createServiceClient()

  // ✅ Validate status
  const allowedStatus = ['open', 'in_progress', 'done']
  if (body.status && !allowedStatus.includes(body.status)) {
    return NextResponse.json(
      { error: 'Invalid status' },
      { status: 400 }
    )
  }

  // ✅ Prepare update data
  const updateData: Record<string, any> = {
    ...body,
    updated_at: new Date().toISOString(),
    updated_by: userId
  }

  // ✅ Auto fill when done
  if (body.status === 'done') {
    updateData.closed_at = new Date().toISOString()
    updateData.completed_by = userId
  }

  try {
    const { data, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select()
      .single()

    if (error) {
      console.error('[UPDATE ISSUE]', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (err: any) {
    console.error('[PATCH ISSUE ERROR]', err)
    return NextResponse.json(
      { error: err.message || 'Update failed' },
      { status: 500 }
    )
  }
}

// ===== DELETE ISSUE =====
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  // ✅ FIX CHUẨN (check user)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const issueId = params.id
  const supabase = createServiceClient()

  try {
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId)

    if (error) {
      console.error('[DELETE ISSUE]', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[DELETE ISSUE ERROR]', err)
    return NextResponse.json(
      { error: err.message || 'Delete failed' },
      { status: 500 }
    )
  }
}
