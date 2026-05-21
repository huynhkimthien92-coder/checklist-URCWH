'use client'

import { memo } from 'react'
import { Issue } from '@/types/issue'

// ✅ IMPORT DESIGN SYSTEM
import { getIssueStyle } from '@/lib/issueStatus'

// ===== PROPS =====
type Props = {
  issue: Issue
  selected?: boolean
  onClick: (issue: Issue) => void
}

// ===== COMPONENT =====
function IssueMarkerComponent({ issue, selected, onClick }: Props) {

  // ✅ LẤY STYLE TỪ DESIGN SYSTEM
  const style = getIssueStyle(issue)

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick(issue)
      }}
      title={`${style.label} - ${issue.title}`} // ✅ hover tooltip
      className={`
        absolute cursor-pointer transition-all flex items-center justify-center
        w-6 h-6 rounded-full text-white text-xs shadow
        ${style.bg}
        ${selected ? 'scale-125 ring-2 ring-blue-500 z-20' : 'z-10'}
      `}
      style={{
        left: `${(issue.x_percent ?? 0) * 100}%`,
        top: `${(issue.y_percent ?? 0) * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <span className="text-[10px] leading-none">
        {style.icon}
      </span>
    </div>
  )
}

// ✅ tránh re-render
export const IssueMarker = memo(IssueMarkerComponent)
