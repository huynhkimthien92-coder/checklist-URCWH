import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { generatePDFReport } from '@/lib/pdf-export'

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

  try {
    const buffer = await generatePDFReport(checklist)
    const filename = `XeNang_Tuan${checklist.week_number}_${checklist.year}_${checklist.forklift_number || 'xe'}.pdf`

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(buffer.length),
      }
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'PDF generation failed', details: String(err) }, { status: 500 })
  }
}
