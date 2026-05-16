// app/api/robot-checklist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { ROBOT_CHECKLIST_TEMPLATE, createEmptyRobotDayEntries, getDaysInMonth } from '@/lib/robot-checklist-data'

// GET /api/robot-checklist?month=5&year=2026
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year  = searchParams.get('year')

  const supabase = createServiceClient()
  let query = supabase
    .from('robot_checklists')
    .select('*, operator:users!robot_checklists_created_by_fkey(id,name,email,role)')
    .order('created_at', { ascending: false })

  if (month) query = query.eq('month', parseInt(month))
  if (year)  query = query.eq('year',  parseInt(year))

  const role = (session.user as any)?.role
  if (role === 'operator') {
    query = query.eq('created_by', (session.user as any).id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/robot-checklist — tạo mới
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { month, year, robot_number, area } = body

  if (!month || !year || !robot_number) {
    return NextResponse.json({ error: 'month, year, robot_number required' }, { status: 400 })
  }

  // Build day_entries: { "1": { r_01: {status:'',note:''}, ... }, "2": {...}, ... }
  const daysCount = getDaysInMonth(month, year)
  const day_entries: Record<string, Record<string, { status: string; note: string }>> = {}
  for (let d = 1; d <= daysCount; d++) {
    day_entries[String(d)] = createEmptyRobotDayEntries()
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('robot_checklists')
    .insert({
      month,
      year,
      area: area || 'MROBOT',
      robot_number,
      items: ROBOT_CHECKLIST_TEMPLATE,
      day_entries,
      operator_signatures: {},
      supervisor_signatures: {},
      incidents: [],
      notes: '',
      status: 'draft',
      created_by: (session.user as any).id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Checklist tháng này đã tồn tại cho robot này' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
