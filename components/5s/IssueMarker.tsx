'use client'

import { memo } from 'react'

// ===== TYPES =====
type Issue = {
  id: string
  status: 'open' | 'in_progress' | 'done'
  x_percent: number
  y_percent: number
  due_date?: string
}

// ===== PROPS =====
type Props = {
  issue: Issue
  selected?: boolean
  onClick: (issue: Issue) => void
}

// ===== HELPER =====
const isOverdue = (issue: Issue) => {
  return (
    issue.status !== 'done' &&
    issue.due_date &&
    new Date() > new Date(issue.due_date)
  )
}

// ✅ ICON LOGIC
const getIcon = (issue: Issue) => {
  if (isOverdue(issue)) return '⚠️'
  if (issue.status === 'done') return '🟢'
  if (issue.status === 'in_progress') return '🟡'
  return '🔴'
}

// ✅ COLOR CLASS (optional nâng cao UI)
const getColorClass = (issue: Issue) => {
  if (isOverdue(issue)) return 'bg-red-500 animate-pulse'
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
        left: `${issue.x_percent * 100}%`,
        top: `${issue.y_percent * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <span className="text-[10px]">
        {getIcon(issue)}
      </span>
    </div>
  )
}

// ✅ memo để tránh re-render nhiều marker
export const IssueMarker = memo(IssueMarkerComponent)
