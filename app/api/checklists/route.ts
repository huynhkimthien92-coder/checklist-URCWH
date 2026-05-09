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
  if (user.role === 'operator') {
    query = query.eq('created_by', user.id)
  }
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

  const supabase = createServiceClient()
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
