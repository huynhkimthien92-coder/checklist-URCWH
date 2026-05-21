'use client'

import { useEffect, useState } from 'react'

// ===== COMPONENTS =====
import { MapView } from '@/components/5s/MapView'
import { FilterBar } from '@/components/5s/FilterBar'
import { AddIssueModal } from '@/components/5s/AddIssueModal'
import { IssueModal } from '@/components/5s/IssueModal'

// ===== DASHBOARD =====
import { SummaryCards } from '@/components/5s/dashboard/SummaryCards'
import { KPICharts } from '@/components/5s/dashboard/KPICharts'
import { IssueTrend } from '@/components/5s/dashboard/IssueTrend'
import AssigneePerformance from '@/components/5s/dashboard/AssigneePerformance'
import { AreaHeatmap } from '@/components/5s/dashboard/AreaHeatmap'

// ===== TYPES =====
type Issue = {
  id: string
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  x_percent: number
  y_percent: number
  due_date?: string
  assigned_to?: string
  image_before: string
  image_after?: string
  created_at?: string
  closed_at?: string
  area?: string
}

// ===== PAGE =====
export default function Page() {

  // ===== STATE =====
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState<Issue | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [newPos, setNewPos] = useState<{ x: number; y: number } | null>(null)

  const [filters, setFilters] = useState<{
    status?: string
    assignee?: string
    priority?: string
    search?: string
  }>({})

  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  // ===== FETCH API =====
  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/issues')
      const data = await res.json()
      setIssues(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIssues()
  }, [])

  // ===== FILTER =====
  const filtered = issues.filter(i => {
    return (
      (filters.status ? i.status === filters.status : true) &&
      (filters.assignee ? i.assigned_to === filters.assignee : true) &&
      (filters.priority ? i.priority === filters.priority : true) &&
      (filters.search
        ? i.title.toLowerCase().includes(filters.search.toLowerCase())
        : true) &&
      (selectedArea ? i.area === selectedArea : true)
    )
  })

  // ===== MAP ADD =====
  const handleAdd = (pos: { x: number; y: number }) => {
    setNewPos(pos)
    setShowAdd(true)
  }

  // ===== ASSIGNEE TASK DATA =====
  const tasks = issues.map(i => ({
    id: i.id,
    assignee: i.assigned_to || 'Unassigned',
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

      {/* ===== HEADER ===== */}
      <div>
        <h1 className="text-2xl font-bold">5S Smart Dashboard</h1>
        <p className="text-gray-500">
          Map + Analytics + Issue Tracking
        </p>
      </div>

      {/* ===== LOADING ===== */}
      {loading && (
        <div className="text-center text-gray-400">Loading...</div>
      )}

      {/* ===== SUMMARY ===== */}
      <SummaryCards issues={issues} />

      {/* ===== KPI ===== */}
      <KPICharts issues={issues} />

      {/* ===== TREND ===== */}
      <IssueTrend issues={issues} />

      {/* ===== ASSIGNEE PERFORMANCE ===== */}
      <AssigneePerformance tasks={tasks} />

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== MAP SIDE ===== */}
        <div className="lg:col-span-2 space-y-4">

          {/* FILTER BAR */}
          <FilterBar onChange={setFilters} />

          {/* MAP VIEW */}
          <MapView
            issues={filtered}
            selectedIssue={selected}
            onSelect={setSelected}
            onAdd={handleAdd}
          />

        </div>

        {/* ===== AREA HEATMAP ===== */}
        <AreaHeatmap
          issues={issues}
          selectedArea={selectedArea}
          onSelectArea={setSelectedArea}
        />

      </div>

      {/* ===== ADD ISSUE MODAL ===== */}
      {showAdd && newPos && (
        <AddIssueModal
          x={newPos.x}
          y={newPos.y}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            fetchIssues() // reload từ API
          }}
        />
      )}

      {/* ===== ISSUE DETAIL MODAL ===== */}
      {selected && (
        <IssueModal
          issue={selected}
          onClose={() => setSelected(null)}
          onUpdated={fetchIssues}
        />
      )}

    </div>
  )
}
