import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getISOWeek, getYear } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentWeek() {
  const now = new Date()
  return { week: getISOWeek(now), year: getYear(now) }
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export function getWeekDates(week: number, year: number): Record<string, Date> {
  // Find Monday of that ISO week
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7)

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const result: Record<string, Date> = {}
  days.forEach((d, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    result[d] = date
  })
  return result
}

export function statusColor(status: string) {
  if (status === 'pass') return 'text-green-700 bg-green-50 border-green-200'
  if (status === 'fail') return 'text-red-700 bg-red-50 border-red-200'
  return 'text-gray-400 bg-gray-50 border-gray-200'
}

export function checklistStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: 'Bản nháp',
    submitted: 'Đã nộp',
    reviewed: 'Đang xem xét',
    approved: 'Đã duyệt',
  }
  return map[status] || status
}

export function checklistStatusColor(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-700',
    reviewed: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}
