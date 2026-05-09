import * as XLSX from 'xlsx'
import { Checklist, CheckItem } from '@/types'
import { DAY_LABELS, DAYS } from './checklist-data'

// ─── Style helpers ────────────────────────────────────────────────────────────

const thinBorder = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
}

const titleStyle = {
  font: { bold: true, sz: 20 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
}

const metaLabelStyle = {
  font: { bold: true, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
}

const metaValueStyle = {
  font: { sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
}

const infoStyle = {
  font: { sz: 12 },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
}

const infoSmallStyle = {
  font: { sz: 8 },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
}

const legendStyle = {
  font: { sz: 12 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
}

const colHeaderStyle = {
  font: { bold: true, sz: 12 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const subHeaderStyle = {
  font: { bold: true, sz: 9 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const groupLabelStyle = {
  font: { bold: true, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const contentStyle = {
  font: { bold: true, sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const statusCellStyle = {
  font: { sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder,
}

const detailCellStyle = {
  font: { sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const sigLabelStyle = {
  font: { bold: true, sz: 9 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder,
}

const sigNameStyle = {
  font: { bold: true, sz: 11 },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const sigValueStyle = {
  font: { sz: 10 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const noteLabelStyle = {
  font: { bold: true, sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const noteLineStyle = {
  font: { sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  border: thinBorder,
}

const footerStyle = {
  font: { sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
}

// ─── Column layout (mirrors XE_NANG_HANG.xlsx) ────────────────────────────────
// Col A (0): unused spacer
// Col B (1): group label  → "OBSERVATION CHECK/..." or "OPERATION CHECK/..."
// Col C (2): sub_label    → "Damage – Gãy vỡ"
// Col D (3): content      → full label_vi text  (merged C:D in sample)
// Col E (4): Thứ Hai – Tình trạng
// Col F (5): Thứ Hai – Chi tiết
// Col G (6): Thứ Ba – Tình trạng
// Col H (7): Thứ Ba – Chi tiết
// ... repeats for 7 days → last status col = Q (16), last detail col = R (17)

// NOTE: In the sample, columns C and D are merged for content text.
// We replicate: B=group, C:D merged=sub_label+content together, then status/detail pairs.
// Actually the sample shows: B=group, C:D=sub_label (short), but content is in the same
// cell with wrapText. We'll put sub_label on col C and content on col D with a merged C:D
// Actually looking at the sample again: C is short label, D is full text — but C:D are merged
// in data rows. So col B = group, merged C:D = "Damage – Gãy vỡ\nBent, dented..."
// Then E+F = Monday, G+H = Tuesday etc.
//
// Column indices (0-based): B=1, C=2, D=3, E=4, F=5 ... R=17
// Days start at col 4 (E), each day takes 2 cols → 7 days → cols 4..17

const COL_GROUP = 1   // B
const COL_CONTENT_START = 2  // C (merged C:D)
const COL_CONTENT_END = 3    // D
const COL_DAYS_START = 4     // E  (status col for Monday)

function dayStatusCol(dayIdx: number) { return COL_DAYS_START + dayIdx * 2 }
function dayDetailCol(dayIdx: number) { return COL_DAYS_START + dayIdx * 2 + 1 }

const TOTAL_COLS = COL_DAYS_START + DAYS.length * 2  // 4 + 14 = 18 → col R (index 17)

export function generateExcelReport(checklist: Checklist): Buffer {
  const wb = XLSX.utils.book_new()
  const ws: XLSX.WorkSheet = {}
  const merges: XLSX.Range[] = []

  let row = 0  // 0-based row index

  const setCell = (r: number, c: number, value: string | number, style?: object) => {
    ws[XLSX.utils.encode_cell({ r, c })] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style }
  }

  // ── Row 0: Title + Trang ──────────────────────────────────────────────────
  // B1:C3 merged (logo placeholder — left blank, matching sample col B1:C3)
  merges.push({ s: { r: 0, c: 1 }, e: { r: 2, c: 2 } })  // B1:C3 (blank logo area)

  // D1:J3 merged → title
  setCell(row, 3, 'BIỂU MẪU KIỂM TRA AN TOÀN HÀNG NGÀY\n Operators Safety daily Checklist', titleStyle)
  merges.push({ s: { r: 0, c: 3 }, e: { r: 2, c: 9 } })

  // K1:N1 → "Trang :"   O1:R1 → "1/1"
  setCell(row, 10, 'Trang :', metaLabelStyle)
  merges.push({ s: { r: 0, c: 10 }, e: { r: 0, c: 13 } })
  setCell(row, 14, '1/1', metaValueStyle)
  merges.push({ s: { r: 0, c: 14 }, e: { r: 0, c: 17 } })
  row++

  // ── Row 1: Ngày ban hành ──────────────────────────────────────────────────
  setCell(row, 10, 'Ngày ban hành:', metaLabelStyle)
  merges.push({ s: { r: 1, c: 10 }, e: { r: 1, c: 13 } })
  setCell(row, 14, '20/09/2025', metaValueStyle)
  merges.push({ s: { r: 1, c: 14 }, e: { r: 1, c: 17 } })
  row++

  // ── Row 2: Mã hiệu ───────────────────────────────────────────────────────
  setCell(row, 10, 'Mã hiệu: ', metaLabelStyle)
  merges.push({ s: { r: 2, c: 10 }, e: { r: 2, c: 13 } })
  setCell(row, 14, 'WH- SOP01- FR01', metaValueStyle)
  merges.push({ s: { r: 2, c: 14 }, e: { r: 2, c: 17 } })
  row++

  // ── Row 3: thin separator (blank) ─────────────────────────────────────────
  row++

  // ── Row 4: Model / Số Seri / Tuần thứ ────────────────────────────────────
  const modelSerial = `\nModel: ${checklist.forklift_model || ''}     Số Seri: ${checklist.forklift_serial || ''}`
  setCell(row, 1, modelSerial, infoSmallStyle)
  merges.push({ s: { r: 4, c: 1 }, e: { r: 4, c: 9 } })
  setCell(row, 10, `\nTuần thứ:`, metaLabelStyle)
  merges.push({ s: { r: 4, c: 10 }, e: { r: 4, c: 12 } })
  setCell(row, 13, `${checklist.week_number}/${checklist.year}`, metaValueStyle)
  merges.push({ s: { r: 4, c: 13 }, e: { r: 4, c: 17 } })
  row++

  // ── Row 5: Ghi chú note / Ca thứ ─────────────────────────────────────────
  setCell(row, 1,
    'Ghi chú: Biên bản kiểm tra này cần được thực hiện bởi tài xế bắt đầu vào ca làm việc.\nCác mục liệt kê chỉ áp dụng cho một số loại xe. Cần phải kiểm tra hết các mục được ghi bên dưới.',
    infoStyle)
  merges.push({ s: { r: 5, c: 1 }, e: { r: 5, c: 9 } })
  setCell(row, 10, `\nCa thứ:`, metaLabelStyle)
  merges.push({ s: { r: 5, c: 10 }, e: { r: 5, c: 12 } })
  setCell(row, 13, checklist.shift || '', metaValueStyle)
  merges.push({ s: { r: 5, c: 13 }, e: { r: 5, c: 17 } })
  row++

  // ── Row 6: Xe số ─────────────────────────────────────────────────────────
  setCell(row, 10, `\nXe số:`, metaLabelStyle)
  merges.push({ s: { r: 6, c: 1 }, e: { r: 6, c: 9 } })
  merges.push({ s: { r: 6, c: 10 }, e: { r: 6, c: 12 } })
  setCell(row, 13, checklist.forklift_number || '', metaValueStyle)
  merges.push({ s: { r: 6, c: 13 }, e: { r: 6, c: 17 } })
  row++

  // ── Row 7: Legend ─────────────────────────────────────────────────────────
  setCell(row, 1, 'Đánh dấu "P" vào ô tình trạng nếu tình trạng là tốt, đạt; Đánh dấu "X" nếu tình trạng là không đạt;', legendStyle)
  merges.push({ s: { r: 7, c: 1 }, e: { r: 7, c: 6 } })
  setCell(row, 7, 'Cần sữa chữa hay căn chỉnh (Ghi chi tiết cụ thể):', legendStyle)
  merges.push({ s: { r: 7, c: 7 }, e: { r: 7, c: 17 } })
  row++

  // ── Row 8: blank separator ────────────────────────────────────────────────
  row++

  // ── Row 9: Column headers row 1 (day names) ───────────────────────────────
  setCell(row, COL_GROUP, '', colHeaderStyle)
  merges.push({ s: { r: row, c: 1 }, e: { r: row, c: 1 } })

  setCell(row, COL_CONTENT_START, 'NỘI DUNG KIỂM TRA', colHeaderStyle)
  merges.push({ s: { r: row, c: COL_CONTENT_START }, e: { r: row + 1, c: COL_CONTENT_END } })

  DAYS.forEach((day, di) => {
    const sCol = dayStatusCol(di)
    const dCol = dayDetailCol(di)
    setCell(row, sCol, DAY_LABELS[day] ?? day, colHeaderStyle)
    merges.push({ s: { r: row, c: sCol }, e: { r: row, c: dCol } })
  })
  row++

  // ── Row 10: Column headers row 2 (Tình trạng / Chi tiết) ─────────────────
  setCell(row, COL_GROUP, '', subHeaderStyle)
  // C:D already merged above from row 9
  DAYS.forEach((_day, di) => {
    setCell(row, dayStatusCol(di), 'Tình trạng', subHeaderStyle)
    setCell(row, dayDetailCol(di), 'Chi tiết', subHeaderStyle)
  })
  row++

  // ── Data rows ─────────────────────────────────────────────────────────────
  const obsItems = checklist.items.filter(i => i.category === 'observation')
  const opItems = checklist.items.filter(i => i.category === 'operation')

  const writeGroup = (items: CheckItem[], groupLabel: string) => {
    const groupStartRow = row
    items.forEach((item, idx) => {
      // Group label cell — only set value on first row, merge all rows
      setCell(row, COL_GROUP, idx === 0 ? groupLabel : '', groupLabelStyle)

      // Content: merged C:D
      const content = `${item.sub_label || ''}\n${item.label_vi}`
      setCell(row, COL_CONTENT_START, content, contentStyle)
      merges.push({ s: { r: row, c: COL_CONTENT_START }, e: { r: row, c: COL_CONTENT_END } })

      // Day status + detail
      DAYS.forEach((day, di) => {
        const entry = item.days[day]
        const statusVal = entry?.status === 'pass' ? 'P' : entry?.status === 'fail' ? 'X' : ''
        setCell(row, dayStatusCol(di), statusVal, statusCellStyle)
        setCell(row, dayDetailCol(di), entry?.detail || '', detailCellStyle)
      })
      row++
    })
    // Merge group label column over all rows in this group
    if (items.length > 1) {
      merges.push({ s: { r: groupStartRow, c: COL_GROUP }, e: { r: row - 1, c: COL_GROUP } })
    }
  }

  writeGroup(obsItems, 'OBSERVATION CHECK/\nKIỂM TRA QUAN SÁT')
  writeGroup(opItems, 'OPERATION CHECK/\nKIỂM TRA VẬN HÀNH')

  // ── Signature rows ────────────────────────────────────────────────────────
  // Row: KÝ TÊN | Forklift driver – Tài xế xe nâng | [day values...]
  setCell(row, COL_GROUP, 'KÝ TÊN', sigLabelStyle)
  merges.push({ s: { r: row, c: COL_GROUP }, e: { r: row + 1, c: COL_GROUP } })
  setCell(row, COL_CONTENT_START, 'Forklift driver – Tài xế xe nâng', sigNameStyle)
  merges.push({ s: { r: row, c: COL_CONTENT_START }, e: { r: row, c: COL_CONTENT_END } })
  DAYS.forEach((day, di) => {
    setCell(row, dayStatusCol(di), '', sigValueStyle)
    merges.push({ s: { r: row, c: dayStatusCol(di) }, e: { r: row, c: dayDetailCol(di) } })
  })
  row++

  // Supervisor row
  setCell(row, COL_CONTENT_START, 'Supervisor – Giám sát', sigNameStyle)
  merges.push({ s: { r: row, c: COL_CONTENT_START }, e: { r: row, c: COL_CONTENT_END } })
  DAYS.forEach((_day, di) => {
    setCell(row, dayStatusCol(di), '', sigValueStyle)
    merges.push({ s: { r: row, c: dayStatusCol(di) }, e: { r: row, c: dayDetailCol(di) } })
  })
  row++

  // ── Notes section ─────────────────────────────────────────────────────────
  const noteLabel = 'Ghi chú (Các mục cần sữa chữa hay căn chỉnh): '
  setCell(row, COL_GROUP, noteLabel, noteLabelStyle)
  merges.push({ s: { r: row, c: COL_GROUP }, e: { r: row, c: 17 } })
  row++

  // 5 blank note lines (dotted lines like sample)
  const dotLine = '…'.repeat(200)
  for (let i = 0; i < 5; i++) {
    setCell(row, COL_GROUP, dotLine, noteLineStyle)
    merges.push({ s: { r: row, c: COL_GROUP }, e: { r: row, c: 17 } })
    row++
  }

  // blank separator
  row++

  // ── Footer notes ──────────────────────────────────────────────────────────
  const footerLines = [
    'Chú ý: Nếu xe nâng phát hiện cần phải sữa chữa hay không an toàn hoặc bất kỳ một sự cố nào đó không an toàn cần phải dừng xe, báo cáo cho người phụ trách ngay. Không được vận hành xe nâng cho tới khi đã được sữa chữa và đảm bảo an toàn.',
    'Nếu trong khi hoạt động mà xe có dấu hiệu không an toàn thì cần phải báo ngay với người phụ trách và không được vận hành cho tới khi xe được sữa chữa và vận hành an toàn.',
    'Không được tự ý sữa chữa hay cân chỉnh xe nâng trừ khi bạn được cho phép.',
  ]
  for (const line of footerLines) {
    setCell(row, COL_GROUP, line, footerStyle)
    merges.push({ s: { r: row, c: COL_GROUP }, e: { r: row, c: 17 } })
    row++
  }

  // ── Sheet range + merges ──────────────────────────────────────────────────
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: row, c: 17 })
  ws['!merges'] = merges

  // ── Column widths (matching XE_NANG_HANG.xlsx) ────────────────────────────
  ws['!cols'] = [
    { wch: 0.5 },   // A – spacer
    { wch: 7 },     // B – group
    { wch: 16 },    // C – sub_label part of merged content
    { wch: 45 },    // D – content (merged C:D gives ~60 wide total)
    ...DAYS.flatMap(() => [{ wch: 6 }, { wch: 11 }]),  // E..R status+detail pairs
  ]

  // ── Row heights ────────────────────────────────────────────────────────────
  const rowHeights: Record<number, number> = {
    0: 22, 1: 22, 2: 22,   // title block
    3: 7,                   // thin separator
    4: 31, 5: 22, 6: 24,   // info rows
    7: 31,                  // legend
    8: 6,                   // blank
    9: 23, 10: 29,          // headers
  }
  const ws_rows: XLSX.RowInfo[] = []
  for (let r = 0; r < row + 1; r++) {
    ws_rows.push({ hpt: rowHeights[r] ?? 44 })
  }
  // signature rows
  const sigRowStart = 11 + obsItems.length + opItems.length
  ws_rows[sigRowStart] = { hpt: 37 }
  ws_rows[sigRowStart + 1] = { hpt: 37 }
  // note label row
  ws_rows[sigRowStart + 2] = { hpt: 26 }
  // note lines
  for (let i = 0; i < 5; i++) ws_rows[sigRowStart + 3 + i] = { hpt: 25 }
  // footer
  for (let i = 0; i < 3; i++) ws_rows[sigRowStart + 9 + i] = { hpt: 17 }

  ws['!rows'] = ws_rows

  // ── Print settings (landscape, fit to 1 page wide) ────────────────────────
  ws['!pageSetup'] = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }

  XLSX.utils.book_append_sheet(wb, ws, 'Xe nâng hàng')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
