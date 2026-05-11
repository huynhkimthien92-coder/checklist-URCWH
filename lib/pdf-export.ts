import path from 'path'
import fs from 'fs'
import { Checklist, CheckItem } from '@/types'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = {
  mon: 'THỨ HAI', tue: 'THỨ BA', wed: 'THỨ TƯ',
  thu: 'THỨ NĂM', fri: 'THỨ SÁU', sat: 'THỨ BẢY', sun: 'CHỦ NHẬT'
}

// Colors matching the sample PDF
const COLOR = {
  headerBg:    '#1a3a6b',  // dark navy blue for main header
  groupObsBg:  '#1a3a6b',  // blue for observation group
  groupOpBg:   '#1a3a6b',  // same for operation
  colHeaderBg: '#2d5fa6',  // medium blue for column headers
  dayHeaderBg: '#3a72c4',  // lighter blue for day sub-headers
  altRowBg:    '#f0f5ff',  // very light blue for alternating rows
  passColor:   '#166534',  // green
  failColor:   '#991b1b',  // red
  borderColor: '#94a3b8',
  textDark:    '#0f172a',
  textMid:     '#334155',
  textLight:   '#64748b',
  white:       '#ffffff',
  sigBg:       '#f8fafc',
}

function getFonts() {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  return {
    Roboto: {
      normal:  fs.readFileSync(path.join(fontsDir, 'Roboto-Regular.ttf')),
      bold:    fs.readFileSync(path.join(fontsDir, 'Roboto-Bold.ttf')),
      italics: fs.readFileSync(path.join(fontsDir, 'Roboto-Regular.ttf')),
      bolditalics: fs.readFileSync(path.join(fontsDir, 'Roboto-Bold.ttf')),
    }
  }
}

function statusText(status: string): string {
  if (status === 'pass') return 'V'
  if (status === 'fail') return 'X'
  return ''
}

function statusColor(status: string): string {
  if (status === 'pass') return COLOR.passColor
  if (status === 'fail') return COLOR.failColor
  return COLOR.textLight
}

function cell(
  text: string,
  options: {
    bold?: boolean
    fontSize?: number
    color?: string
    fillColor?: string
    alignment?: string
    rowSpan?: number
    colSpan?: number
    border?: boolean[]
    margin?: number[]
    italics?: boolean
  } = {}
): object {
  return {
    text,
    bold: options.bold ?? false,
    fontSize: options.fontSize ?? 6.5,
    color: options.color ?? COLOR.textDark,
    fillColor: options.fillColor,
    alignment: options.alignment ?? 'left',
    rowSpan: options.rowSpan,
    colSpan: options.colSpan,
    border: options.border ?? [true, true, true, true],
    margin: options.margin ?? [1, 1, 1, 1],
    italics: options.italics ?? false,
    noWrap: false,
  }
}

function emptyCell(rowSpan?: number): object {
  return { text: '', border: [true, true, true, true], fillColor: COLOR.white, rowSpan }
}

export async function generatePDFReport(checklist: Checklist): Promise<Buffer> {
  // Dynamic import to avoid issues with Next.js server components
  const PdfPrinter = require('pdfmake')

  const fonts = getFonts()
  const printer = new PdfPrinter(fonts)

  const obsItems = checklist.items.filter(i => i.category === 'observation')
  const opItems  = checklist.items.filter(i => i.category === 'operation')
  const allItems = [...obsItems, ...opItems]

  // ── Build the big table body ─────────────────────────────────────────────
  // Column widths (landscape A4 = 841pt, margins 15 each = 811pt usable)
  // Col 0: Group (30), Col 1: Item label (95), then 7 days × 2 cols (status 22 + detail 50) = 504, total ~629
  // Adjusted: group=28, label=90, 7×(status=23 + detail=48) = 7×71 = 497, total=615 ✓

  const widths = [
    28,   // Group (vertical text)
    90,   // NỘI DUNG KIỂM TRA
    ...Array(7).fill([23, 48]).flat()  // 7 days × (Tình trạng + Chi tiết)
  ]

  // Row 1: merged "NỘI DUNG KIỂM TRA" header + day headers
  const headerRow1: object[] = [
    { text: '', border: [true, true, false, true], fillColor: COLOR.headerBg, colSpan: 2 },
    emptyCell(),
    ...DAYS.flatMap(day => [
      {
        text: DAY_LABELS[day],
        bold: true,
        fontSize: 6.5,
        color: COLOR.white,
        fillColor: COLOR.dayHeaderBg,
        alignment: 'center',
        colSpan: 2,
        border: [true, true, true, true],
        margin: [1, 2, 1, 2],
      },
      emptyCell(),
    ])
  ]

  // Row 2: sub-headers
  const headerRow2: object[] = [
    cell('NHÓM', { bold: true, fontSize: 6, color: COLOR.white, fillColor: COLOR.headerBg, alignment: 'center' }),
    cell('NỘI DUNG KIỂM TRA', { bold: true, fontSize: 6.5, color: COLOR.white, fillColor: COLOR.headerBg, alignment: 'center' }),
    ...DAYS.flatMap(() => [
      cell('Tình\ntrạng', { bold: true, fontSize: 6, color: COLOR.white, fillColor: COLOR.colHeaderBg, alignment: 'center', margin: [1, 2, 1, 2] }),
      cell('Chi tiết', { bold: true, fontSize: 6, color: COLOR.white, fillColor: COLOR.colHeaderBg, alignment: 'center', margin: [1, 2, 1, 2] }),
    ])
  ]

  // Group separator row: OBSERVATION
  const obsGroupRow: object[] = [
    {
      text: 'KIỂM TRA QUAN SÁT / OBSERVATION CHECK',
      bold: true,
      fontSize: 6.5,
      color: COLOR.white,
      fillColor: COLOR.groupObsBg,
      alignment: 'center',
      colSpan: 16,
      border: [true, true, true, true],
      margin: [2, 3, 2, 3],
    },
    ...Array(15).fill(emptyCell()),
  ]

  // Build item rows
  function buildItemRows(items: CheckItem[], rowBgStart: number): object[][] {
    return items.map((item, idx) => {
      const bg = (rowBgStart + idx) % 2 === 0 ? COLOR.white : COLOR.altRowBg
      const label = item.sub_label || item.label_vi
      const detail = `${item.label_en}\n${item.label_vi}`

      const row: object[] = [
        // Group column — will be filled by first row's rowSpan, others are empty
        emptyCell(),
        // Item content
        {
          stack: [
            { text: label, bold: true, fontSize: 7, color: COLOR.textDark },
            { text: item.label_vi !== label ? item.label_vi : item.label_en, fontSize: 6, color: COLOR.textMid, margin: [0, 1, 0, 0] },
          ],
          fillColor: bg,
          border: [true, true, true, true],
          margin: [2, 2, 2, 2],
        },
        // 7 days × (status + detail)
        ...DAYS.flatMap(day => {
          const entry = item.days?.[day] || { status: '', detail: '', image_url: '' }
          return [
            // Status cell
            {
              text: statusText(entry.status),
              bold: true,
              fontSize: 9,
              color: statusColor(entry.status),
              fillColor: entry.status === 'pass' ? '#f0fdf4' : entry.status === 'fail' ? '#fff1f2' : bg,
              alignment: 'center',
              border: [true, true, true, true],
              margin: [1, 2, 1, 2],
            },
            // Detail cell
            {
              text: entry.detail || '',
              fontSize: 6,
              color: COLOR.textMid,
              fillColor: entry.status === 'fail' ? '#fff1f2' : bg,
              border: [true, true, true, true],
              margin: [2, 2, 2, 2],
            },
          ]
        }),
      ]
      return row
    })
  }

  const obsRows = buildItemRows(obsItems, 0)
  // Add rowSpan for observation group label in first column
  if (obsRows.length > 0) {
    ;(obsRows[0][0] as any) = {
      text: 'KIỂM TRA\nQUAN SÁT',
      bold: true,
      fontSize: 6,
      color: COLOR.white,
      fillColor: COLOR.groupObsBg,
      alignment: 'center',
      rowSpan: obsRows.length,
      border: [true, true, true, true],
      margin: [1, 4, 1, 4],
    }
  }

  // Group separator row: OPERATION
  const opGroupRow: object[] = [
    {
      text: 'KIỂM TRA VẬN HÀNH / OPERATION CHECK',
      bold: true,
      fontSize: 6.5,
      color: COLOR.white,
      fillColor: '#0f5132',
      alignment: 'center',
      colSpan: 16,
      border: [true, true, true, true],
      margin: [2, 3, 2, 3],
    },
    ...Array(15).fill(emptyCell()),
  ]

  const opRows = buildItemRows(opItems, 0)
  if (opRows.length > 0) {
    ;(opRows[0][0] as any) = {
      text: 'KIỂM TRA\nVẬN HÀNH',
      bold: true,
      fontSize: 6,
      color: COLOR.white,
      fillColor: '#0f5132',
      alignment: 'center',
      rowSpan: opRows.length,
      border: [true, true, true, true],
      margin: [1, 4, 1, 4],
    }
  }

  // ── Signature rows ───────────────────────────────────────────────────────
  const sigLabelStyle = { bold: true, fontSize: 6.5, color: COLOR.textDark, fillColor: COLOR.sigBg }

  const sigRow1: object[] = [
    {
      text: 'KÝ\nTÊN',
      bold: true,
      fontSize: 6.5,
      color: COLOR.white,
      fillColor: COLOR.headerBg,
      alignment: 'center',
      rowSpan: 2,
      border: [true, true, true, true],
      margin: [1, 4, 1, 4],
    },
    {
      ...sigLabelStyle,
      text: 'Forklift driver – Tài xế xe nâng',
      border: [true, true, true, true],
      margin: [2, 2, 2, 2],
    },
    ...DAYS.flatMap(day => {
      const sig = checklist.operator_signatures?.[day]
      return [
        {
          stack: sig
            ? [
                { text: '✓', fontSize: 10, color: COLOR.passColor, bold: true, alignment: 'center' },
                { text: sig.user_name, fontSize: 6, color: COLOR.textMid, alignment: 'center' },
                { text: new Date(sig.signed_at).toLocaleDateString('vi-VN'), fontSize: 5.5, color: COLOR.textLight, alignment: 'center' },
              ]
            : [{ text: '', fontSize: 8 }],
          fillColor: COLOR.sigBg,
          alignment: 'center',
          border: [true, true, true, true],
          margin: [1, 2, 1, 2],
          colSpan: 2,
        },
        emptyCell(),
      ]
    }),
  ]

  const sigRow2: object[] = [
    emptyCell(), // rowSpan placeholder
    {
      ...sigLabelStyle,
      text: 'Supervisor – Giám sát',
      border: [true, true, true, true],
      margin: [2, 2, 2, 2],
    },
    ...DAYS.flatMap(day => {
      const sig = checklist.supervisor_signatures?.[day]
      return [
        {
          stack: sig
            ? [
                { text: '✓', fontSize: 10, color: '#1e40af', bold: true, alignment: 'center' },
                { text: sig.user_name, fontSize: 6, color: COLOR.textMid, alignment: 'center' },
                { text: new Date(sig.signed_at).toLocaleDateString('vi-VN'), fontSize: 5.5, color: COLOR.textLight, alignment: 'center' },
              ]
            : [{ text: '', fontSize: 8 }],
          fillColor: COLOR.sigBg,
          alignment: 'center',
          border: [true, true, true, true],
          margin: [1, 2, 1, 2],
          colSpan: 2,
        },
        emptyCell(),
      ]
    }),
  ]

  // ── Notes row ────────────────────────────────────────────────────────────
  const notesRow: object[] = [
    {
      text: [
        { text: 'Ghi chú ', bold: true, fontSize: 6.5 },
        { text: '(Các mục cần sửa chữa hay căn chỉnh): ', fontSize: 6.5 },
        { text: checklist.notes || '', fontSize: 6.5, color: COLOR.textMid },
      ],
      colSpan: 16,
      border: [true, true, true, true],
      margin: [2, 3, 2, 12],
      fillColor: COLOR.sigBg,
    },
    ...Array(15).fill(emptyCell()),
  ]

  // ── Document definition ──────────────────────────────────────────────────
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [12, 12, 12, 40] as [number, number, number, number],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 7,
    },

    // ── HEADER ──
    content: [
      // Title block
      {
        columns: [
          // Left: UR Logo placeholder
          {
            width: 70,
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 60, h: 22, r: 3, color: COLOR.headerBg },
                ],
              },
              {
                text: 'Universal\nRobina',
                bold: true,
                fontSize: 8,
                color: COLOR.white,
                alignment: 'center',
                margin: [0, -20, 0, 0],
              },
            ],
          },
          // Center: Title
          {
            width: '*',
            stack: [
              {
                text: 'BIỂU MẪU KIỂM TRA AN TOÀN HÀNG NGÀY',
                bold: true,
                fontSize: 13,
                color: COLOR.headerBg,
                alignment: 'center',
              },
              {
                text: 'Operators Safety daily Checklist',
                fontSize: 10,
                color: COLOR.textMid,
                alignment: 'center',
                italics: true,
                margin: [0, 2, 0, 0],
              },
            ],
          },
          // Right: meta
          {
            width: 130,
            table: {
              widths: ['auto', '*'],
              body: [
                [
                  cell('Trang:', { bold: true, fontSize: 6, border: [true, true, false, true] }),
                  cell('1/1',    { fontSize: 6, border: [false, true, true, true] }),
                ],
                [
                  cell('Ngày ban hành:', { bold: true, fontSize: 6, border: [true, false, false, false] }),
                  cell('20/09/2025',     { fontSize: 6, border: [false, false, true, false] }),
                ],
                [
                  cell('Mã hiệu:', { bold: true, fontSize: 6, border: [true, false, false, true] }),
                  cell('WH-SOP01-FR01', { fontSize: 6, border: [false, false, true, true] }),
                ],
              ],
            },
            layout: 'noBorders',
          },
        ],
        margin: [0, 0, 0, 6],
      },

      // ── Info row ──
      {
        table: {
          widths: ['auto', '*', 'auto', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [[
            cell('Model:', { bold: true, fontSize: 7, border: [true, true, false, true] }),
            cell(checklist.forklift_model || '........................................', { fontSize: 7, border: [false, true, true, true] }),
            cell('Số Seri:', { bold: true, fontSize: 7, border: [true, true, false, true] }),
            cell(checklist.forklift_serial || '......................', { fontSize: 7, border: [false, true, true, true] }),
            cell('Tuần thứ:', { bold: true, fontSize: 7, border: [true, true, false, true] }),
            cell(`${checklist.week_number}/${checklist.year}`, { fontSize: 7, border: [false, true, true, true] }),
            cell('Ca thứ:', { bold: true, fontSize: 7, border: [true, true, false, true] }),
            cell(checklist.shift || '.....', { fontSize: 7, border: [false, true, true, true] }),
          ]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 1],
      },
      {
        table: {
          widths: ['auto', 'auto', '*'],
          body: [[
            cell('Xe số:', { bold: true, fontSize: 7, border: [true, false, false, true] }),
            cell(checklist.forklift_number || '..................', { fontSize: 7, border: [false, false, true, true] }),
            cell(
              'Ghi chú: Biên bản kiểm tra này cần được thực hiện bởi tài xế bắt đầu vào ca làm việc. Các mục liệt kê chỉ áp dụng cho một số loại xe. Cần phải kiểm tra hết các mục được ghi bên dưới.',
              { fontSize: 6, color: COLOR.textMid, italics: true, border: [false, false, true, true] }
            ),
          ]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 3],
      },

      // Instructions
      {
        text: [
          { text: 'Đánh dấu ', fontSize: 7 },
          { text: '"V"', bold: true, fontSize: 7, color: COLOR.passColor },
          { text: ' vào ô tình trạng nếu tình trạng là tốt, đạt; Đánh dấu ', fontSize: 7 },
          { text: '"X"', bold: true, fontSize: 7, color: COLOR.failColor },
          { text: ' nếu tình trạng là không đạt; ', fontSize: 7 },
          { text: 'Cần sửa chữa hay căn chỉnh (Ghi chi tiết cụ thể):', bold: true, fontSize: 7 },
        ],
        margin: [0, 0, 0, 3],
      },

      // ── MAIN TABLE ──
      {
        table: {
          headerRows: 2,
          widths: widths,
          body: [
            headerRow1,
            headerRow2,
            obsGroupRow,
            ...obsRows,
            opGroupRow,
            ...opRows,
            sigRow1,
            sigRow2,
            notesRow,
          ],
          dontBreakRows: false,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLOR.borderColor,
          vLineColor: () => COLOR.borderColor,
          paddingLeft:   () => 0,
          paddingRight:  () => 0,
          paddingTop:    () => 0,
          paddingBottom: () => 0,
        },
      },
    ],

    // ── FOOTER ──
    footer: (_currentPage: number, _pageCount: number) => ({
      stack: [
        {
          canvas: [{ type: 'line', x1: 12, y1: 0, x2: 829, y2: 0, lineWidth: 0.5, lineColor: COLOR.borderColor }],
        },
        {
          text: [
            { text: 'Chú ý: ', bold: true, fontSize: 5.5 },
            { text: 'Nếu xe nâng phát hiện cần phải sửa chữa hay không an toàn cần phải dừng xe, báo cáo cho người phụ trách ngay. Không được vận hành xe nâng cho tới khi đã được sửa chữa và đảm bảo an toàn. ', fontSize: 5.5 },
            { text: 'Nếu trong khi hoạt động mà xe có dấu hiệu không an toàn thì cần phải báo ngay với người phụ trách và không được vận hành cho tới khi xe được sửa chữa và vận hành an toàn. ', fontSize: 5.5 },
            { text: 'Không được tự ý sửa chữa hay cân chỉnh xe nâng trừ khi bạn được cho phép.', fontSize: 5.5 },
          ],
          color: COLOR.textLight,
          margin: [12, 2, 12, 0],
        },
      ],
    }),
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition, { fonts })
      const chunks: Buffer[] = []
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.on('error', reject)
      pdfDoc.end()
    } catch (err) {
      reject(err)
    }
  })
}
