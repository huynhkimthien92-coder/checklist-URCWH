export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import PdfPrinter from 'pdfmake'
import { createClient } from '@supabase/supabase-js'
import fs from "fs";
import path from "path";
import { DAYS, DAY_LABELS } from '@/data/checklist-template'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const checklistId = params.id

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Lấy checklist từ Supabase
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

  // 2. Font cho pdfmake
  const fonts = {
    Roboto: {
      normal: `${process.cwd()}/fonts/Roboto-Regular.ttf`,
      bold: `${process.cwd()}/fonts/Roboto-Bold.ttf`,
    }
  }

  const printer = new PdfPrinter(fonts)

  // 3. Tạo header cột ngày
  const dayHeaderRow = [
    { text: 'Nội dung kiểm tra', bold: true, alignment: 'center' },
    ...DAYS.map(d => ({ text: DAY_LABELS[d], bold: true, alignment: 'center' }))
  ]

  // 4. Tạo bảng checklist
  const tableBody: any[] = []
  tableBody.push(dayHeaderRow)

  for (const item of items) {
    tableBody.push([
      { text: item.sub_label, margin: [2, 4] },

      ...DAYS.map(d => {
        const cell = item.days[d]

        let lines: any[] = []

        if (cell.status) lines.push(cell.status)          // √ hoặc X
        if (cell.detail) lines.push({ text: cell.detail, fontSize: 8 })

        if (cell.image_url) {
          const base64 = cell.image_url.replace(/^data:image\/\w+;base64,/, '')
          lines.push({
            image: `data:image/png;base64,${base64}`,
            fit: [50, 50],
            margin: [0, 4, 0, 0]
          })
        }

        return { stack: lines, alignment: 'center' }
      })
    ])
  }

  // 5. Thêm dòng chữ ký (từng ngày)
  tableBody.push([
    { text: 'Chữ ký tài xế', bold: true, alignment: 'center' },
    ...DAYS.map(d => {
      const sig = operatorSig?.[d]
      return sig
        ? { image: sig, fit: [60, 40], alignment: 'center' }
        : { text: '', alignment: 'center' }
    })
  ])

  tableBody.push([
    { text: 'Chữ ký giám sát', bold: true, alignment: 'center' },
    ...DAYS.map(d => {
      const sig = supervisorSig?.[d]
      return sig
        ? { image: sig, fit: [60, 40], alignment: 'center' }
        : { text: '', alignment: 'center' }
    })
  ])

  // 6. PDF Definition
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [10, 10, 10, 10],

    content: [
      { text: 'URC — Forklift Daily Safety Checklist', style: 'title', alignment: 'center' },
      {
        columns: [
          `Model: ${checklist.forklift_model}`,
          `Serial: ${checklist.forklift_serial}`,
          `Xe số: ${checklist.forklift_number}`
        ],
        margin: [0, 10, 0, 10]
      },

      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      },

      { text: '\nGhi chú:', bold: true },
      { text: checklist.notes || 'Không có', fontSize: 10 },
    ],

    styles: {
      title: { fontSize: 16, bold: true },
    },
  }

  // 7. Tạo buffer PDF
  const pdfDoc = printer.createPdfKitDocument(docDefinition)

  const chunks: Uint8Array[] = []
  pdfDoc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
  pdfDoc.on('end', () => {})

  pdfDoc.end()

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
  pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
  });


  return new NextResponse(new Uint8Array(pdfBuffer), {
  status: 200,
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="checklist.pdf"',
  },
  })
}
