import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// ─── GET ──────────────────────────────────────────────────────────────────────
// (existing GET handler — không thay đổi)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient()
  try {
    const formId = params.id
    if (!formId) {
      return NextResponse.json({ error: 'Missing form id' }, { status: 400 })
    }

    const { data: form, error: formError } = await supabase
      .from('truck_exit_forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (formError) throw new Error(formError.message)

    const { data: items, error: itemError } = await supabase
      .from('truck_check_results')
      .select(`
        id, status, remark,
        template:truck_checklist_templates (
          id, label_vi, label_en, order_index
        )
      `)
      .eq('form_id', formId)
      .order('order_index', { foreignTable: 'truck_checklist_templates', ascending: true })

    if (itemError) throw new Error(itemError.message)

    const { data: signatures, error: signError } = await supabase
      .from('truck_signatures')
      .select('*')
      .eq('form_id', formId)

    if (signError) throw new Error(signError.message)

    const formattedItems = (items || []).map((item: any) => ({
      id:          item.id,
      status:      item.status,
      remark:      item.remark,
      template_id: item.template?.id,
      label_vi:    item.template?.label_vi,
      label_en:    item.template?.label_en,
      order_index: item.template?.order_index,
    }))

    const orders = (form.invoice_nos || []).map((inv: string, index: number) => ({
      invoice_no: inv,
      quantity:   form.quantities?.[index]  ?? null,
      dock_no:    form.dock_nos?.[index]    ?? null,
      checked_by: form.checked_bys?.[index] ?? null,
    }))

    const signatureMap: Record<string, any> = {
      driver: null, security: null, warehouse: null, approver: null,
    }
    ;(signatures || []).forEach((s: any) => {
      signatureMap[s.role] = {
        id:              s.id,
        user_id:         s.user_id,
        user_name:       s.user_name,
        signed_by_name:  s.signed_by_name  || null,
        signed_by_role:  s.signed_by_role  || null,
        signature_url:   s.signature_url,
        signed_at:       s.signed_at,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id:                 form.id,
        form_no:            form.form_no,
        date:               form.date,
        truck_no:           form.truck_no,
        truck_size:         form.truck_size,
        driver_name:        form.driver_name,
        customer_name:      form.customer_name,
        description:        form.description,
        net_weight:         form.net_weight,
        remarks:            form.remarks,
        start_loading_time: form.start_loading_time,
        end_loading_time:   form.end_loading_time,
        status:             form.status,
        orders,
        items:              formattedItems,
        signatures:         signatureMap,
      },
    })
  } catch (err: any) {
    console.error('[GET_TRUCK_FORM_ERROR]', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
// Updates editable fields + orders arrays. Cannot edit if already approved.

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient()
  try {
    const formId = params.id
    if (!formId) {
      return NextResponse.json({ error: 'Missing form id' }, { status: 400 })
    }

    // ✅ Check current status — không cho sửa nếu đã approved
    const { data: current, error: fetchError } = await supabase
      .from('truck_exit_forms')
      .select('status')
      .eq('id', formId)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (current.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot edit an approved form' },
        { status: 400 }
      )
    }

    const body = await req.json()

    // ✅ Chỉ lấy các field được phép update — không cho update status, form_no, truck_no, driver_name ở đây
    const allowedFields: Record<string, unknown> = {}

    if (body.customer_name      !== undefined) allowedFields.customer_name      = body.customer_name
    if (body.description        !== undefined) allowedFields.description        = body.description
    if (body.truck_size         !== undefined) allowedFields.truck_size         = body.truck_size
    if (body.net_weight         !== undefined) allowedFields.net_weight         = body.net_weight ?? null
    if (body.remarks            !== undefined) allowedFields.remarks            = body.remarks
    if (body.start_loading_time !== undefined) allowedFields.start_loading_time = body.start_loading_time ?? null
    if (body.end_loading_time   !== undefined) allowedFields.end_loading_time   = body.end_loading_time   ?? null

    // ✅ Orders — lưu dưới dạng parallel arrays
    if (Array.isArray(body.invoice_nos)) {
      allowedFields.invoice_nos = body.invoice_nos
      allowedFields.quantities  = Array.isArray(body.quantities)  ? body.quantities  : []
      allowedFields.dock_nos    = Array.isArray(body.dock_nos)    ? body.dock_nos    : []
      allowedFields.checked_bys = Array.isArray(body.checked_bys) ? body.checked_bys : []
    }

    allowedFields.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('truck_exit_forms')
      .update(allowedFields)
      .eq('id', formId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('[PATCH_TRUCK_FORM_ERROR]', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
