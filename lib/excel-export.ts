import * as XLSX from 'xlsx'
import { Checklist, CheckItem } from '@/types'
import { DAY_LABELS, DAYS } from './checklist-data'

export function generateExcelReport(checklist: Checklist): Buffer {
  const wb = XLSX.utils.book_new()
  const ws: XLSX.WorkSheet = {}

  // Styles helper
  const headerStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  }
  const titleStyle = {
    font: { bold: true, sz: 13, color: { rgb: '1E3A8A' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
  }
  const passStyle = {
    font: { bold: true, sz: 12, color: { rgb: '15803D' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: { fgColor: { rgb: 'F0FDF4' } }
  }
  const failStyle = {
    font: { bold: true, sz: 12, color: { rgb: 'B91C1C' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: { fgColor: { rgb: 'FFF1F2' } }
  }
  const cellStyle = {
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: { top: { style: 'thin', color: { rgb: 'E2E8F0' } }, bottom: { style: 'thin', color: { rgb: 'E2E8F0' } }, left: { style: 'thin', color: { rgb: 'E2E8F0' } }, right: { style: 'thin', color: { rgb: 'E2E8F0' } } }
  }

  let row = 0

  // Title
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = {
    v: 'BIỂU MẪU KIỂM TRA AN TOÀN HÀNG NGÀY - Operators Safety Daily Checklist',
    t: 's', s: titleStyle
  }
  ws[XLSX.utils.encode_cell({ r: row, c: 12 })] = { v: 'Trang: 1/1', t: 's' }
  row++

  ws[XLSX.utils.encode_cell({ r: row, c: 12 })] = { v: 'Mã hiệu: WH-SOP01-FR01', t: 's' }
  row++
  ws[XLSX.utils.encode_cell({ r: row, c: 12 })] = { v: `Ngày ban hành: 20/09/2025`, t: 's' }
  row++

  row++ // blank
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = { v: `Model: ${checklist.forklift_model}`, t: 's' }
  ws[XLSX.utils.encode_cell({ r: row, c: 6 })] = { v: `Số Seri: ${checklist.forklift_serial}`, t: 's' }
  ws[XLSX.utils.encode_cell({ r: row, c: 10 })] = { v: `Tuần thứ: ${checklist.week_number}/${checklist.year}`, t: 's' }
  row++
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = { v: `Xe số: ${checklist.forklift_number}    Ca thứ: ${checklist.shift}`, t: 's' }
  row++

  row++ // blank
  // Legend
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = {
    v: 'Đánh dấu "P" vào ô tình trạng nếu tình trạng là tốt/đạt; Đánh dấu "X" nếu tình trạng là không đạt',
    t: 's'
  }
  row++
  row++

  // Table header row 1
  const headers1 = ['', 'NỘI DUNG KIỂM TRA', '', ...DAYS.flatMap(d => [DAY_LABELS[d], ''])]
  headers1.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: row, c })] = { v: h, t: 's', s: headerStyle }
  })
  row++

  // Table header row 2
  const headers2 = ['Nhóm', 'Hạng mục', 'Nội dung (VI/EN)', ...DAYS.flatMap(() => ['Tình trạng', 'Chi tiết'])]
  headers2.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: row, c })] = { v: h, t: 's', s: headerStyle }
  })
  row++

  // Group items
  const obsItems = checklist.items.filter(i => i.category === 'observation')
  const opItems = checklist.items.filter(i => i.category === 'operation')

  const writeGroup = (items: CheckItem[], groupLabel: string) => {
    items.forEach((item, idx) => {
      const isFirstInGroup = idx === 0
      ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = {
        v: isFirstInGroup ? groupLabel : '',
        t: 's',
        s: { ...cellStyle, font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } }
      }
      ws[XLSX.utils.encode_cell({ r: row, c: 1 })] = { v: item.sub_label || '', t: 's', s: cellStyle }
      ws[XLSX.utils.encode_cell({ r: row, c: 2 })] = { v: item.label_vi, t: 's', s: { ...cellStyle, font: { sz: 9 } } }

      DAYS.forEach((day, di) => {
        const entry = item.days[day]
        const col = 3 + di * 2
        const statusVal = entry?.status === 'pass' ? 'P' : entry?.status === 'fail' ? 'X' : ''
        ws[XLSX.utils.encode_cell({ r: row, c: col })] = {
          v: statusVal, t: 's',
          s: entry?.status === 'pass' ? passStyle : entry?.status === 'fail' ? failStyle : cellStyle
        }
        ws[XLSX.utils.encode_cell({ r: row, c: col + 1 })] = {
          v: entry?.detail || '', t: 's', s: cellStyle
        }
      })
      row++
    })
  }

  writeGroup(obsItems, 'KIỂM TRA\nQUAN SÁT')
  writeGroup(opItems, 'KIỂM TRA\nVẬN HÀNH')

  row++ // blank
  // Signatures
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = { v: 'KÝ TÊN', t: 's', s: { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' } } }
  ws[XLSX.utils.encode_cell({ r: row, c: 1 })] = { v: 'Tài xế xe nâng – Forklift driver', t: 's', s: { font: { bold: true } } }
  DAYS.forEach((day, di) => {
    const sig = checklist.operator_signatures?.[day]
    ws[XLSX.utils.encode_cell({ r: row, c: 3 + di * 2 })] = {
      v: sig ? `✓ ${sig.user_name}\n${sig.signed_at ? new Date(sig.signed_at).toLocaleDateString('vi-VN') : ''}` : '',
      t: 's', s: { alignment: { horizontal: 'center', wrapText: true }, font: { color: { rgb: '15803D' } } }
    }
  })
  row++

  ws[XLSX.utils.encode_cell({ r: row, c: 1 })] = { v: 'Giám sát – Supervisor', t: 's', s: { font: { bold: true } } }
  DAYS.forEach((day, di) => {
    const sig = checklist.supervisor_signatures?.[day]
    ws[XLSX.utils.encode_cell({ r: row, c: 3 + di * 2 })] = {
      v: sig ? `✓ ${sig.user_name}\n${sig.signed_at ? new Date(sig.signed_at).toLocaleDateString('vi-VN') : ''}` : '',
      t: 's', s: { alignment: { horizontal: 'center', wrapText: true }, font: { color: { rgb: '1D4ED8' } } }
    }
  })
  row++

  row++ // blank
  // Notes
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = { v: 'Ghi chú (Các mục cần sửa chữa hay căn chỉnh):', t: 's', s: { font: { bold: true } } }
  row++
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = { v: checklist.notes || '', t: 's', s: { alignment: { wrapText: true } } }
  row++

  row++ // blank
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = {
    v: 'Chú ý: Nếu xe nâng phát hiện cần phải sửa chữa hay không an toàn, cần phải dừng xe và báo cáo cho người phụ trách ngay. Không được vận hành cho tới khi đã được sửa chữa và đảm bảo an toàn.',
    t: 's', s: { font: { italic: true, sz: 9, color: { rgb: '6B7280' } }, alignment: { wrapText: true } }
  }

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Group
    { wch: 22 }, // Item label
    { wch: 40 }, // Description
    ...DAYS.flatMap(() => [{ wch: 10 }, { wch: 28 }]) // Status + Detail per day
  ]

  // Set row heights
  ws['!rows'] = Array(row + 1).fill({ hpt: 30 })

  // Merge cells for title
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title
    ...DAYS.flatMap((_, di) => [{ s: { r: 8, c: 3 + di * 2 }, e: { r: 8, c: 4 + di * 2 } }]) // Day headers
  ]

  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: row, c: 16 })

  XLSX.utils.book_append_sheet(wb, ws, 'Xe nâng hàng')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buf
}
