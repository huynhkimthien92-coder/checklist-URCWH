import { CheckItem } from "@/types"

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export const DAY_LABELS: Record<string, string> = {
  mon: "Thứ Hai",
  tue: "Thứ Ba",
  wed: "Thứ Tư",
  thu: "Thứ Năm",
  fri: "Thứ Sáu",
  sat: "Thứ Bảy",
  sun: "Chủ Nhật"
}

export function createEmptyDays() {
  return Object.fromEntries(
    DAYS.map((d) => [
      d,
      { status: "" as const, detail: "", image_url: "" }
    ])
  )
}

export const CHECKLIST_TEMPLATE: Omit<CheckItem, "days">[] = [
  {
    id: "obs_01",
    category: "observation",
    label_vi: "Gãy vỡ – Các chi tiết không bị cong, vỡ hay bể?",
    label_en: "Damage – Bent, dented or broken parts",
    sub_label: "Damage – Gãy vỡ",
  },
  {
    id: "obs_02",
    category: "observation",
    label_vi: "Rò rỉ – Bộ dẫn động cơ, thắng, dầu thủy lực có bị rò rỉ không?",
    label_en: "Leaks – Any signs of leak or smell of hydraulics",
    sub_label: "Leaks – Rò rỉ",
  },
  {
    id: "obs_03",
    category: "observation",
    label_vi: "Két nước – Kiểm tra mực nước trong két nước có đảm bảo không?",
    label_en: "Radiator – Check radiator level",
    sub_label: "Radiator – Két nước",
  },
  {
    id: "obs_04",
    category: "observation",
    label_vi: "Lốp & bánh xe – Lốp có xẹp, mòn hay nứt không? Vành bánh xe có cong, nứt bể?",
    label_en: "Tires & Wheels – Are the tires flat or worn",
    sub_label: "Tires & Wheels – Lốp & bánh xe",
  },
  {
    id: "obs_05",
    category: "observation",
    label_vi: "Càng nâng/nĩa – Chắc chắn, không bị cong, nứt, mòn?",
    label_en: "Forks – Secure, not bent, cracked or worn",
    sub_label: "Forks – Nĩa",
  },
  {
    id: "obs_06",
    category: "observation",
    label_vi: "Xích, cáp và dây – Đúng vị trí, không bị rỉ sét, mài mòn, chặt và bôi trơn?",
    label_en: "Chains, Cable & Hose – Chain tight, in place and lubed",
    sub_label: "Chains, Cable & Hose",
  },
  {
    id: "obs_07",
    category: "observation",
    label_vi: "Đồng hồ giờ chạy – Số giờ hoạt động",
    label_en: "Hour meter – Operating hours",
    sub_label: "Hour meter – Đồng hồ giờ",
  },
  {
    id: "obs_08",
    category: "observation",
    label_vi: "Bình ắc quy/điện – Mực nước, thông hơi, vệ sinh",
    label_en: "Battery – Water level, cap in place, cleanliness",
    sub_label: "Battery – Bình ắc quy",
  },
  {
    id: "obs_09",
    category: "observation",
    label_vi: "Phích cắm ắc quy – Kiểm tra độ chắc chắn, không bị cháy xém?",
    label_en: "Battery connector – Cracked, burnt, tight fitting",
    sub_label: "Battery connector – Phích cắm",
  },
  {
    id: "obs_10",
    category: "observation",
    label_vi: "Khung bảo vệ – Trên đầu, khung đỡ lái chắc chắn, đảm bảo chức năng chống vật rơi?",
    label_en: "Guards – Overhead, load backrest, battery retainer",
    sub_label: "Guards – Khung bảo vệ",
  },
  {
    id: "obs_11",
    category: "observation",
    label_vi: "Khoang lái – Tất cả điều khiển, vô lăng, bàn đạp ở tình trạng tốt?",
    label_en: "Operator compartment – All controls, steer tiller, pedals in good condition",
    sub_label: "Operator compartment – Khoang lái",
  },
  {
    id: "op_01",
    category: "operation",
    label_vi: "Tay lái – Không rơ, điều khiển ổn định?",
    label_en: "Steering – No binding, no excessive play",
    sub_label: "Steering – Tay lái",
  },
  {
    id: "op_02",
    category: "operation",
    label_vi: "Điều khiển di chuyển – Kiểm tra chuyển động tiến, lùi / nâng hạ?",
    label_en: "Travel controls – Verify forward & reverse movement",
    sub_label: "Travel controls – Điều khiển di chuyển",
  },
  {
    id: "op_03",
    category: "operation",
    label_vi: "Thủy lực – Nâng hạ, nghiêng nĩa, vươn/rút tay kéo không có tiếng động bất thường?",
    label_en: "Hydraulic check – Lift, tilt, extend/retract, no unusual noise",
    sub_label: "Hydraulic – Thủy lực",
  },
  {
    id: "op_04",
    category: "operation",
    label_vi: "Thắng/Phanh – Thắng hoạt động tốt, kiểm tra khoảng cách dừng?",
    label_en: "Brakes – All brakes working properly, check stopping distance",
    sub_label: "Brakes – Thắng/phanh",
  },
  {
    id: "op_05",
    category: "operation",
    label_vi: "Pin và nhiên liệu – Đảm bảo nạp đầy pin và nhiên liệu",
    label_en: "Battery/Oil – Ensure full charge batteries and fuel",
    sub_label: "Battery charge – Sạc bình",
  },
  {
    id: "op_06",
    category: "operation",
    label_vi: "Dừng khẩn cấp – Các cơ cấu dừng khẩn cấp có hoạt động tốt?",
    label_en: "Emergency function – Emergency stop functions working properly",
    sub_label: "Emergency – Khẩn cấp",
  },
  {
    id: "op_07",
    category: "operation",
    label_vi: "Thiết bị an toàn – Đèn chớp, đèn báo, kính bảo vệ, còi, cảnh báo hoạt động tốt?",
    label_en: "Safety devices – All safety devices function properly",
    sub_label: "Safety devices – An toàn",
  },
  {
    id: "op_08",
    category: "operation",
    label_vi: "Công tắc giới hạn – Giới hạn tốc độ, chiều cao nâng, độ nghiêng hoạt động tốt?",
    label_en: "Limit switches – Travel, lift, tilt limit switches working",
    sub_label: "Limit switches – Giới hạn",
  },
  {
    id: "op_09",
    category: "operation",
    label_vi: "Bộ công tác/phụ kiện – Chức năng không có bất thường?",
    label_en: "Attachments – Function properly, no unusual noise",
    sub_label: "Attachments – Phụ kiện",
  },
  {
    id: "op_10",
    category: "operation",
    label_vi: "Đọc chỉ số đồng hồ giờ",
    label_en: "Hour meter reading",
    sub_label: "Hour meter reading",
  }
]

export function buildDefaultChecklist(): CheckItem[] {
  return CHECKLIST_TEMPLATE.map((item) => ({
    ...item,
    days: createEmptyDays(),
  }))
}
