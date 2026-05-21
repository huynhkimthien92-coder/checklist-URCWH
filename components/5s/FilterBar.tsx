'use client'

import { useState } from 'react'

type Props = {
  status?: string
  assignee?: string
  priority?: string

  onChange: (filters: {
    status?: string
    assignee?: string
    priority?: string
    search?: string
  }) => void
}

export function FilterBar({ onChange }: Props) {

  const [status, setStatus] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')

  const apply = (
    nextStatus = status,
    nextAssignee = assignee,
    nextPriority = priority,
    nextSearch = search
  ) => {
    onChange({
      status: nextStatus || undefined,
      assignee: nextAssignee || undefined,
      priority: nextPriority || undefined,
      search: nextSearch || undefined,
    })
  }

  const reset = () => {
    setStatus('')
    setAssignee('')
    setPriority('')
    setSearch('')
    onChange({})
  }

  return (
    <div className="bg-white border rounded p-3 space-y-3">

      {/* ROW 1 */}
      <div className="flex flex-wrap gap-2">

        {/* STATUS */}
        <select
          className="border px-2 py-1 text-sm rounded"
          value={status}
          onChange={e => {
            setStatus(e.target.value)
            apply(e.target.value, assignee, priority, search)
          }}
        >
          <option value="">All Status</option>
          <option value="open">🔴 Open</option>
          <option value="in_progress">🟡 In Progress</option>
          <option value="done">🟢 Done</option>
        </select>

        {/* PRIORITY */}
        <select
          className="border px-2 py-1 text-sm rounded"
          value={priority}
          onChange={e => {
            setPriority(e.target.value)
            apply(status, assignee, e.target.value, search)
          }}
        >
          <option value="">All Priority</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        {/* ASSIGNEE */}
        <input
          className="border px-2 py-1 text-sm rounded"
          placeholder="Assignee ID"
          value={assignee}
          onChange={e => {
            setAssignee(e.target.value)
            apply(status, e.target.value, priority, search)
          }}
        />

        {/* SEARCH */}
        <input
          className="border px-2 py-1 text-sm rounded flex-1 min-w-[150px]"
          placeholder="Search title..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            apply(status, assignee, priority, e.target.value)
          }}
        />

      </div>

      {/* ACTION ROW */}
      <div className="flex justify-between items-center">

        <div className="text-xs text-gray-400">
          Filter issues by status, priority, assignee hoặc tìm kiếm
        </div>

        <button
          onClick={reset}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
        >
          Reset
        </button>

      </div>

    </div>
  )
}
