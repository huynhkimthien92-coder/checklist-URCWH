export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import PdfPrinter from 'pdfmake'
import { createServiceClient } from '@/lib/supabase'
import { DAYS, DAY_LABELS } from '@/data/checklist-template'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const checklistId = params.id

    // ✅ DÙNG CLIENT ĐÚNG
    const supabase = createServiceClient()

    const { data: checklist, error } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', checklistId)
      .single()

    if (error || !checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    const items = checklist.items
    const operatorSig = checklist.operator_signatures
    const supervisorSig = checklist.supervisor_signatures

    const fonts = {
      Roboto: {
        normal: `${process.cwd()}/fonts/Roboto-Regular.ttf`,
        bold: `${process.cwd()}/fonts/Roboto-Bold.ttf`,
      }
    }

    const printer = new PdfPrinter(fonts)

    const dayHeaderRow = [
      { text: 'Nội dung kiểm tra', bold: true, alignment: 'center' },
      ...DAYS.map(d => ({ text: DAY_LABELS[d], bold: true, alignment: 'center' }))
    ]

    const tableBody: any[] = []
    tableBody.push(dayHeaderRow)

    // ✅ convert async image
    for (const item of items) {
      const row: any[] = [
        { text: item.sub_label, margin: [2, 4] }
      ]

      for (const d of DAYS) {
        const cell = item.days[d]
        let lines: any[] = []

        if (cell.status) lines.push(cell.status)
        if (cell.detail) lines.push({ text: cell.detail, fontSize: 8 })

        // ✅ FIX IMAGE (URL → base64)
        if (cell.image_url) {
          try {
            const res = await fetch(cell.image_url)
            const buffer = await res.arrayBuffer()
            const base64 = Buffer.from(buffer).toString('base64')
            lines.push({
              image: `data:image/jpeg;base64,${base64}`,
              fit: [50, 50],
              margin: [0, 4, 0, 0]
            })
          } catch (err) {
            console.error('❌ Load image failed:', err)
          }
        }

        row.push({ stack: lines, alignment: 'center' })
      }

      tableBody.push(row)
    }

    // ✅ SIGNATURE
    tableBody.push([
      { text: 'Chữ ký tài xế', bold: true },
      ...DAYS.map(d => {
        const sig = operatorSig?.[d]?.data_url || operatorSig?.[d]
        return sig ? { image: sig, fit: [60, 40] } : { text: '' }
      })
    ])

    tableBody.push([
      { text: 'Chữ ký giám sát', bold: true },
      ...DAYS.map(d => {
        const sig = supervisorSig?.[d]?.data_url || supervisorSig?.[d]
        return sig ? { image: sig, fit: [60, 40] } : { text: '' }
      })
    ])

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [10, 10, 10, 10],
      content: [
        { text: 'URC — Forklift Daily Safety Checklist', bold: true, fontSize: 16, alignment: 'center' },

        {
          columns: [
            `Model: ${checklist.forklift_model}`,
            `Serial: ${checklist.forklift_serial}`,
            `Xe số: ${checklist.forklift_number}`
          ],
          margin: [0, 10]
        },

        {
          table: {
            headerRows: 1,
            widths: ['*', ...Array(7).fill('auto')],
            body: tableBody
          }
        },

        { text: '\nGhi chú:', bold: true },
        { text: checklist.notes || 'Không có' }
      ]
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinition)

    const chunks: Uint8Array[] = []
    pdfDoc.on('data', (chunk: Uint8Array) => chunks.push(chunk))

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.end()
    })

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="checklist.pdf"',
      }
    })

  } catch (err: any) {
    console.error('PDF ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
