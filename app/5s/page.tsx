'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ===== COMPONENTS =====
import { MapView } from '@/components/5s/MapView'
import { FilterBar } from '@/components/5s/FilterBar'
import { AddIssueModal } from '@/components/5s/AddIssueModal'
import { IssueModal } from '@/components/5s/IssueModal'

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

export default function Page() {

  const router = useRouter()

  const [issues, setIssues] = useState<Issue[]>([])
  const [selected, setSelected] = useState<Issue | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [newPos, setNewPos] = useState<{ x: number; y: number } | null>(null)

  const [filters, setFilters] = useState<{
    status?: string
    assignee?: string
    priority?: string
    search?: string
  }>({})

  const [loading, setLoading] = useState(true)

  // ===== FETCH =====
  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/issues', { cache: 'no-store' })
      const data = await res.json()
      setIssues(data || [])
    } catch (err) {
      console.error('Fetch issues error', err)
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
        : true)
    )
  })

  // ===== MAP ADD =====
  const handleAdd = (pos: { x: number; y: number }) => {
    setNewPos(pos)
    setShowAdd(true)
  }

  return (
    <div className="p-6 space-y-4 bg-gray-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">5S Operations</h1>
          <p className="text-gray-500 text-sm">
            Manage issues directly on the layout map
          </p>
        </div>

        <div className="flex gap-2">

          {/* RELOAD */}
          <button
            onClick={fetchIssues}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            Refresh
          </button>

          {/* GO DASHBOARD */}
          <button
            onClick={() => router.push('/5s/dashboard')}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            Dashboard →
          </button>

        </div>
      </div>

      {/* ===== FILTER ===== */}
      <FilterBar onChange={setFilters} />

      {/* ===== LOADING ===== */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          Loading issues...
        </div>
      ) : (
        <MapView
          issues={filtered}
          selectedIssue={selected}
          onSelect={setSelected}
          onAdd={handleAdd}
        />
      )}

      {/* ===== EMPTY STATE ===== */}
      {!loading && filtered.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          No issues found
        </div>
      )}

      {/* ===== ADD ISSUE ===== */}
      {showAdd && newPos && (
        <AddIssueModal
          x={newPos.x}
          y={newPos.y}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            fetchIssues()
          }}
        />
      )}

      {/* ===== ISSUE DETAIL ===== */}
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
