import { CheckItem } from '@/types'

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export const DAY_LABELS: Record<string, string> = {
  mon: 'Thứ Hai', tue: 'Thứ Ba', wed: 'Thứ Tư',
  thu: 'Thứ Năm', fri: 'Thứ Sáu', sat: 'Thứ Bảy', sun: 'Chủ Nhật'
}
export const DAY_SHORT: Record<string, string> = {
  mon: 'T2', tue: 'T3', wed: 'T4', thu: 'T5', fri: 'T6', sat: 'T7', sun: 'CN'
}

export function createEmptyDays() {
  return Object.fromEntries(DAYS.map(d => [d, { status: '' as const, detail: '', image_url: '' }]))
}

export const CHECKLIST_TEMPLATE: Omit<CheckItem, 'days'>[] = [
  // OBSERVATION
  {
    id: 'obs_01',
    category: 'observation',
    label_vi: 'Các chi tiết không bị cong, vỡ hay bể?',
    label_en: 'Bent, dented or broken parts',
    sub_label: 'Damage – Gãy vỡ',
  },
  {
    id: 'obs_02',
    category: 'observation',
    label_vi: 'Bộ dẫn động cơ, thắng, dầu thủy lực có bị rò rỉ không?',
    label_en: 'Any signs of leak or smell of hydraulics',
    sub_label: 'Leaks – Rò rỉ',
  },
  {
    id: 'obs_03',
    category: 'observation',
    label_vi: 'Kiểm tra mực nước trong két nước có đảm bảo không?',
    label_en: 'Check radiator level',
    sub_label: 'Radiator – Két nước',
  },
  {
    id: 'obs_04',
    category: 'observation',
    label_vi: 'Lốp có xẹp, mòn hay nứt không? Vành bánh xe có cong, nứt bể?',
    label_en: 'Are the tires flat or worn',
    sub_label: 'Tires & Wheels – Lốp & bánh xe',
  },
  {
    id: 'obs_05',
    category: 'observation',
    label_vi: 'Chắc chắn, không bị cong, nứt, mòn?',
    label_en: 'Secure, not bent, cracked or worn',
    sub_label: 'Forks – Nĩa',
  },
  {
    id: 'obs_06',
    category: 'observation',
    label_vi: 'Đúng vị trí, không bị rỉ sét, mài mòn, chặt và bôi trơn?',
    label_en: 'Chain tight, in place and lubed',
    sub_label: 'Chains, Cable & Hose - Xích, cáp và dây',
  },
  {
    id: 'obs_07',
    category: 'observation',
    label_vi: 'Số giờ hoạt động',
    label_en: 'Operating hours',
    sub_label: 'Hour meter – Đồng hồ giờ',
  },
  {
    id: 'obs_08',
    category: 'observation',
    label_vi: 'Mực nước, thông hơi, vệ sinh',
    label_en: 'Water level, cap in place, cleanliness',
    sub_label: 'Battery – Bình ắc quy/bình điện',
  },
  {
    id: 'obs_09',
    category: 'observation',
    label_vi: 'Kiểm tra độ chắc chắn, không bị cháy xém?',
    label_en: 'Cracked, burnt, tight fitting',
    sub_label: 'Battery connector – Phích cắm',
  },
  {
    id: 'obs_10',
    category: 'observation',
    label_vi: 'Trên đầu, khung đỡ lái chắc chắn, đảm bảo chức năng chống vật rơi?',
    label_en: 'Overhead, load backrest, battery retainer',
    sub_label: 'Guards – Khung bảo vệ',
  },
  {
    id: 'obs_11',
    category: 'observation',
    label_vi: 'Tất cả điều khiển, vô lăng, bàn đạp ở tình trạng tốt?',
    label_en: 'All controls, steer tiller, pedals in good condition',
    sub_label: 'Operator compartment – Khoang lái',
  },
  // OPERATION
  {
    id: 'op_01',
    category: 'operation',
    label_vi: 'Không rơ, điều khiển ổn định?',
    label_en: 'No binding, no excessive play',
    sub_label: 'Steering – Tay lái',
  },
  {
    id: 'op_02',
    category: 'operation',
    label_vi: 'Kiểm tra chuyển động tiến, lùi / nâng hạ?',
    label_en: 'Verify forward & reverse movement',
    sub_label: 'Travel controls – Điều khiển di chuyển',
  },
  {
    id: 'op_03',
    category: 'operation',
    label_vi: 'Nâng hạ, nghiêng nĩa, vươn/rút tay kéo không có tiếng động bất thường?',
    label_en: 'Lift, tilt, extend/retract, no unusual noise',
    sub_label: 'Hydraulic – Thủy lực',
  },
  {
    id: 'op_04',
    category: 'operation',
    label_vi: 'Thắng hoạt động tốt, kiểm tra khoảng cách dừng?',
    label_en: 'All brakes working properly, check stopping distance',
    sub_label: 'Brakes – Thắng/phanh',
  },
  {
    id: 'op_05',
    category: 'operation',
    label_vi: 'Đảm bảo nạp đầy pin và nhiên liệu',
    label_en: 'Ensure full charge batteries and fuel',
    sub_label: 'Battery/Oil – Pin và nhiên liệu',
  },
  {
    id: 'op_06',
    category: 'operation',
    label_vi: 'Các cơ cấu dừng khẩn cấp có hoạt động tốt?',
    label_en: 'Emergency stop functions working properly',
    sub_label: 'Emergency function – Dừng khẩn cấp',
  },
  {
    id: 'op_07',
    category: 'operation',
    label_vi: 'Đèn chớp, đèn báo, kính bảo vệ, còi, cảnh báo hoạt động tốt?',
    label_en: 'All safety devices function properly',
    sub_label: 'Safety devices – Thiết bị an toàn, cảnh báo',
  },
  {
    id: 'op_08',
    category: 'operation',
    label_vi: 'Giới hạn tốc độ, chiều cao nâng, độ nghiêng hoạt động tốt?',
    label_en: 'Travel, lift, tilt limit switches working',
    sub_label: 'Limit switches – Công tắc giới hạn',
  },
  {
    id: 'op_09',
    category: 'operation',
    label_vi: 'Chức năng không có bất thường?',
    label_en: 'Function properly, no unusual noise',
    sub_label: 'Attachments – Bộ công tác, phụ kiện',
  },
  {
    id: 'op_10',
    category: 'operation',
    label_vi: 'Đọc chỉ số đồng hồ giờ',
    label_en: 'Hour meter reading',
    sub_label: '',
  },
]

export function buildDefaultChecklist(): CheckItem[] {
  return CHECKLIST_TEMPLATE.map(item => ({
    ...item,
    days: createEmptyDays()
  }))
}
