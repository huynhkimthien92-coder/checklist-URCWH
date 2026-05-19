// app/api/robot-checklist/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

import {
  ROBOT_CHECKLIST_TEMPLATE,
  buildInitialRobotItems
} from '@/lib/robot-checklist-data'

export const dynamic = 'force-dynamic'

// ======================= POST (CREATE CHECKLIST) =======================
export async function POST(req: NextRequest) {

  // ✅ 1. AUTH
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()

    const {
      month,
      year,
      robot_number,
      robot_model,
      area
    } = body

    // ✅ 2. VALIDATE INPUT
    if (!month || !year || !robot_number) {
      return NextResponse.json(
        { error: 'Missing required fields: month, year, robot_number' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1-12' },
        { status: 400 }
      )
    }

    // ✅ 3. INIT SUPABASE
    const supabase = createServiceClient()

    // ✅ 4. CHECK DUPLICATE (1 robot / 1 tháng / 1 năm)
    const { data: existing, error: checkError } = await supabase
      .from('robot_checklists')
      .select('id')
      .eq('robot_number', robot_number)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (checkError) {
      console.error('Duplicate check error:', checkError)
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Checklist đã tồn tại cho robot/tháng/năm này' },
        { status: 400 }
      )
    }

    // ✅ 5. BUILD ITEMS (QUAN TRỌNG NHẤT)
    const items = buildInitialRobotItems(
      ROBOT_CHECKLIST_TEMPLATE,
      month,
      year
    )

    // ✅ 6. INSERT DB
    const { data, error } = await supabase
      .from('robot_checklists')
      .insert({
        month,
        year,
        robot_number,
        robot_model: robot_model || '',
        area: area || 'MROBOT',

        items, // ✅ SOURCE OF TRUTH

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
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (err: any) {
    console.error('CREATE CHECKLIST ERROR:', err)

    return NextResponse.json(
      { error: 'Failed to create checklist' },
      { status: 500 }
    )
  }
}
