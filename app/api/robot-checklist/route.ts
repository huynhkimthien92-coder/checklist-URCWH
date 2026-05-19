//app/api/robot-checklist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

import {
  ROBOT_CHECKLIST_TEMPLATE,
  buildInitialRobotItems
} from '@/lib/robot-checklist-data'

export const dynamic = 'force-dynamic'

// ======================= ✅ GET =======================
export async function GET() {

  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

// ======================= ✅ POST =======================
export async function POST(req: NextRequest) {

  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()

    const { month, year, robot_number, robot_model, area } = body

    if (!month || !year || !robot_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // check duplicate
    const { data: existing } = await supabase
      .from('robot_checklists')
      .select('id')
      .eq('robot_number', robot_number)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Checklist đã tồn tại' },
        { status: 409 }
      )
    }

    const items = buildInitialRobotItems(
      ROBOT_CHECKLIST_TEMPLATE,
      month,
      year
    )

    const { data, error } = await supabase
      .from('robot_checklists')
      .insert({
        month,
        year,
        robot_number,
        robot_model: robot_model || '',
        area: area || 'MROBOT',

        items,
        operator_signatures: {},
        supervisor_signatures: {},
        incidents: [],
        notes: '',
        status: 'draft',

        created_by: (session.user as any)?.id || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (err) {
    return NextResponse.json(
      { error: 'Create failed' },
      { status: 500 }
    )
  }
}
