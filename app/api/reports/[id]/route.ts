import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { generateExcelReport } from '@/lib/excel-export'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: checklist, error } = await supabase
    .from('checklists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !checklist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = generateExcelReport(checklist)
  const filename = `XeNang_Tuan${checklist.week_number}_${checklist.year}_${checklist.forklift_number || 'xe'}.xlsx`

  return new NextResponse(buffer as unknown as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}
