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
  … toàn bộ danh sách items …
]

export function buildDefaultChecklist(): CheckItem[] {
  return CHECKLIST_TEMPLATE.map(item => ({
    ...item,
    days: createEmptyDays()
  }))
}
