// lib/robot-checklist-data.ts
// ✅ CLEAN VERSION – easy to maintain

// ================= TYPES =================
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
  days: Record<string, RobotDayEntry>
}
export interface RobotIncident {export interface Robot id?: string
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

  items: RobotCheckItem[]

  operator_signatures: Record<string, any>
  supervisor_signatures: Record<string, any>
  incidents: RobotIncident[]

  notes: string
  status: 'draft' | 'submitted' | 'reviewed' | 'approved'
  created_by?: string
  created_at: string
  updated_at?: string
}

// ================= TEMPLATE =================

// 👉 helper để giảm lặp code
function createItem(
  id: string,
  category: string,
  label_vi: string,
  label_en: string,
  sub_label: string
) {
  return { id, category, label_vi, label_en, sub_label }
}

// ===== CATEGORY: QUAN SÁT =====
const OBSERVATION = [
  createItem('r_obs_01', 'Quan sát',
    'Gãy vỡ – Các chi tiết không cong, vỡ',
    'Damage – Broken parts',
    'Damage'),

  createItem('r_obs_02', 'Quan sát',
    'Rò rỉ – Không rò dầu/nước',
    'Leaks – No fluid leak',
    'Leak'),

  createItem('r_obs_03', 'Quan sát',
    'Truyền động – Không mài mòn',
    'Drive system OK',
    'Drive'),

  createItem('r_obs_04', 'Quan sát',
    'Bánh xe – Không nứt/mòn',
    'Wheels OK',
    'Wheels'),

  createItem('r_obs_05', 'Quan sát',
    'Kết nối điện – Không cháy/lỏng',
    'Electrical connections OK',
    'Electrical'),

  createItem('r_obs_06', 'Quan sát',
    'Pin – Không phồng, đủ điện',
    'Battery OK',
    'Battery'),

  createItem('r_obs_07', 'Quan sát',
    'Che chắn – Không lỏng',
    'Guards secure',
    'Guards'),

  createItem('r_obs_08', 'Quan sát',
    'Cảm biến – Sạch, đúng vị trí',
    'Sensors clean',
    'Sensors'),

  createItem('r_obs_09', 'Quan sát',
    'Dây cáp – Không đứt/mòn',
    'Cables intact',
    'Cables'),

  createItem('r_obs_10', 'Quan sát',
    'Biển cảnh báo – Đầy đủ',
    'Labels available',
    'Labels'),

  createItem('r_obs_11', 'Quan sát',
    'Vệ sinh – Không bám bẩn',
    'Cleanliness',
    'Clean'),

  createItem('r_obs_12', 'Quan sát',
    'Đồng hồ giờ – Ghi lại',
    'Hour meter',
    'Hour'),
]

// ===== CATEGORY: HOẠT ĐỘNG =====
const OPERATION = [
  createItem('r_op_01', 'Hoạt động', 'Khởi động bình thường', 'Startup OK', 'Startup'),
  createItem('r_op_02', 'Hoạt động', 'Di chuyển mượt', 'Movement OK', 'Move'),
  createItem('r_op_03', 'Hoạt động', 'Tốc độ ổn định', 'Speed OK', 'Speed'),
  createItem('r_op_04', 'Hoạt động', 'Phanh hoạt động tốt', 'Brake OK', 'Brake'),
  createItem('r_op_05', 'Hoạt động', 'Cảm biến an toàn hoạt động', 'Safety sensors OK', 'Sensor'),
  createItem('r_op_06', 'Hoạt động', 'Đèn/còi hoạt động', 'Warning devices OK', 'Warning'),
  createItem('r_op_07', 'Hoạt động', 'Định vị chính xác', 'Positioning OK', 'Position'),
  createItem('r_op_08', 'Hoạt động', 'Pin đủ', 'Battery level OK', 'Battery'),
  createItem('r_op_09', 'Hoạt động', 'Kết nối ổn định', 'Connection OK', 'Connection'),
  createItem('r_op_10', 'Hoạt động', 'Hoàn thành nhiệm vụ', 'Task completed', 'Task'),
]

// ===== CATEGORY: KHU VỰC =====
const WORK_AREA = [
  createItem('r_work_01', 'Khu vực', 'Khu vực sạch', 'Clean area', 'Area'),
  createItem('r_work_02', 'Khu vực', 'Không vật cản', 'No obstruction', 'Path'),
  createItem('r_work_03', 'Khu vực', 'Ánh sáng đủ', 'Lighting OK', 'Light'),
  createItem('r_work_04', 'Khu vực', 'Không ẩm ướt', 'Dry condition', 'Weather'),
  createItem('r_work_05', 'Khu vực', 'Sàn an toàn', 'Floor safe', 'Floor'),
]

// ===== CATEGORY: AN TOÀN =====
const SAFETY = [
  createItem('r_safe_01', 'An toàn', 'Không người gần robot', 'No personnel danger', 'Personnel'),
  createItem('r_safe_02', 'An toàn', 'Tuân thủ quy định', 'Safety rules', 'Rules'),
  createItem('r_safe_03', 'An toàn', 'PPE đầy đủ', 'PPE used', 'PPE'),
]

// ===== EXPORT TEMPLATE =====
export const ROBOT_CHECKLIST_TEMPLATE: Omit<RobotCheckItem, 'days'>[] = [
  ...OBSERVATION,
  ...OPERATION,
  ...WORK_AREA,
  ...SAFETY,
]

// ================= BUILD ITEMS =================
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
        image_url: '',
      }
    }

    return { ...item, days }
  })
}

// ================= HELPERS =================
export function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}
