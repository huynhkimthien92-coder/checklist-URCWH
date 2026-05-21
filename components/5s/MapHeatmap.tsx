'use client'

import { useMemo } from 'react'

// ===== TYPES =====
type Issue = {
  x_percent: number
  y_percent: number
  status?: 'open' | 'in_progress' | 'done'
}

// ===== CONFIG =====
const RADIUS = 120 // px

// ===== HELPER: tính mật độ (density) =====
function calculateDensity(issues: Issue[], index: number) {
  const target = issues[index]

  let count = 0

  issues.forEach((other, i) => {
    if (i === index) return

    const dx = target.x_percent - other.x_percent
    const dy = target.y_percent - other.y_percent

    const distance = Math.sqrt(dx * dx + dy * dy)

    // ✅ threshold: khoảng cách gần => cùng vùng
    if (distance < 0.1) count++
  })

  return count
}

// ===== COLOR SCALE =====
function getColor(density: number) {
  if (density > 6) return 'rgba(255, 0, 0, 0.5)'       // 🔥 nóng
  if (density > 4) return 'rgba(255, 100, 0, 0.4)'
  if (density > 2) return 'rgba(255, 200, 0, 0.3)'
  if (density > 1) return 'rgba(0, 150, 255, 0.25)'
  return 'rgba(0, 0, 255, 0.15)'                       // ❄ nhẹ
}

// ===== COMPONENT =====
export function MapHeatmap({ issues }: { issues: Issue[] }) {

  // ✅ chỉ lấy issue chưa done → meaningful hơn
  const activeIssues = useMemo(
    () => issues.filter(i => i.status !== 'done'),
    [issues]
  )

  // ✅ tính density
  const heatPoints = useMemo(() => {
    return activeIssues.map((issue, index) => {
      const density = calculateDensity(activeIssues, index)

      return {
        ...issue,
        density
      }
    })
  }, [activeIssues])

  return (
    <div className="absolute inset-0 pointer-events-none mix-blend-multiply">

      {heatPoints.map((p, idx) => (
        <div
          key={idx}
          className="absolute rounded-full blur-2xl"
          style={{
            width: `${RADIUS}px`,
            height: `${RADIUS}px`,
            left: `${p.x_percent * 100}%`,
            top: `${p.y_percent * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${getColor(p.density)} 0%, transparent 70%)`
          }}
        />
      ))}

    </div>
  )
}
