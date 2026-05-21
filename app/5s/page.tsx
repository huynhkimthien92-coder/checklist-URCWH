'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AddIssueModal } from '@/components/5s/AddIssueModal'
import { IssueModal } from '@/components/5s/IssueModal'

// ===== TYPES =====
type Issue = {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'done'
  priority: string
  x_percent: number
  y_percent: number
  due_date?: string
  assigned_to?: string
  image_before: string
  image_after?: string
}

// ===== SUPABASE CLIENT =====
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ===== HELPER =====
function isOverdue(issue: Issue) {
  return (
    issue.status !== 'done' &&
    issue.due_date &&
    new Date() > new Date(issue.due_date)
  )
}

function getIcon(issue: Issue) {
  if (isOverdue(issue)) return '⚠️'
  if (issue.status === 'done') return '🟢'
  if (issue.status === 'in_progress') return '🟡'
  return '🔴'
}

// ===== PAGE =====
export default function Page() {

  const mapRef = useRef<HTMLDivElement>(null)

  const [issues, setIssues] = useState<Issue[]>([])
  const [selected, setSelected] = useState<Issue | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [newPos, setNewPos] = useState<{ x: number, y: number } | null>(null)

  const [filterStatus, setFilterStatus] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')

  // ===== FETCH =====
  const fetchIssues = async () => {
    const { data } = await supabase.from('issues').select('*')
    setIssues(data || [])
  }

  useEffect(() => {
    fetchIssues()

    const channel = supabase
      .channel('issues')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        () => fetchIssues()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ===== FILTER =====
  const filtered = issues.filter(i =>
    (filterStatus ? i.status === filterStatus : true) &&
    (filterAssignee ? i.assigned_to === filterAssignee : true)
  )

  // ===== MAP CLICK =====
  const handleMapClick = (e: React.MouseEvent) => {
    if (!mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()

    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setNewPos({ x, y })
    setShowAdd(true)
  }

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">5S Management</h1>
      </div>

      {/* FILTER */}
      <div className="flex gap-2">
        <select
          className="border p-1"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <input
          className="border p-1"
          placeholder="Assignee ID"
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
        />
      </div>

      {/* MAP */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className="relative w-full h-[500px] border cursor-crosshair overflow-hidden"
      >
        <img
          src="/map.png"
          alt="map"
          className="w-full h-full object-cover"
        />

        {/* MARKERS */}
        {filtered.map(issue => {
          const selectedState = selected?.id === issue.id

          return (
            <div
              key={issue.id}
              onClick={e => {
                e.stopPropagation()
                setSelected(issue)
              }}
              className={`absolute text-lg cursor-pointer transition-all
                ${selectedState ? 'scale-125 ring-2 ring-blue-500' : ''}
              `}
              style={{
                left: `${issue.x_percent * 100}%`,
                top: `${issue.y_percent * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {getIcon(issue)}
            </div>
          )
        })}
      </div>

      {/* ADD MODAL */}
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

      {/* DETAIL MODAL */}
      {selected && (
        <IssueModal
          issue={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => fetchIssues()}
        />
      )}

    </div>
  )
}
