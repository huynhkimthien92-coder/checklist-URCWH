import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// ✅ ROLE MAP — business logic thật
const ROLE_MAP: Record<string, string[]> = {
  operator: ['driver', 'warehouse', 'security'],
  supervisor: ['approver'],
  admin: ['driver', 'warehouse', 'security', 'approver'],
}

// ─────────────────────────────────────────────────────
// ✅ DELETE SIGNATURE
// ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const { form_id, role, user_id } = await req.json()

    if (!form_id || !role) {
      return NextResponse.json(
        { error: 'Missing form_id or role' },
        { status: 400 }
      )
    }

    // ✅ check form
    const { data: form } = await supabase
      .from('truck_exit_forms')
      .select('status')
      .eq('id', form_id)
      .single()

    if (form?.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot modify approved form' },
        { status: 400 }
      )
    }

    // ✅ (optional) check user role trước khi xóa
    if (user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', user_id)
        .single()

      if (!user || !ROLE_MAP[user.role]?.includes(role)) {
        return NextResponse.json(
          { error: 'You are not allowed to remove this signature' },
          { status: 403 }
        )
      }
    }

    await supabase
      .from('truck_signatures')
      .delete()
      .eq('form_id', form_id)
      .eq('role', role)

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[DELETE_SIGNATURE_ERROR]', err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────
// ✅ CREATE / UPDATE SIGNATURE (UPSERT)
// ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const body = await req.json()

    const {
      form_id,
      role,                // ✅ role của form (driver / warehouse / approver)
      user_id,
      user_name,
      signature_url,
      signed_by_role,      // ✅ role user (operator / supervisor)
      signed_by_name
    } = body

    // ✅ 1. validate input
    if (!form_id || !role || !signature_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validRoles = ['driver', 'warehouse', 'security', 'approver']

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // ✅ 2. lấy role thật từ DB (không tin FE)
    let userRole: string | null = null

    if (user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', user_id)
        .single()

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      userRole = user.role
    }

    // ✅ fallback nếu chưa truyền user_id
    if (!userRole) {
      userRole = signed_by_role || null
    }

    // ✅ 3. validate quyền ký
    if (!userRole || !ROLE_MAP[userRole]?.includes(role)) {
      return NextResponse.json(
        { error: 'You are not allowed to sign this role' },
        { status: 403 }
      )
    }

    // ✅ 4. check form tồn tại
    const { data: form, error: formError } = await supabase
      .from('truck_exit_forms')
      .select('id, status')
      .eq('id', form_id)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // ✅ block approved
    if (form.status === 'approved') {
      return NextResponse.json(
        { error: 'Form already approved. Cannot sign.' },
        { status: 400 }
      )
    }

    // ✅ 5. UPSERT
    const payload = {
      form_id,
      role,
      user_id: user_id || null,
      user_name: user_name || null,

      signature_url,

      // ✅ IMPORTANT: lưu role thật của người ký
      signed_by_role: userRole,
      signed_by_name: signed_by_name || user_name || null,

      signed_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('truck_signatures')
      .upsert([payload], {
        onConflict: 'form_id,role'
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // ✅ 6. progress
    const { data: allSigns } = await supabase
      .from('truck_signatures')
      .select('role')
      .eq('form_id', form_id)

    const signedRoles = (allSigns || []).map(s => s.role)

    return NextResponse.json({
      success: true,
      data,
      meta: {
        signed_roles: signedRoles,
        total_signed: signedRoles.length
      }
    })

  } catch (err: any) {
    console.error('[SIGN_TRUCK_FORM_ERROR]', err)

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
