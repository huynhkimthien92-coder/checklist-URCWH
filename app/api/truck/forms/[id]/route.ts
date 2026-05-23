import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient()

  try {
    const formId = params.id

    if (!formId) {
      return NextResponse.json(
        { error: 'Missing form id' },
        { status: 400 }
      )
    }

    // ✅ 1. load form
    const { data: form, error: formError } = await supabase
      .from('truck_exit_forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (formError) {
      throw new Error(formError.message)
    }

    // ✅ 2. load checklist + template
    const { data: items, error: itemError } = await supabase
      .from('truck_check_results')
      .select(`
        id,
        status,
        remark,
        template:truck_checklist_templates (
          id,
          label_vi,
          label_en,
          order_index
        )
      `)
      .eq('form_id', formId)
      .order('order_index', {
        foreignTable: 'truck_checklist_templates',
        ascending: true
      })

    if (itemError) {
      throw new Error(itemError.message)
    }

    // ✅ 3. load signatures
    const { data: signatures, error: signError } = await supabase
      .from('truck_signatures')
      .select('*')
      .eq('form_id', formId)

    if (signError) {
      throw new Error(signError.message)
    }

    // ✅ 4. format checklist
    const formattedItems = (items || []).map((item: any) => ({
      id: item.id,
      status: item.status,
      remark: item.remark,
      template_id: item.template?.id,
      label_vi: item.template?.label_vi,
      label_en: item.template?.label_en,
      order_index: item.template?.order_index
    }))

    // ✅ 5. map ARRAY → orders[]
    const orders = (form.invoice_nos || []).map((inv: string, index: number) => ({
      invoice_no: inv,
      quantity: form.quantities?.[index] || null,
      dock_no: form.dock_nos?.[index] || null,
      checked_by: form.checked_bys?.[index] || null
    }))

    // ✅ 6. group signature theo role
    const signatureMap: Record<string, any> = {
      driver: null,
      security: null,
      warehouse: null,
      approver: null
    }

    ;(signatures || []).forEach((s: any) => {
      signatureMap[s.role] = {
        id: s.id,
        user_id: s.user_id,
        user_name: s.user_name,

        // ✅ phục vụ case thực tế
        signed_by_name: s.signed_by_name || null,
        signed_by_role: s.signed_by_role || null,

        signature_url: s.signature_url,
        signed_at: s.signed_at
      }
    })

    // ✅ 7. response final
    return NextResponse.json({
      success: true,
      data: {
        id: form.id,
        form_no: form.form_no,
        date: form.date,
        truck_no: form.truck_no,
        truck_size: form.truck_size,
        driver_name: form.driver_name,
        customer_name: form.customer_name,
        status: form.status,
        remarks: form.remarks,

        // ✅ new structure
        orders,

        // ✅ checklist
        items: formattedItems,

        // ✅ signatures grouped
        signatures: signatureMap
      }
    })

  } catch (err: any) {
    console.error('[GET_TRUCK_FORM_ERROR]', err)

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
