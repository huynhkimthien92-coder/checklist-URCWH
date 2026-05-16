// lib/robot-checklist-data.ts
// Dữ liệu template cho checklist robot (theo ngày trong tháng)

export interface RobotDayEntry {
  status: 'pass' | 'fail' | ''
  note: string
}

export interface RobotCheckItem {
  id: string
  category: string       // "An toàn" | "Khu vực làm việc" | "Thiết bị truyền động"
  label_vi: string
}

export interface RobotIncident {
  incident: string
  date: string
  receiver: string
}

export interface RobotChecklist {
  id: string
  month: number
  year: number
  area: string           // mặc định "MROBOT"
  robot_number: string   // tên/số robot
  items: RobotCheckItem[]
  // key: "1" → "31" (ngày trong tháng)
  day_entries: Record<string, Record<string, RobotDayEntry>>
  // chữ ký từng ngày
  operator_signatures: Record<string, { data_url: string; signed_at: string; user_name: string } | null>
  supervisor_signatures: Record<string, { data_url: string; signed_at: string; user_name: string } | null>
  incidents: RobotIncident[]
  notes: string
  status: 'draft' | 'submitted' | 'reviewed'
  created_by: string
  created_at: string
  updated_at: string
}

export const ROBOT_CHECKLIST_TEMPLATE: Omit<RobotCheckItem, never>[] = [
  // An toàn
  { id: 'r_01', category: 'An toàn', label_vi: 'Bộ phận truyền động không bị giãn/đứt/hư hỏng?' },
  { id: 'r_02', category: 'An toàn', label_vi: 'Che chắn truyền động di chuyển linh hoạt, không bị kẹt?' },
  { id: 'r_03', category: 'An toàn', label_vi: 'Pin còn có tình trạng hoạt động tốt? Không có dấu hiệu hư hỏng? Các dắc kết nối với pin chắc chắn, không lỏng lẻo?' },
  { id: 'r_04', category: 'An toàn', label_vi: 'Nút dừng khẩn cấp, các cảm biến an toàn đảm bảo tình trạng hoạt động tốt?' },
  { id: 'r_05', category: 'An toàn', label_vi: 'Bánh xe di chuyển và bánh xe dẫn hướng có tình trạng tốt, không bị nứt, bể. Không bị mài mòn quá mức?' },
  { id: 'r_06', category: 'An toàn', label_vi: 'Các bộ phận trên thiết bị được kết nối chắc chắn, không bị lỏng lẻo, rơ, rung lắc?' },
  { id: 'r_07', category: 'An toàn', label_vi: 'Biển nhãn cảnh báo, hướng dẫn không mờ nhòe/rách/hư hỏng?' },
  { id: 'r_08', category: 'An toàn', label_vi: 'Các nút điều khiển, công tắc hoạt động hiệu quả, không bị hư hỏng bất thường?' },
  // Khu vực làm việc
  { id: 'r_09', category: 'Khu vực làm việc', label_vi: 'Khu vực vận hành phải thông thoáng, sạch sẽ, gọn gàng? Không có nguy cơ trơn trượt, vấp ngã, không có chướng ngại vật?' },
  // Thiết bị truyền động
  { id: 'r_10', category: 'Thiết bị truyền động', label_vi: 'Kiểm tra tình trạng hoạt động, máy hoạt động tốt, không có dấu hiệu bất thường?' },
]

export function createEmptyRobotDayEntries(): Record<string, RobotDayEntry> {
  return Object.fromEntries(
    ROBOT_CHECKLIST_TEMPLATE.map(item => [
      item.id,
      { status: '' as const, note: '' }
    ])
  )
}

/** Tạo số ngày trong tháng */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}
