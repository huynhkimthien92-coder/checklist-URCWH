import * as XLSX from 'xlsx'
import { Checklist, CheckItem } from '@/types'
import { DAY_LABELS, DAYS } from './checklist-data'

// ─── Column layout (1-based, khớp chính xác XE_NANG_HANG.xlsx) ──────────────
// A=1: spacer ẩn
// B=2: nhãn nhóm (merge B12:B22 obs, B23:B32 op, B33:B34 sig)
// C=3+D=4: nội dung kiểm tra (merge C:D mỗi hàng)
// E=5 Mon status, F=6 Mon detail
// G=7 Tue status, H=8 Tue detail
// I=9 Wed status, J=10 Wed detail
// K=11 Thu status, L=12 Thu detail
// M=13 Fri status, N=14 Fri detail
// O=15 Sat status, P=16 Sat detail
// Q=17 Sun status, R=18 Sun detail

// 0-based column indices (xlsx encodes as 0-based)
const COL_GROUP = 1    // B
const COL_C = 2        // C (start of content merge)
const COL_D = 3        // D (end of content merge)

function statusCol(dayIdx: number) { return 4 + dayIdx * 2 }   // E=4,G=6,I=8,K=10,M=12,O=14,Q=16
function detailCol(dayIdx: number) { return 5 + dayIdx * 2 }   // F=5,H=7,J=9,L=11,N=13,P=15,R=17

const DAY_HEADERS: Record<string, string> = {
  mon: 'THỨ HAI', tue: 'THỨ BA', wed: 'THỨ TƯ',
  thu: 'THỨ NĂM', fri: 'THỨ SÁU', sat: 'THỨ BẢY', sun: 'CHỦ NHẬT',
}

// ─── Border helpers ────────────────────────────────────────────────────────────
const thin = { style: 'thin' }
const ab   = { top: thin, bottom: thin, left: thin, right: thin }  // all borders
const tbr  = { top: thin, bottom: thin, right: thin }              // top bottom right (no left)

// ─── Style objects ─────────────────────────────────────────────────────────────
const S = {
  title: {
    font: { bold: true, sz: 20 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ab,
  },
  metaLabel: {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: tbr,
  },
  metaValue: {
    font: { sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ab,
  },
  modelRow: {
    font: { sz: 8, color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: { top: thin, bottom: thin, left: thin },
  },
  weekLabel: {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
    border: ab,
  },
  weekValue: {
    font: { sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ab,
  },
  noteBlock: {
    font: { sz: 12, color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: ab,
  },
  infoLabel: {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ab,
  },
  infoValue: {
    font: { sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ab,
  },
  legendLeft: {
    font: { sz: 12, color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ab,
  },
  legendRight: {
    font: { sz: 12, color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ab,
  },
  colHeader: {
    font: { bold: true, sz: 12 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ab,
  },
  subHeader: {
    font: { bold: true, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ab,
  },
  groupLabel: {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ab,
  },
  contentBold: {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: ab,
  },
  content: {
    font: { sz: 10 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: ab,
  },
  contentLg: {
    font: { sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: ab,
  },
  statusCell: {
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ab,
  },
  statusPass: {
    font: { bold: true, sz: 12, color: { rgb: '15803D' } },
    fill: { fgColor: { rgb: 'F0FDF4' }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ab,
  },
  statusFail: {
    font: { bold: true, sz: 12, color: { rgb: 'B91C1C' } },
    fill: { fgColor: { rgb: 'FFF1F2' }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ab,
  },
  detailCell: {
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: ab,
  },
  sigLabel: {
    font: { bold: true, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ab,
  },
  sigName: {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: ab,
  },
  sigCell: {
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ab,
  },
  noteLabelRow: {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: { top: thin },
  },
  noteLine: {
    font: { sz: 8 },
    alignment: { horizontal: 'left' },
  },
  footerBold: {
    font: { bold: true, sz: 8 },
    alignment: { vertical: 'center' },
  },
  footerNormal: {
    font: { sz: 8 },
    alignment: { vertical: 'center' },
  },
}

// ─── Cell/merge helpers ────────────────────────────────────────────────────────
function setCell(ws: XLSX.WorkSheet, r: number, c: number, value: string, style?: object) {
  ws[XLSX.utils.encode_cell({ r, c })] = { v: value, t: 's', s: style }
}

function addMerge(merges: XLSX.Range[], r1: number, c1: number, r2: number, c2: number) {
  merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } })
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function generateExcelReport(checklist: Checklist): Buffer {
  const wb = XLSX.utils.book_new()
  const ws: XLSX.WorkSheet = {}
  const merges: XLSX.Range[] = []

  const C = (r: number, c: number, v: string, s?: object) => setCell(ws, r, c, v, s)
  const M = (r1: number, c1: number, r2: number, c2: number) => addMerge(merges, r1, c1, r2, c2)

  // ────────────────────────────────────────────────────────────────────────────
  // ROWS 0-2 (Excel 1-3): Title block
  // ────────────────────────────────────────────────────────────────────────────
  // B1:C3 — empty logo area
  M(0, 1, 2, 2)

  // D1:J3 — main title
  C(0, 3, 'BIỂU MẪU KIỂM TRA AN TOÀN HÀNG NGÀY\n Operators Safety daily Checklist', S.title)
  M(0, 3, 2, 9)

  // K1:N1 "Trang :"   O1:R1 "1/1"
  C(0, 10, 'Trang :', S.metaLabel);      M(0, 10, 0, 13)
  C(0, 14, '1/1', S.metaValue);          M(0, 14, 0, 17)

  // K2:N2   O2:R2
  C(1, 10, 'Ngày ban hành:', S.metaLabel); M(1, 10, 1, 13)
  C(1, 14, '20/09/2025', S.metaValue);     M(1, 14, 1, 17)

  // K3:N3   O3:R3
  C(2, 10, 'Mã hiệu: ', S.metaLabel);      M(2, 10, 2, 13)
  C(2, 14, 'WH- SOP01- FR01', S.metaValue); M(2, 14, 2, 17)

  // ────────────────────────────────────────────────────────────────────────────
  // ROW 3 (Excel 4): thin spacer line
  // ────────────────────────────────────────────────────────────────────────────
  M(3, 1, 3, 17)

  // ────────────────────────────────────────────────────────────────────────────
  // ROW 4 (Excel 5): Model / Số Seri  +  Tuần thứ
  // ────────────────────────────────────────────────────────────────────────────
  C(4, 1, `\nModel: ${checklist.forklift_model || ''}     Số Seri: ${checklist.forklift_serial || ''}`, S.modelRow)
  M(4, 1, 4, 9)
  C(4, 10, '\nTuần thứ:', S.weekLabel); M(4, 10, 4, 12)
  C(4, 13, `${checklist.week_number}/${checklist.year}`, S.weekValue); M(4, 13, 4, 17)

  // ────────────────────────────────────────────────────────────────────────────
  // ROWS 5-6 (Excel 6-7): Ghi chú  +  Ca thứ / Xe số
  // ────────────────────────────────────────────────────────────────────────────
  C(5, 1,
    'Ghi chú: Biên bản kiểm tra này cần được thực hiện bởi tài xế bắt đầu vào ca làm việc.\nCác mục liệt kê chỉ áp dụng cho một số loại xe. Cần phải kiểm tra hết các mục được ghi bên dưới.',
    S.noteBlock)
  M(5, 1, 6, 9)  // B6:J7

  C(5, 10, '\nCa thứ:', S.infoLabel); M(5, 10, 5, 12)  // K6:M6
  C(5, 13, checklist.shift || '', S.infoValue); M(5, 13, 5, 17)  // N6:R6

  C(6, 10, '\nXe số:', S.infoLabel); M(6, 10, 6, 12)  // K7:M7
  C(6, 13, checklist.forklift_number || '', S.infoValue); M(6, 13, 6, 17)  // N7:R7

  // ────────────────────────────────────────────────────────────────────────────
  // ROW 7 (Excel 8): Legend
  // ────────────────────────────────────────────────────────────────────────────
  C(7, 1, 'Đánh dấu "P" vào ô tình trạng nếu tình trạng là tốt, đạt; Đánh dấu "X" nếu tình trạng là không đạt;', S.legendLeft)
  M(7, 1, 7, 6)  // B8:G8
  C(7, 7, 'Cần sữa chữa hay căn chỉnh (Ghi chi tiết cụ thể):', S.legendRight)
  M(7, 7, 7, 17)  // H8:R8

  // ────────────────────────────────────────────────────────────────────────────
  // ROW 8 (Excel 9): blank spacer
  // ────────────────────────────────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────────────────────────
  // ROWS 9-10 (Excel 10-11): Table column headers
  // ────────────────────────────────────────────────────────────────────────────
  // B10:B11 — empty corner cell
  M(9, COL_GROUP, 10, COL_GROUP)
  ws[XLSX.utils.encode_cell({ r: 9, c: COL_GROUP })] = { v: '', t: 's', s: { border: ab } }

  // C10:D11 — "NỘI DUNG KIỂM TRA"
  C(9, COL_C, 'NỘI DUNG KIỂM TRA', S.colHeader)
  M(9, COL_C, 10, COL_D)

  // Day name headers (row 9) + Tình trạng/Chi tiết sub-headers (row 10)
  DAYS.forEach((day, di) => {
    const sc = statusCol(di)
    const dc = detailCol(di)
    C(9, sc, DAY_HEADERS[day] ?? day, S.colHeader)
    M(9, sc, 9, dc)           // merge status+detail cols for day name
    C(10, sc, 'Tình trạng', S.subHeader)
    C(10, dc, 'Chi tiết', S.subHeader)
  })

  // ────────────────────────────────────────────────────────────────────────────
  // DATA ROWS
  // ────────────────────────────────────────────────────────────────────────────
  const obsItems = checklist.items.filter(i => i.category === 'observation')
  const opItems  = checklist.items.filter(i => i.category === 'operation')

  const OBS_START = 11
  const OP_START  = OBS_START + obsItems.length
  const OBS_END   = OP_START - 1
  const OP_END    = OP_START + opItems.length - 1

  // ── Observation group ──────────────────────────────────────────────────────
  C(OBS_START, COL_GROUP, 'OBSERVATION CHECK/ KIỂM TRA QUAN SÁT', S.groupLabel)
  M(OBS_START, COL_GROUP, OBS_END, COL_GROUP)

  obsItems.forEach((item, idx) => {
    const r = OBS_START + idx
    const isFirst = idx === 0
    const isLast  = idx === obsItems.length - 1
    const label = `${item.sub_label || item.label_en || ''}\n${item.label_vi}`
    C(r, COL_C, label, isFirst ? S.contentBold : isLast ? S.contentLg : S.content)
    M(r, COL_C, r, COL_D)
    _writeDay(ws, r, item)
  })

  // ── Operation group ────────────────────────────────────────────────────────
  C(OP_START, COL_GROUP, 'OPERATION CHECK/ KIỂM TRA VẬN HÀNH', S.groupLabel)
  M(OP_START, COL_GROUP, OP_END, COL_GROUP)

  opItems.forEach((item, idx) => {
    const r = OP_START + idx
    const isLast = idx === opItems.length - 1
    const label = `${item.sub_label || item.label_en || ''}\n${item.label_vi}`
    C(r, COL_C, label, isLast ? S.contentLg : S.content)
    M(r, COL_C, r, COL_D)
    _writeDay(ws, r, item)
  })

  // ────────────────────────────────────────────────────────────────────────────
  // SIGNATURE ROWS (không có hình/ký tên thật — chỉ nhãn)
  // ────────────────────────────────────────────────────────────────────────────
  const SIG_ROW = OP_END + 1

  // B33:B34 "KÝ TÊN"
  C(SIG_ROW, COL_GROUP, 'KÝ TÊN', S.sigLabel)
  M(SIG_ROW, COL_GROUP, SIG_ROW + 1, COL_GROUP)

  // Row SIG_ROW: Forklift driver
  C(SIG_ROW, COL_C, 'Forklift driver – Tài xế xe nâng', S.sigName)
  M(SIG_ROW, COL_C, SIG_ROW, COL_D)
  DAYS.forEach((_day, di) => {
    C(SIG_ROW, statusCol(di), '', S.sigCell)
    M(SIG_ROW, statusCol(di), SIG_ROW, detailCol(di))
  })

  // Row SIG_ROW+1: Supervisor
  C(SIG_ROW + 1, COL_C, 'Supervisor – Giám sát', S.sigName)
  M(SIG_ROW + 1, COL_C, SIG_ROW + 1, COL_D)
  DAYS.forEach((_day, di) => {
    C(SIG_ROW + 1, statusCol(di), '', S.sigCell)
    M(SIG_ROW + 1, statusCol(di), SIG_ROW + 1, detailCol(di))
  })

  // ────────────────────────────────────────────────────────────────────────────
  // NOTES SECTION
  // ────────────────────────────────────────────────────────────────────────────
  const NOTE_ROW = SIG_ROW + 2
  C(NOTE_ROW, COL_GROUP, 'Ghi chú (Các mục cần sữa chữa hay căn chỉnh): ', S.noteLabelRow)
  M(NOTE_ROW, COL_GROUP, NOTE_ROW, 17)

  const dot = '…'.repeat(180)
  for (let i = 0; i < 5; i++) {
    C(NOTE_ROW + 1 + i, COL_GROUP, dot, S.noteLine)
    M(NOTE_ROW + 1 + i, COL_GROUP, NOTE_ROW + 1 + i, 17)
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FOOTER NOTES
  // ────────────────────────────────────────────────────────────────────────────
  const FOOT_ROW = NOTE_ROW + 7  // blank spacer row between notes and footer
  C(FOOT_ROW, COL_GROUP,
    'Chú ý: Nếu xe nâng phát hiện cần phải sữa chữa hay không an toàn hoặc bất kỳ một sự cố nào đó không an toàn cần phải dừng xe, báo cáo cho người phụ trách ngay. Không được vận hành xe nâng cho tới khi đã được sữa chữa và đảm bảo an toàn.',
    S.footerBold)
  M(FOOT_ROW, COL_GROUP, FOOT_ROW, 17)

  C(FOOT_ROW + 1, COL_GROUP,
    'Nếu trong khi hoạt động mà xe có dấu hiệu không an toàn thì cần phải báo ngay với người phụ trách và không được vận hành cho tới khi xe được sữa chữa và vận hành an toàn.',
    S.footerNormal)
  M(FOOT_ROW + 1, COL_GROUP, FOOT_ROW + 1, 17)

  C(FOOT_ROW + 2, COL_GROUP,
    'Không được tự ý sữa chữa hay cân chỉnh xe nâng trừ khi bạn được cho phép.',
    S.footerNormal)
  M(FOOT_ROW + 2, COL_GROUP, FOOT_ROW + 2, 17)

  // ────────────────────────────────────────────────────────────────────────────
  // SHEET SETTINGS
  // ────────────────────────────────────────────────────────────────────────────
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: FOOT_ROW + 2, c: 17 })
  ws['!merges'] = merges

  // Column widths (exact match to sample)
  ws['!cols'] = [
    { wch: 0.43 },  // A spacer
    { wch: 6.86 },  // B group label
    { wch: 15.71 }, // C content
    { wch: 44.57 }, // D content (C:D merged)
    ...Array.from({ length: 7 }, () => [{ wch: 5.86 }, { wch: 10.86 }]).flat(),
  ]

  // Row heights (exact match to sample)
  const fixedHeights: Record<number, number> = {
    0: 21.95, 1: 22.5, 2: 22.5, 3: 6.95,
    4: 30.6,  5: 21.95, 6: 24.0, 7: 30.6, 8: 6.0,
    9: 23.1, 10: 28.5,
  }
  // Obs row heights from sample (rows 12-22)
  const obsH = [36.0, 44.45, 45.6, 42.95, 34.5, 43.5, 35.1, 35.45, 34.5, 42.95, 45.95]
  // Op row heights from sample (rows 23-32)
  const opH  = [31.5, 36.95, 45.0, 43.5, 35.45, 42.6, 43.5, 42.95, 33.6, 30.6]

  const rows: XLSX.RowInfo[] = []
  const totalRows = FOOT_ROW + 3
  for (let r = 0; r < totalRows; r++) {
    if (fixedHeights[r] !== undefined) {
      rows[r] = { hpt: fixedHeights[r] }
    } else if (r >= OBS_START && r < OP_START) {
      rows[r] = { hpt: obsH[r - OBS_START] ?? 36 }
    } else if (r >= OP_START && r <= OP_END) {
      rows[r] = { hpt: opH[r - OP_START] ?? 36 }
    } else if (r === SIG_ROW || r === SIG_ROW + 1) {
      rows[r] = { hpt: 36.95 }
    } else if (r === NOTE_ROW) {
      rows[r] = { hpt: 26.45 }
    } else if (r > NOTE_ROW && r <= NOTE_ROW + 5) {
      rows[r] = { hpt: 24.95 }
    } else if (r === NOTE_ROW + 6) {
      rows[r] = { hpt: 6.95 }
    } else {
      rows[r] = { hpt: 16.5 }
    }
  }
  ws['!rows'] = rows

  ws['!pageSetup'] = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0, fitToPage: true }

  XLSX.utils.book_append_sheet(wb, ws, 'Xe nâng hàng')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

// ─── Write status + detail cells for one item row ─────────────────────────────
function _writeDay(ws: XLSX.WorkSheet, r: number, item: CheckItem) {
  DAYS.forEach((day, di) => {
    const entry = item.days[day]
    const status = entry?.status
    const statusVal = status === 'pass' ? 'P' : status === 'fail' ? 'X' : ''
    const style = status === 'pass' ? {
      font: { bold: true, sz: 12, color: { rgb: '15803D' } },
      fill: { fgColor: { rgb: 'F0FDF4' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: thin, bottom: thin, left: thin, right: thin },
    } : status === 'fail' ? {
      font: { bold: true, sz: 12, color: { rgb: 'B91C1C' } },
      fill: { fgColor: { rgb: 'FFF1F2' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: thin, bottom: thin, left: thin, right: thin },
    } : {
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: thin, bottom: thin, left: thin, right: thin },
    }

    ws[XLSX.utils.encode_cell({ r, c: statusCol(di) })] = { v: statusVal, t: 's', s: style }
    ws[XLSX.utils.encode_cell({ r, c: detailCol(di) })] = {
      v: entry?.detail || '', t: 's',
      s: {
        alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
        border: { top: thin, bottom: thin, left: thin, right: thin },
      },
    }
  })
}
