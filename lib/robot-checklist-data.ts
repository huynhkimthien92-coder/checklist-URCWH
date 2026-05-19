// lib/robot-checklist-data.ts
// ✅ FINAL VERSION – production ready (items-based structure)

// ===== TYPES =====
export interface RobotDayEntry {
  status: 'pass' | 'fail' | ''
  note: string
  image_url?: string
}

export interface RobotCheckItem {
  id: string
  category: string
  label_vi: string
  label_en?: string
  sub_label?: string

  // ✅ SOURCE OF TRUTH
  days: Record<string, RobotDayEntry>
}

export interface RobotIncident {
  id?: string
  incident: string
  date: string
  receiver: string
  severity?: 'low' | 'medium' | 'high'
  resolved_at?: string
}

export interface RobotChecklist {
  id: string
  month: number
  year: number
  area: string
  robot_number: string
  robot_model?: string

  // ✅ MAIN DATA
  items: RobotCheckItem[]

  operator_signatures: Record<
    string,
    {
      data_url: string
      signed_at: string
      user_name: string
    } | null
  >

  supervisor_signatures: Record<
    string,
    {
      data_url: string
      signed_at: string
      user_name: string
    } | null
  >

  incidents: RobotIncident[]
  notes: string

  status: 'draft' | 'submitted' | 'reviewed' | 'approved'

  created_by: string
  created_at: string
  updated_at: string
}

// ===== TEMPLATE (KHÔNG có days) =====
export const ROBOT_CHECKLIST_TEMPLATE = [
  // ===== QUAN SÁT =====
  {
    id: 'r_obs_01',
    category: 'Quan sát',
    label_vi: 'Gãy vỡ – Các chi tiết không bị cong, vỡ',
  },
  {
    id: 'r_obs_02',
    category: 'Quan sát',
    label_vi: 'Rò rỉ – Không rò rỉ dầu/nước',
  },
  {
    id: 'r_obs_03',
    category: 'Quan sát',
    label_vi: 'Bộ truyền động – Không mài mòn',
  },

  // ===== HOẠT ĐỘNG =====
  {
    id: 'r_op_01',
    category: 'Hoạt động',
    label_vi: 'Khởi động – Hoạt động bình thường',
  },
  {
    id: 'r_op_02',
    category: 'Hoạt động',
    label_vi: 'Di chuyển – Mượt, không giật',
  },
  {
    id: 'r_op_03',
    category: 'Hoạt động',
    label_vi: 'Phanh – Hoạt động tốt',
  },

  // ===== KHU VỰC =====
  {
    id: 'r_work_01',
    category: 'Khu vực',
    label_vi: 'Khu vực sạch sẽ',
  },
  {
    id: 'r_work_02',
    category: 'Khu vực',
    label_vi: 'Đường đi thông thoáng',
  },

  // ===== AN TOÀN =====
  {
    id: 'r_safe_01',
    category: 'An toàn',
    label_vi: 'Không có người vùng nguy hiểm',
  },
] as const

// ===== ✅ BUILD INITIAL ITEMS (QUAN TRỌNG NHẤT) =====
export function buildInitialRobotItems(
  template: typeof ROBOT_CHECKLIST_TEMPLATE,
  month: number,
  year: number
): RobotCheckItem[] {

  const daysInMonth = new Date(year, month, 0).getDate()

  return template.map(item => {
    const days: Record<string, RobotDayEntry> = {}

    for (let d = 1; d <= daysInMonth; d++) {
      days[String(d)] = {
        status: '',
        note: '',
        image_url: ''
      }
    }

    return {
      ...item,
      days
    }
  })
}

// ===== HELPERS =====

// ✅ số ngày trong tháng
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

// ✅ danh sách category
export function getRobotCategories(items: RobotCheckItem[]): string[] {
  return Array.from(new Set(items.map(i => i.category)))
}

// ✅ thống kê 1 ngày
export function getDayStats(items: RobotCheckItem[], day: string) {
  const total = items.length
  const pass = items.filter(i => i.days?.[day]?.status === 'pass').length
  const fail = items.filter(i => i.days?.[day]?.status === 'fail').length
  const pending = total - pass - fail

  const passRate = total > 0
    ? Math.round((pass / total) * 100)
    : 0

  return { total, pass, fail, pending, passRate }
}

// ✅ lấy các ngày có data
export function getDaysWithData(items: RobotCheckItem[]): string[] {
  const days = new Set<string>()

  items.forEach(item => {
    Object.entries(item.days || {}).forEach(([day, entry]) => {
      if (entry.status === 'pass' || entry.status === 'fail') {
        days.add(day)
      }
    })
  })

  return Array.from(days)
}
