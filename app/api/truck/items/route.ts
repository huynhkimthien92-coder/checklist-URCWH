import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const body = await req.json()

    const { items } = body

    // ✅ validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    // ✅ check status hợp lệ
    const validStatus = ['pass', 'fail', null]

    for (const item of items) {
      if (!item.id) {
        return NextResponse.json(
          { error: 'Each item must have id' },
          { status: 400 }
        )
      }

      if (!validStatus.includes(item.status)) {
        return NextResponse.json(
          { error: `Invalid status for item ${item.id}` },
          { status: 400 }
        )
      }
    }

    // ✅ 1. update từng item (parallel)
    const now = new Date().toISOString()

    const updates = items.map((item) =>
      supabase
        .from('truck_check_results')
        .update({
          status: item.status,
          remark: item.remark || '',
          updated_at: now
        })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)

    // ✅ check error
    for (const r of results) {
      if (r.error) {
        throw new Error(r.error.message)
      }
    }

    // ✅ 2. AUTO DETECT FAIL

    // lấy form_id từ item đầu tiên
    const { data: firstItem } = await supabase
      .from('truck_check_results')
      .select('form_id')
      .eq('id', items[0].id)
      .single()

    const formId = firstItem?.form_id

    let failCount = 0

    if (formId) {
      const { data: fails } = await supabase
        .from('truck_check_results')
        .select('id')
        .eq('form_id', formId)
        .eq('status', 'fail')

      failCount = fails?.length || 0
    }

    return NextResponse.json({
      success: true,
      message: 'Items updated successfully',
      meta: {
        fail_count: failCount,
        has_fail: failCount > 0
      }
    })

  } catch (err: any) {
    console.error('[BULK_UPDATE_CHECKLIST_ERROR]', err)

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
