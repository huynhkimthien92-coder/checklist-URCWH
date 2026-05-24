import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const { searchParams } = new URL(req.url)

    let truck_no = searchParams.get('truck_no')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const limit = Number(searchParams.get('limit') || 10)

    if (!truck_no) {
      return NextResponse.json(
        { error: 'Missing truck_no' },
        { status: 400 }
      )
    }

    truck_no = truck_no.trim().toUpperCase()

    // ✅ fuzzy search (ILIKE)
    let query = supabase
      .from('truck_exit_forms')
      .select('*')
      .ilike('truck_no', `%${truck_no}%`) // 🔥 fuzzy
      .order('created_at', { ascending: false })
      .limit(limit)

    // ✅ filter status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // ✅ filter date
    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No forms found',
        data: []
      })
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      data
    })

  } catch (err: any) {
    console.error('[SEARCH_TRUCK_FORM_ERROR]', err)

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
