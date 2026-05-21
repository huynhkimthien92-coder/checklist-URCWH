'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ===== TYPES =====
import { Issue } from '@/types/issue'
import { Task } from '@/types/task'

// ===== COMPONENTS =====
import { SummaryCards } from '@/components/5s/dashboard/SummaryCards'
import { KPICharts } from '@/components/5s/dashboard/KPICharts'
import { IssueTrend } from '@/components/5s/dashboard/IssueTrend'
import AssigneePerformance from '@/components/5s/dashboard/AssigneePerformance'
import { AreaHeatmap } from '@/components/5s/dashboard/AreaHeatmap'

// ===== PAGE =====
export default function DashboardPage() {

  const router = useRouter()

  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ USERS (FIX ASSIGNEE)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  // ===== FETCH ISSUES =====
  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/issues', { cache: 'no-store' })
      const data = await res.json()
      setIssues(data || [])
    } catch (err) {
      console.error('Fetch dashboard error', err)
    } finally {
      setLoading(false)
    }
  }

  // ===== FETCH USERS =====
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users/search')
      const data = await res.json()
      setUsers(data || [])
    } catch {
      setUsers([])
    }
  }

  useEffect(() => {
    fetchIssues()
    fetchUsers()
  }, [])

  // ===== MAP USER NAME =====
  const getUserName = (id?: string) => {
    if (!id) return 'Unassigned'
    const user = users.find(u => u.id === id)
    return user?.name || 'Unknown'
  }

  // ===== FILTER BY AREA =====
  const filtered = selectedArea
    ? issues.filter(i => i.area === selectedArea)
    : issues

  // ===== CONVERT TO TASK (FIX ASSIGNEE NAME) =====
  const tasks: Task[] = filtered.map(i => ({
    id: String(i.id),

    // ✅ FIX CHÍNH Ở ĐÂY
    assignee: getUserName(i.assigned_to),

    status:
      i.status === 'open'
        ? 'todo'
        : i.status === 'in_progress'
        ? 'in_progress'
        : 'done',

    createdAt: i.created_at || '',
    completedAt: i.closed_at
  }))

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">5S Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Theo dõi hiệu suất, KPI và xu hướng xử lý issue
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={fetchIssues}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            Refresh
          </button>

          <button
            onClick={() => router.push('/5s')}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            ← Back to Map
          </button>

        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* SUMMARY */}
          <SummaryCards issues={filtered} />

          {/* KPI */}
          <KPICharts issues={filtered} />

          {/* TREND */}
          <IssueTrend
            issues={filtered.map(i => ({
              ...i,
              created_at: i.created_at ?? ''
            }))}
          />

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ASSIGNEE PERFORMANCE */}
            <div className="lg:col-span-2">
              <AssigneePerformance tasks={tasks} />
            </div>

            {/* AREA */}
            <div>
              <AreaHeatmap
                issues={issues}
                selectedArea={selectedArea}
                onSelectArea={setSelectedArea}
              />
            </div>

          </div>

          {/* EMPTY */}
          {issues.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              No issue data available
            </div>
          )}
        </>
      )}

    </div>
  )
}
