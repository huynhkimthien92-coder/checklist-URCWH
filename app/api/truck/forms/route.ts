import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const body = await req.json()

    // ✅ validate basic
    if (!body.truck_no || !body.driver_name) {
      return NextResponse.json(
        { error: 'Missing truck_no or driver_name' },
        { status: 400 }
      )
    }

    // ✅ extract orders
    const orders = Array.isArray(body.orders) ? body.orders : []

    // ✅ mapping orders → arrays
    const invoice_nos = orders.map((o: any) => (o.invoice_no || '').trim())
    const quantities = orders.map((o: any) => o.quantity ?? null)
    const dock_nos = orders.map((o: any) => (o.dock_no || '').trim())
    const checked_bys = orders.map((o: any) => (o.checked_by || '').trim())

    // ✅ validate length consistency
    if (
      invoice_nos.length !== quantities.length ||
      invoice_nos.length !== dock_nos.length ||
      invoice_nos.length !== checked_bys.length
    ) {
      return NextResponse.json(
        { error: 'Orders data mismatch' },
        { status: 400 }
      )
    }

    // ✅ create form
    const { data: form, error: formError } = await supabase
      .from('truck_exit_forms')
      .insert([
        {
          date: body.date || new Date().toISOString().slice(0, 10),
          customer_name: body.customer_name || '',
          description: body.description || '',
          truck_no: body.truck_no,
          truck_size: body.truck_size || '',
          driver_name: body.driver_name,
          net_weight: body.net_weight || null,

          // ✅ NEW ARRAY FIELDS
          invoice_nos,
          quantities,
          dock_nos,
          checked_bys,

          status: 'draft',
          created_by: body.user_id || null
        }
      ])
      .select()
      .single()

    if (formError) {
      throw new Error(formError.message)
    }

    // ✅ load checklist templates
    const { data: templates, error: templateError } = await supabase
      .from('truck_checklist_templates')
      .select('id')

    if (templateError) {
      throw new Error(templateError.message)
    }

    if (!templates || templates.length === 0) {
      throw new Error('No checklist templates found')
    }

    // ✅ generate checklist
    const rows = templates.map((t) => ({
      form_id: form.id,
      template_id: t.id,
      status: null,
      remark: ''
    }))

    const { error: insertError } = await supabase
      .from('truck_check_results')
      .insert(rows)

    if (insertError) {
      throw new Error(insertError.message)
    }

    return NextResponse.json({
      success: true,
      data: form
    })

  } catch (err: any) {
    console.error('[CREATE_TRUCK_FORM_ERROR]', err)

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
