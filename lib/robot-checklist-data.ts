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
    'Gãy vỡ – Các chi tiết, vỏ bảo vệ không bị cong, vỡ hay bể?',
    'Damage – Bent, dented or broken parts/covers',
    'Damage – Gãy vỡ'),

  createItem('r_obs_02', 'Quan sát',
    'Rò rỉ – Các bộ phận điện, pin, động cơ có bị rò rỉ dầu/nước không?',
    'Leaks – Any signs of leak from motor, battery, or oil',
    'Leaks – Rò rỉ'),

  createItem('r_obs_03', 'Quan sát',
    'Bộ phận truyền động – Xích, dây đai, bánh răng không bị rỉ sét, mài mòn?',
    'Drive System – Chain/Belt/Gears free of rust and wear',
    'Drive System – Truyền động'),

  createItem('r_obs_04', 'Quan sát',
    'Bánh xe – Không bị nứt, bể, mòn quá mức? Không bị lệch hướng, cấn cứng?',
    'Wheels/Tires – No cracks, excessive wear, misalignment',
    'Wheels/Tires – Bánh xe'),

  createItem('r_obs_05', 'Quan sát',
    'Kết nối điện – Các dắc, phích cắm chắc chắn, không bị oxi hóa, cháy xém?',
    'Electrical connections – Secure, no corrosion or burn marks',
    'Electrical – Kết nối điện'),

  createItem('r_obs_06', 'Quan sát',
    'Pin/Bình điện – Mực nước, thông hơi hoạt động? Vỏ pin không có vết nứt, phồng?',
    'Battery – Water level, vents clear, no cracks or swelling',
    'Battery – Pin/Bình điện'),

  createItem('r_obs_07', 'Quan sát',
    'Che chắn an toàn – Khung bảo vệ, che chắn động cơ chắc chắn, không bị lỏng?',
    'Guards & Covers – Secure, no loose parts',
    'Guards – Che chắn'),

  createItem('r_obs_08', 'Quan sát',
    'Cảm biến & Công tắc – Không bị bụi, bẩn, đặt vị trí chính xác?',
    'Sensors & Switches – Clean, properly positioned',
    'Sensors – Cảm biến'),

  createItem('r_obs_09', 'Quan sát',
    'Dây cáp & Ống – Không bị mài mòn, nứt, bẻ cong, được buộc chắc chắn?',
    'Cables & Hoses – No wear, cracks, kinks, properly secured',
    'Cables – Dây cáp'),

  createItem('r_obs_10', 'Quan sát',
    'Biển cảnh báo – Nhãn dán, chỉ dẫn an toàn không mờ nhòe, rách, mất?',
    'Warning Labels – Clear, legible, all in place',
    'Labels – Biển cảnh báo'),

  createItem('r_obs_11', 'Quan sát',
    'Vệ sinh – Robot sạch sẽ, không có bụi/bẩn tích tụ ở các khe hở?',
    'Cleanliness – No debris or buildup in crevices',
    'Cleanliness – Vệ sinh'),

  createItem('r_obs_12', 'Quan sát',
    'Đồng hồ giờ/Odometer – Ghi lại số giờ hoạt động',
    'Hour meter/Odometer – Record operating hours',
    'Hour meter – Đồng hồ giờ'),
]

// ===== CATEGORY: HOẠT ĐỘNG =====
const OPERATION = [
  createItem('r_op_01', 'Hoạt động', 'Khởi động – Robot khởi động bình thường, không có âm thanh lạ?','Startup – Normal startup, no unusual sounds','Startup – Khởi động'),
  createItem('r_op_02', 'Hoạt động', 'Điều khiển di chuyển – Kiểm tra chuyển động tiến, lùi, quay có trơn mượt, không rơ?''Movement – Forward, reverse, rotation smooth, no binding','Movement – Di chuyển'),
  createItem('r_op_03', 'Hoạt động', 'Tốc độ – Tốc độ tối đa, tối thiểu hoạt động bình thường?','Speed Control – Max/min speeds functioning properly','Speed – Tốc độ'),
  createItem('r_op_04', 'Hoạt động', 'Dừng – Dừng khẩn cấp, dừng bình thường hoạt động tốt, khoảng cách dừng hợp lý?','Braking – Emergency & normal stop working, adequate stopping distance','Braking – Dừng'),
  createItem('r_op_05', 'Hoạt động', 'Cảm biến an toàn – Cảm biến xung quanh hoạt động, robot dừng lại khi có vật cản?','Safety Sensors – Perimeter sensors detecting obstacles','Safety Sensors – Cảm biến'),
  createItem('r_op_06', 'Hoạt động', 'Thiết bị cảnh báo – Đèn, còi, LCD/Màn hình hoạt động tốt?','Warning Devices – Lights, buzzer, display functioning','Warning Devices – Cảnh báo'),
  createItem('r_op_07', 'Hoạt động', 'Hệ thống định vị – GPS/Lidar/RFID hoạt động chính xác?','Positioning System – GPS/Lidar/RFID accurate','Positioning – Định vị'),
  createItem('r_op_08', 'Hoạt động', 'Pin/Năng lượng – Mức pin đầy đủ, thời gian sạc/hoạt động bình thường?','Battery/Power – Full charge, normal run time','Battery – Pin'),
  createItem('r_op_09', 'Hoạt động', 'Kết nối liên lạc – WiFi/Bluetooth/Mạng hoạt động ổn định?','Communication – WiFi/Bluetooth/Network stable','Communication – Liên lạc'),
  createItem('r_op_10', 'Hoạt động', 'Nhiệm vụ tự động – Hoàn thành tuyến đường/nhiệm vụ mà không lỗi?','Autonomous Task – Completes route/task without errors','Task – Nhiệm vụ'),
]

// ===== CATEGORY: KHU VỰC =====
const WORK_AREA = [
  createItem('r_work_01', 'Khu vực làm việc', 'Không gian hoạt động – Khu vực phải thông thoáng, không có chướng ngại vật?','Operating Space – Clear, no obstructions','Space – Không gian'),
  createItem('r_work_02', 'Khu vực làm việc', 'Đường dẫn/Lộ trình – Đường dẫn sạch sẽ, không có vật thể rơi, rác, dầu nhớt?','Path/Route – Clean, no spills, debris, or oil','Path – Lộ trình'),
  createItem('r_work_03', 'Khu vực làm việc', 'Điều kiện ánh sáng – Đủ ánh sáng, không có bóng tối mù mịt?','Lighting – Adequate, no dark spots','Lighting – Ánh sáng'),
  createItem('r_work_04', 'Khu vực làm việc', 'Điều kiện thời tiết – Không có mưa, tuyết, độ ẩm bất thường?','Weather – No rain, snow, extreme humidity','Weather – Thời tiết'),
  createItem('r_work_05', 'Khu vực làm việc', 'Cơ sở hạ tầng – Sàn, ramp, cầu không bị hư hỏng, không an toàn?','Infrastructure – Floor, ramps, bridges in good condition','Infrastructure – Cơ sở'),
]

// ===== CATEGORY: AN TOÀN =====
const SAFETY = [
  createItem('r_safe_01', 'An toàn', 'Nhân viên gần robot – Có an toàn, không có người ở vùng nguy hiểm?','Personnel Proximity – Safe distance, no one in danger zone','Personnel – Nhân viên'),
  createItem('r_safe_02', 'An toàn', 'Quy định an toàn – Tuân thủ quy định an toàn lao động, bảo vệ lao động?','Safety Rules – Compliance with safety regulations','Rules – Quy định'),
  createItem('r_safe_03', 'An toàn', 'Trang bị bảo vệ – Nhân viên mang đủ trang bị bảo vệ cá nhân?','PPE – Personnel wearing proper protective equipment','PPE – Trang bị'),
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
