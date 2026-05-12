import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { buildDefaultChecklist } from '@/lib/checklist-data'
import { getCurrentWeek } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const user = session.user as any
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('checklists')
    .select('*, operator:users!checklists_created_by_fkey(id,name,email,role)')
    .order('created_at', { ascending: false })

  // Operators chỉ xem checklist của mình
  //if (user.role === 'operator') {
    //query = query.eq('created_by', user.id)
  //}
  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'operator' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { week, year } = getCurrentWeek()

  // Validate required field: forklift_number
  if (!body.forklift_number || body.forklift_number.trim() === '') {
    return NextResponse.json(
      { error: 'Vui lòng nhập số xe (Xe số)' },
      { status: 400 }
    )
  }
  const supabase = createServiceClient()
  // 🔍 STEP 1: Kiểm tra xem đã tồn tại checklist cho xe này trong tuần chưa
  const checkWeek = body.week_number || week
  const checkYear = body.year || year
  const forkLiftNumber = body.forklift_number.trim()
  const { data: existingChecklist, error: checkError } = await supabase
    .from('checklists')
    .select('id, status, created_at', { count: 'exact' })
    .eq('forklift_number', forkLiftNumber)
    .eq('week_number', checkWeek)
    .eq('year', checkYear)
  // Nếu có lỗi không phải "not found"
  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Database check error:', checkError)
    return NextResponse.json(
      { error: 'Lỗi kiểm tra database' },
      { status: 500 }
    )
  }
  // Nếu tồn tại checklist rồi
  if (existingChecklist && existingChecklist.length > 0) {
    const existing = existingChecklist[0]
    return NextResponse.json(
      {
        error: `Xe ${forkLiftNumber} đã có checklist tuần ${checkWeek}/${checkYear} rồi (Trạng thái: ${existing.status})`,
        code: 'DUPLICATE_CHECKLIST',
        existingId: existing.id,
        existingStatus: existing.status,
      },
      { status: 409 } // Conflict
    )
  }
  
  //  Tạo checklist mới

  const { data, error } = await supabase
    .from('checklists')
    .insert({
      week_number: body.week_number || week,
      year: body.year || year,
      forklift_model: body.forklift_model || '',
      forklift_serial: body.forklift_serial || '',
      forklift_number: body.forklift_number || '',
      shift: body.shift || '1',
      items: buildDefaultChecklist(),
      operator_signatures: {},
      supervisor_signatures: {},
      notes: '',
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single()

  if (error){
    // Xử lý lỗi constraint UNIQUE (nếu có, từ database constraint)
    if (error.code === '23505') {
      console.error('Unique constraint violation:', error)
      return NextResponse.json(
        {
          error: `Xe ${forkLiftNumber} đã có checklist tuần ${checkWeek}/${checkYear}`,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        },
        { status: 409 }
      )
    }
    console.error('Create checklist error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  return NextResponse.json(data, { status: 201 })
}
