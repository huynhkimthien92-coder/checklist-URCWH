// lib/robot-checklist-data.ts
// ✅ FINAL VERSION – server-driven giống checklist xe nâng

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

  // ✅ QUAN TRỌNG NHẤT
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

  // ✅ SOURCE OF TRUTH
  items: RobotCheckItem[]

  operator_signatures: Record<string, any>
  supervisor_signatures: Record<string, any>
  incidents: RobotIncident[]
  notes: string

  status: 'draft' | 'submitted' | 'reviewed' | 'approved'

  created_by: string
  created_at: string
  updated_at: string
}

// ===== TEMPLATE (KHÔNG CÓ days) =====
export const ROBOT_CHECKLIST_TEMPLATE = [
  {
    id: 'r_obs_01',
    category: 'Quan sát',
    label_vi: 'Gãy vỡ – Các chi tiết...',
    label_en: 'Damage',
    sub_label: 'Damage',
  },
  {
    id: 'r_obs_02',
    category: 'Quan sát',
    label_vi: 'Rò rỉ – Các bộ phận...',
    label_en: 'Leaks',
    sub_label: 'Leaks',
  },
  // 👉 giữ nguyên toàn bộ template của bạn ở đây
] as const

// ===== ✅ INIT ITEMS (QUAN TRỌNG NHẤT) =====
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
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function getRobotChecklistCategories(items: RobotCheckItem[]): string[] {
  return Array.from(new Set(items.map(i => i.category)))
}

// ✅ dùng trực tiếp items (không còn day_entries)
export function getDayStatistics(items: RobotCheckItem[], day: string) {
  const total = items.length

  const pass = items.filter(i => i.days?.[day]?.status === 'pass').length
  const fail = items.filter(i => i.days?.[day]?.status === 'fail').length
  const pending = total - pass - fail

  const passRate = total > 0 ? Math.round((pass / total) * 100) : 0

  return { total, pass, fail, pending, passRate }
}
