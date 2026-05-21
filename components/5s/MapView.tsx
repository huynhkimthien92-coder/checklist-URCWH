'use client'

import { useRef } from 'react'
import { IssueMarker } from '@/components/5s/IssueMarker'

// ===== TYPES =====
type Issue = {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'done'
  x_percent: number
  y_percent: number
  due_date?: string
}

// ===== PROPS =====
type Props = {
  issues: Issue[]
  selectedIssue?: Issue | null

  onSelect: (issue: Issue) => void
  onAdd: (pos: { x: number; y: number }) => void
}

// ===== COMPONENT =====
export function MapView({
  issues,
  selectedIssue,
  onSelect,
  onAdd
}: Props) {

  const mapRef = useRef<HTMLDivElement>(null)

  // ===== CLICK MAP → ADD ISSUE =====
  const handleClick = (e: React.MouseEvent) => {

    if (!mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()

    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    onAdd({ x, y })
  }

  return (
    <div className="relative w-full">

      {/* MAP CONTAINER */}
      <div
        ref={mapRef}
        onClick={handleClick}
        className="relative w-full h-[500px] border rounded overflow-hidden cursor-crosshair bg-gray-100"
      >

        {/* MAP IMAGE */}
        <img
          src="/map.png"
          alt="map"
          className="w-full h-full object-cover"
        />

        {/* MARKERS */}
        {issues.map(issue => (
          <IssueMarker
            key={issue.id}
            issue={issue}
            selected={selectedIssue?.id === issue.id}
            onClick={onSelect}
          />
        ))}

      </div>

      {/* LEGEND */}
      <div className="mt-2 text-xs flex gap-4 text-gray-600">

        <div className="flex items-center gap-1">
          <span>🔴</span> Open
        </div>

        <div className="flex items-center gap-1">
          <span>🟡</span> In Progress
        </div>

        <div className="flex items-center gap-1">
          <span>🟢</span> Done
        </div>

        <div className="flex items-center gap-1">
          <span>⚠️</span> Overdue
        </div>

      </div>

    </div>
  )
}
