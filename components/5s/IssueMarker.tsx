'use client'

import { memo } from 'react'
import { Issue } from '@/types/issue'

// ===== PROPS =====
type Props = {
  issue: Issue
  selected?: boolean
  onClick: (issue: Issue) => void
}

// ===== HELPER =====

// ✅ Quá hạn nặng (>= 7 ngày)
const isOverdue = (issue: Issue) => {
  if (!issue.due_date || issue.status === 'done') return false

  const now = new Date()
  const due = new Date(issue.due_date + 'T23:59:59')

  const diffDays =
    (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)

  return diffDays >= 7
}

// ✅ Quá hạn nhẹ (< 7 ngày)
const isLate = (issue: Issue) => {
  if (!issue.due_date || issue.status === 'done') return false

  const now = new Date()
  const due = new Date(issue.due_date + 'T23:59:59')

  return now > due
}

// ✅ ICON LOGIC (ưu tiên status)
const getIcon = (issue: Issue) => {
  if (isOverdue(issue)) return '⚠️'

  if (issue.status === 'done') return '🟢'
  if (issue.status === 'in_progress') return '🟡'
  return '🔴'
}

// ✅ COLOR LOGIC
const getColorClass = (issue: Issue) => {

  // ❗ overdue nặng
  if (isOverdue(issue)) return 'bg-red-600 animate-pulse'

  // ⚠️ overdue nhẹ (optional, đẹp hơn)
  if (isLate(issue)) return 'bg-orange-400'

  // ✅ trạng thái bình thường
  if (issue.status === 'done') return 'bg-green-500'
  if (issue.status === 'in_progress') return 'bg-yellow-400'
  return 'bg-red-500'
}

// ===== COMPONENT =====
function IssueMarkerComponent({ issue, selected, onClick }: Props) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick(issue)
      }}
      className={`
        absolute cursor-pointer transition-all flex items-center justify-center
        w-6 h-6 rounded-full text-white text-xs shadow
        ${getColorClass(issue)}
        ${selected ? 'scale-125 ring-2 ring-blue-500 z-20' : 'z-10'}
      `}
      style={{
        left: `${(issue.x_percent ?? 0) * 100}%`,
        top: `${(issue.y_percent ?? 0) * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <span className="text-[10px] leading-none">
        {getIcon(issue)}
      </span>
    </div>
  )
}

// ✅ tránh re-render nhiều marker
export const IssueMarker = memo(IssueMarkerComponent)
