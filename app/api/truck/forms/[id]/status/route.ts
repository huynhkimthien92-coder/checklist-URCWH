import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient()

  try {
    const formId = params.id
    const body = await req.json()

    const { status } = body

    // ✅ validate input
    if (!formId) {
      return NextResponse.json(
        { error: 'Missing form id' },
        { status: 400 }
      )
    }

    const validStatus = ['draft', 'submitted', 'approved']

    if (!validStatus.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // ✅ 1. load current form
    const { data: form, error: formError } = await supabase
      .from('truck_exit_forms')
      .select('status')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // ✅ không cho sửa nếu đã approved
    if (form.status === 'approved') {
      return NextResponse.json(
        { error: 'Form already approved' },
        { status: 400 }
      )
    }

    // ✅ 2. VALIDATION KHI APPROVE
    if (status === 'approved') {

      // ✅ 2.1 kiểm tra checklist fail
      const { data: fails } = await supabase
        .from('truck_check_results')
        .select('id')
        .eq('form_id', formId)
        .eq('status', 'fail')

      if ((fails || []).length > 0) {
        return NextResponse.json(
          { error: 'Cannot approve: checklist has failed items' },
          { status: 400 }
        )
      }

      // ✅ 2.2 kiểm tra chữ ký (KHÔNG cần security)
      const requiredRoles = ['driver', 'warehouse', 'approver']

      const { data: signatures } = await supabase
        .from('truck_signatures')
        .select('role')
        .eq('form_id', formId)

      const signedRoles = (signatures || []).map(s => s.role)

      const missingRoles = requiredRoles.filter(
        r => !signedRoles.includes(r)
      )

      if (missingRoles.length > 0) {
        return NextResponse.json(
          {
            error: 'Missing required signatures',
            missing: missingRoles
          },
          { status: 400 }
        )
      }
    }

    // ✅ 3. UPDATE STATUS
    const { data, error } = await supabase
      .from('truck_exit_forms')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (err: any) {
    console.error('[UPDATE_FORM_STATUS_ERROR]', err)

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
