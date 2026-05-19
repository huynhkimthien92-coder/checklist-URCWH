// app/api/robot-checklist/[id]/pdf/route.ts

export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { generateRobotPDFReport } from '@/lib/robot-pdf-export'

// ======================= GET PDF =======================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {

  // ✅ 1. AUTH
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const supabase = createServiceClient()

    // ✅ 2. FETCH CHECKLIST
    const { data, error } = await supabase
      .from('robot_checklists')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      )
    }

    // ✅ 3. GENERATE PDF
    const pdfBuffer = await generateRobotPDFReport(data)

    // ✅ 4. FILE NAME
    const filename = `robot_${data.robot_number}_${data.month}_${data.year}.pdf`

    // ✅ 5. RETURN FILE
    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      },
    })

  } catch (err: any) {
    console.error('PDF ERROR:', err)

    return NextResponse.json(
      {
        error: 'PDF generation failed',
        message: err?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
``
