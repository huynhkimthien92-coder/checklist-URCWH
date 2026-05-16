// lib/robot-checklist-data.ts
// Dữ liệu template cho checklist robot (theo ngày trong tháng)
// Cải thiện từ checklist xe nâng với cấu trúc phong phú hơn

export interface RobotDayEntry {
  status: 'pass' | 'fail' | ''
  note: string
  image_url?: string
}

export interface RobotCheckItem {
  id: string
  category: string       // "An toàn" | "Khu vực làm việc" | "Thiết bị truyền động" | "Quan sát" | "Hoạt động"
  label_vi: string
  label_en?: string
  sub_label?: string
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
  area: string           // mặc định "MROBOT"
  robot_number: string   // tên/số robot
  robot_model?: string   // Model robot
  items: RobotCheckItem[]
  // key: "1" → "31" (ngày trong tháng)
  day_entries: Record<string, Record<string, RobotDayEntry>>
  // chữ ký từng ngày
  operator_signatures: Record<string, { data_url: string; signed_at: string; user_name: string } | null>
  supervisor_signatures: Record<string, { data_url: string; signed_at: string; user_name: string } | null>
  incidents: RobotIncident[]
  notes: string
  status: 'draft' | 'submitted' | 'reviewed' | 'approved'
  created_by: string
  created_at: string
  updated_at: string
}

// ========== ROBOT CHECKLIST TEMPLATE ==========
export const ROBOT_CHECKLIST_TEMPLATE: RobotCheckItem[] = [
  // ===== CATEGORY: QUAN SÁT (Observation) =====
  // Cơ cấu vật lý và hư hỏng
  {
    id: 'r_obs_01',
    category: 'Quan sát',
    label_vi: 'Gãy vỡ – Các chi tiết, vỏ bảo vệ không bị cong, vỡ hay bể?',
    label_en: 'Damage – Bent, dented or broken parts/covers',
    sub_label: 'Damage – Gãy vỡ',
  },
  {
    id: 'r_obs_02',
    category: 'Quan sát',
    label_vi: 'Rò rỉ – Các bộ phận điện, pin, động cơ có bị rò rỉ dầu/nước không?',
    label_en: 'Leaks – Any signs of leak from motor, battery, or oil',
    sub_label: 'Leaks – Rò rỉ',
  },
  {
    id: 'r_obs_03',
    category: 'Quan sát',
    label_vi: 'Bộ phận truyền động – Xích, dây đai, bánh răng không bị rỉ sét, mài mòn?',
    label_en: 'Drive System – Chain/Belt/Gears free of rust and wear',
    sub_label: 'Drive System – Truyền động',
  },
  {
    id: 'r_obs_04',
    category: 'Quan sát',
    label_vi: 'Bánh xe – Không bị nứt, bể, mòn quá mức? Không bị lệch hướng, cấn cứng?',
    label_en: 'Wheels/Tires – No cracks, excessive wear, misalignment',
    sub_label: 'Wheels/Tires – Bánh xe',
  },
  {
    id: 'r_obs_05',
    category: 'Quan sát',
    label_vi: 'Kết nối điện – Các dắc, phích cắm chắc chắn, không bị oxi hóa, cháy xém?',
    label_en: 'Electrical connections – Secure, no corrosion or burn marks',
    sub_label: 'Electrical – Kết nối điện',
  },
  {
    id: 'r_obs_06',
    category: 'Quan sát',
    label_vi: 'Pin/Bình điện – Mực nước, thông hơi hoạt động? Vỏ pin không có vết nứt, phồng?',
    label_en: 'Battery – Water level, vents clear, no cracks or swelling',
    sub_label: 'Battery – Pin/Bình điện',
  },
  {
    id: 'r_obs_07',
    category: 'Quan sát',
    label_vi: 'Che chắn an toàn – Khung bảo vệ, che chắn động cơ chắc chắn, không bị lỏng?',
    label_en: 'Guards & Covers – Secure, no loose parts',
    sub_label: 'Guards – Che chắn',
  },
  {
    id: 'r_obs_08',
    category: 'Quan sát',
    label_vi: 'Cảm biến & Công tắc – Không bị bụi, bẩn, đặt vị trí chính xác?',
    label_en: 'Sensors & Switches – Clean, properly positioned',
    sub_label: 'Sensors – Cảm biến',
  },
  {
    id: 'r_obs_09',
    category: 'Quan sát',
    label_vi: 'Dây cáp & Ống – Không bị mài mòn, nứt, bẻ cong, được buộc chắc chắn?',
    label_en: 'Cables & Hoses – No wear, cracks, kinks, properly secured',
    sub_label: 'Cables – Dây cáp',
  },
  {
    id: 'r_obs_10',
    category: 'Quan sát',
    label_vi: 'Biển cảnh báo – Nhãn dán, chỉ dẫn an toàn không mờ nhòe, rách, mất?',
    label_en: 'Warning Labels – Clear, legible, all in place',
    sub_label: 'Labels – Biển cảnh báo',
  },
  {
    id: 'r_obs_11',
    category: 'Quan sát',
    label_vi: 'Vệ sinh – Robot sạch sẽ, không có bụi/bẩn tích tụ ở các khe hở?',
    label_en: 'Cleanliness – No debris or buildup in crevices',
    sub_label: 'Cleanliness – Vệ sinh',
  },
  {
    id: 'r_obs_12',
    category: 'Quan sát',
    label_vi: 'Đồng hồ giờ/Odometer – Ghi lại số giờ hoạt động',
    label_en: 'Hour meter/Odometer – Record operating hours',
    sub_label: 'Hour meter – Đồng hồ giờ',
  },

  // ===== CATEGORY: HOẠT ĐỘNG (Operation) =====
  {
    id: 'r_op_01',
    category: 'Hoạt động',
    label_vi: 'Khởi động – Robot khởi động bình thường, không có âm thanh lạ?',
    label_en: 'Startup – Normal startup, no unusual sounds',
    sub_label: 'Startup – Khởi động',
  },
  {
    id: 'r_op_02',
    category: 'Hoạt động',
    label_vi: 'Điều khiển di chuyển – Kiểm tra chuyển động tiến, lùi, quay có trơn mượt, không rơ?',
    label_en: 'Movement – Forward, reverse, rotation smooth, no binding',
    sub_label: 'Movement – Di chuyển',
  },
  {
    id: 'r_op_03',
    category: 'Hoạt động',
    label_vi: 'Tốc độ – Tốc độ tối đa, tối thiểu hoạt động bình thường?',
    label_en: 'Speed Control – Max/min speeds functioning properly',
    sub_label: 'Speed – Tốc độ',
  },
  {
    id: 'r_op_04',
    category: 'Hoạt động',
    label_vi: 'Dừng – Dừng khẩn cấp, dừng bình thường hoạt động tốt, khoảng cách dừng hợp lý?',
    label_en: 'Braking – Emergency & normal stop working, adequate stopping distance',
    sub_label: 'Braking – Dừng',
  },
  {
    id: 'r_op_05',
    category: 'Hoạt động',
    label_vi: 'Cảm biến an toàn – Cảm biến xung quanh hoạt động, robot dừng lại khi có vật cản?',
    label_en: 'Safety Sensors – Perimeter sensors detecting obstacles',
    sub_label: 'Safety Sensors – Cảm biến',
  },
  {
    id: 'r_op_06',
    category: 'Hoạt động',
    label_vi: 'Thiết bị cảnh báo – Đèn, còi, LCD/Màn hình hoạt động tốt?',
    label_en: 'Warning Devices – Lights, buzzer, display functioning',
    sub_label: 'Warning Devices – Cảnh báo',
  },
  {
    id: 'r_op_07',
    category: 'Hoạt động',
    label_vi: 'Hệ thống định vị – GPS/Lidar/RFID hoạt động chính xác?',
    label_en: 'Positioning System – GPS/Lidar/RFID accurate',
    sub_label: 'Positioning – Định vị',
  },
  {
    id: 'r_op_08',
    category: 'Hoạt động',
    label_vi: 'Pin/Năng lượng – Mức pin đầy đủ, thời gian sạc/hoạt động bình thường?',
    label_en: 'Battery/Power – Full charge, normal run time',
    sub_label: 'Battery – Pin',
  },
  {
    id: 'r_op_09',
    category: 'Hoạt động',
    label_vi: 'Kết nối liên lạc – WiFi/Bluetooth/Mạng hoạt động ổn định?',
    label_en: 'Communication – WiFi/Bluetooth/Network stable',
    sub_label: 'Communication – Liên lạc',
  },
  {
    id: 'r_op_10',
    category: 'Hoạt động',
    label_vi: 'Nhiệm vụ tự động – Hoàn thành tuyến đường/nhiệm vụ mà không lỗi?',
    label_en: 'Autonomous Task – Completes route/task without errors',
    sub_label: 'Task – Nhiệm vụ',
  },

  // ===== CATEGORY: KHU VỰC LÀM VIỆC (Work Area) =====
  {
    id: 'r_work_01',
    category: 'Khu vực làm việc',
    label_vi: 'Không gian hoạt động – Khu vực phải thông thoáng, không có chướng ngại vật?',
    label_en: 'Operating Space – Clear, no obstructions',
    sub_label: 'Space – Không gian',
  },
  {
    id: 'r_work_02',
    category: 'Khu vực làm việc',
    label_vi: 'Đường dẫn/Lộ trình – Đường dẫn sạch sẽ, không có vật thể rơi, rác, dầu nhớt?',
    label_en: 'Path/Route – Clean, no spills, debris, or oil',
    sub_label: 'Path – Lộ trình',
  },
  {
    id: 'r_work_03',
    category: 'Khu vực làm việc',
    label_vi: 'Điều kiện ánh sáng – Đủ ánh sáng, không có bóng tối mù mịt?',
    label_en: 'Lighting – Adequate, no dark spots',
    sub_label: 'Lighting – Ánh sáng',
  },
  {
    id: 'r_work_04',
    category: 'Khu vực làm việc',
    label_vi: 'Điều kiện thời tiết – Không có mưa, tuyết, độ ẩm bất thường?',
    label_en: 'Weather – No rain, snow, extreme humidity',
    sub_label: 'Weather – Thời tiết',
  },
  {
    id: 'r_work_05',
    category: 'Khu vực làm việc',
    label_vi: 'Cơ sở hạ tầng – Sàn, ramp, cầu không bị hư hỏng, không an toàn?',
    label_en: 'Infrastructure – Floor, ramps, bridges in good condition',
    sub_label: 'Infrastructure – Cơ sở',
  },

  // ===== CATEGORY: AN TOÀN (Safety) =====
  {
    id: 'r_safe_01',
    category: 'An toàn',
    label_vi: 'Nhân viên gần robot – Có an toàn, không có người ở vùng nguy hiểm?',
    label_en: 'Personnel Proximity – Safe distance, no one in danger zone',
    sub_label: 'Personnel – Nhân viên',
  },
  {
    id: 'r_safe_02',
    category: 'An toàn',
    label_vi: 'Quy định an toàn – Tuân thủ quy định an toàn lao động, bảo vệ lao động?',
    label_en: 'Safety Rules – Compliance with safety regulations',
    sub_label: 'Rules – Quy định',
  },
  {
    id: 'r_safe_03',
    category: 'An toàn',
    label_vi: 'Trang bị bảo vệ – Nhân viên mang đủ trang bị bảo vệ cá nhân?',
    label_en: 'PPE – Personnel wearing proper protective equipment',
    sub_label: 'PPE – Trang bị',
  },
]

// ========== HELPER FUNCTIONS ==========

export function createEmptyRobotDayEntries(): Record<string, RobotDayEntry> {
  return Object.fromEntries(
    ROBOT_CHECKLIST_TEMPLATE.map(item => [
      item.id,
      { status: '' as const, note: '', image_url: '' }
    ])
  )
}

/** Tạo số ngày trong tháng */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

/** Lấy danh sách các category từ template */
export function getRobotChecklistCategories(): string[] {
  const categories = new Set<string>()
  ROBOT_CHECKLIST_TEMPLATE.forEach(item => {
    categories.add(item.category)
  })
  return Array.from(categories)
}

/** Lấy các items theo category */
export function getItemsByCategory(category: string): RobotCheckItem[] {
  return ROBOT_CHECKLIST_TEMPLATE.filter(item => item.category === category)
}

/** Tính tổng số item pass/fail cho một ngày */
export function getDayStatistics(dayEntries: Record<string, RobotDayEntry>): {
  total: number
  pass: number
  fail: number
  pending: number
  passRate: number
} {
  const values = Object.values(dayEntries)
  const total = values.length
  const pass = values.filter(e => e.status === 'pass').length
  const fail = values.filter(e => e.status === 'fail').length
  const pending = values.filter(e => e.status === '').length
  const passRate = total > 0 ? Math.round((pass / total) * 100) : 0

  return { total, pass, fail, pending, passRate }
}

/** Tính tổng thống kê cho toàn bộ tháng */
export function getMonthStatistics(
  dayEntries: Record<string, Record<string, RobotDayEntry>>
): Record<number, { total: number; pass: number; fail: number; pending: number; passRate: number }> {
  const stats: Record<number, any> = {}

  Object.entries(dayEntries).forEach(([day, entries]) => {
    stats[parseInt(day)] = getDayStatistics(entries)
  })

  return stats
}
