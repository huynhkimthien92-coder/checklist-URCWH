'use client'

import { useMemo } from 'react'

// ===== TYPES =====
type Issue = {
  area?: string
  status: 'open' | 'in_progress' | 'done'
}

type Props = {
  issues: Issue[]
  selectedArea?: string | null
  onSelectArea?: (area: string | null) => void
}

// ===== COLOR SCALE =====
function getColor(total: number, max: number) {
  if (max === 0) return 'bg-gray-100 text-gray-500'

  const ratio = total / max

  if (ratio > 0.8) return 'bg-red-500 text-white'
  if (ratio > 0.6) return 'bg-orange-400 text-white'
  if (ratio > 0.4) return 'bg-yellow-300 text-black'
  if (ratio > 0.2) return 'bg-blue-200 text-black'
  return 'bg-gray-100 text-gray-500'
}

// ===== COMPONENT =====
export function AreaHeatmap({
  issues,
  selectedArea,
  onSelectArea
}: Props) {

  // ===== GROUP =====
  const areas = useMemo(() => {
    const map: Record<string, { total: number; open: number }> = {}

    issues.forEach(i => {
      const key = i.area || 'Unknown'

      if (!map[key]) {
        map[key] = { total: 0, open: 0 }
      }

      map[key].total++

      if (i.status !== 'done') {
        map[key].open++
      }
    })

    return Object.entries(map)
      .map(([area, data]) => ({
        area,
        ...data,
        openRate: data.total > 0
          ? Math.round((data.open / data.total) * 100)
          : 0
      }))
      .sort((a, b) => b.total - a.total)

  }, [issues])

  const max = Math.max(...areas.map(a => a.total), 0)

  return (
    <div className="bg-white border rounded p-4 space-y-4">

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">

        <h3 className="text-sm font-semibold">
          Area Heatmap
        </h3>

        {selectedArea && (
          <button
            onClick={() => onSelectArea?.(null)}
            className="text-xs border px-2 py-1 rounded hover:bg-gray-100"
          >
            Clear filter
          </button>
        )}

      </div>

      {/* ===== LIST ===== */}
      <div className="space-y-2">

        {areas.map(a => {
          const selected = selectedArea === a.area

          return (
            <div
              key={a.area}
              onClick={() => onSelectArea?.(a.area)}
              className={`
                flex items-center justify-between
                p-3 rounded cursor-pointer transition-all

                ${getColor(a.total, max)}

                ${selected ? 'ring-2 ring-blue-500 scale-[1.02]' : 'hover:scale-[1.01]'}
              `}
            >
              {/* AREA */}
              <div className="font-medium">
                {a.area}
              </div>

              {/* STATS */}
              <div className="flex gap-4 text-xs items-center">

                <span>
                  Total: <b>{a.total}</b>
                </span>

                <span>
                  Open: <b>{a.open}</b>
                </span>

                {/* ✅ open rate */}
                <span>
                  🔥 {a.openRate}%
                </span>

              </div>
            </div>
          )
        })}

      </div>

      {/* ===== LEGEND ===== */}
      <div className="text-xs flex flex-wrap gap-2 pt-3 border-t">

        <span className="bg-red-500 text-white px-2 rounded">Very High</span>
        <span className="bg-orange-400 text-white px-2 rounded">High</span>
        <span className="bg-yellow-300 px-2 rounded">Medium</span>
        <span className="bg-blue-200 px-2 rounded">Low</span>
        <span className="bg-gray-100 px-2 rounded">Very Low</span>

      </div>

    </div>
  )
}
