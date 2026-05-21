'use client'

import { useRef, useState } from 'react'
import { Issue } from '@/types/issue' // ✅ IMPORT CHUẨN
import { IssueMarker } from '@/components/5s/IssueMarker'
import { MapHeatmap } from '@/components/5s/MapHeatmap'

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

  // ✅ toggle heatmap
  const [showHeatmap, setShowHeatmap] = useState(true)

  // ===== CLICK MAP =====
  const handleClick = (e: React.MouseEvent) => {
    if (!mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()

    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    onAdd({ x, y })
  }

  return (
    <div className="relative w-full space-y-2">

      {/* ===== HEADER / TOOLBAR ===== */}
      <div className="flex justify-between items-center text-sm">

        <div className="font-semibold">
          5S Map View
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={() => setShowHeatmap(prev => !prev)}
            className="px-2 py-1 border rounded hover:bg-gray-100 text-xs"
          >
            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          </button>

        </div>
      </div>

      {/* ===== MAP CONTAINER ===== */}
      <div
        ref={mapRef}
        onClick={handleClick}
        className="relative w-full h-[500px] border rounded overflow-hidden bg-gray-100 cursor-crosshair"
      >

        {/* ===== MAP IMAGE ===== */}
        <img
          src="/map.png"
          alt="map"
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* ===== HEATMAP LAYER ===== */}
        {showHeatmap && (
          <MapHeatmap issues={issues} />
        )}

        {/* ===== MARKERS ===== */}
        {issues.map(issue => (
          <IssueMarker
            key={issue.id}
            issue={issue}
            selected={selectedIssue?.id === issue.id}
            onClick={onSelect}
          />
        ))}

      </div>

      {/* ===== LEGEND ===== */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">

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

        <div className="flex items-center gap-1">
          <span>🔥</span> Heatmap active issues
        </div>

      </div>

    </div>
  )
}
