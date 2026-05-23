import { NextRequest, NextResponse } from 'next/server'
import { NextRequest } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const body = await req.json()

    const {
      form_id,
      role,
      user_id,
      user_name,
      signature_url,
      signed_by_role,   // ✅ optional
      signed_by_name    // ✅ optional
    } = body

    // ✅ 1. validate input
    if (!form_id || !role || !signature_url) {
      return NextResponse.json(
        { error: 'Missing required fields (form_id, role, signature_url)' },
        { status: 400 }
      )
    }

    const validRoles = ['driver', 'security', 'warehouse', 'approver']

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // ✅ validate signed_by_role (optional)
    const validActorRoles = ['operator', 'warehouse', 'driver', 'security', 'approver']
    if (signed_by_role && !validActorRoles.includes(signed_by_role)) {
      return NextResponse.json(
        { error: 'Invalid signed_by_role' },
        { status: 400 }
      )
    }

    // ✅ 2. check form tồn tại + status
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

    // ✅ block nếu đã approve
    if (form.status === 'approved') {
      return NextResponse.json(
        { error: 'Form already approved. Cannot sign.' },
        { status: 400 }
      )
    }

    // ✅ 3. UPSERT (1 form + 1 role)
    const payload = {
      form_id,
      role,
      user_id: user_id || null,
      user_name: user_name || null,
      signature_url,
      signed_by_role: signed_by_role || null,
      signed_by_name: signed_by_name || null,
      signed_at: new Date().toISOString()
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

    // ✅ 4. (optional) check signature progress
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
