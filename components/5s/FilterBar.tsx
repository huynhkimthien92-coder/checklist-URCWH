'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  name: string
}

type Props = {
  onChange: (filters: {
    status?: string
    assignee?: string
    priority?: string
    search?: string
  }) => void
}

export function FilterBar({ onChange }: Props) {

  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')

  // ✅ assignee search
  const [users, setUsers] = useState<User[]>([])
  const [assignee, setAssignee] = useState<string | undefined>(undefined)
  const [assigneeName, setAssigneeName] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // ===== FETCH USERS =====
  useEffect(() => {
    fetch('/api/users/search')
      .then(res => res.json())
      .then(data => setUsers(data || []))
      .catch(() => setUsers([]))
  }, [])

  // ===== FILTER USERS =====
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(assigneeName.toLowerCase())
  )

  // ===== APPLY FILTER =====
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

  // ===== RESET =====
  const reset = () => {
    setStatus('')
    setPriority('')
    setSearch('')
    setAssignee(undefined)
    setAssigneeName('')
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

        {/* ✅ ASSIGNEE SEARCH */}
        <div className="relative min-w-[150px]">

          <input
            className="border px-2 py-1 text-sm rounded w-full"
            placeholder="Assignee..."
            value={assigneeName}
            onChange={e => {
              setAssigneeName(e.target.value)
              setAssignee(undefined)
              setShowDropdown(true)
              apply(status, undefined, priority, search)
            }}
            onFocus={() => setShowDropdown(true)}
          />

          {showDropdown && assigneeName && filteredUsers.length > 0 && (
            <div className="absolute z-20 w-full bg-white border rounded mt-1 max-h-40 overflow-auto">

              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setAssignee(user.id)        // ✅ filter bằng ID
                    setAssigneeName(user.name)  // ✅ hiển thị tên
                    setShowDropdown(false)
                    apply(status, user.id, priority, search)
                  }}
                >
                  {user.name}
                </div>
              ))}

            </div>
          )}

        </div>

        {/* SEARCH TITLE */}
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
          Filter issues theo trạng thái, ưu tiên, người phụ trách hoặc tìm kiếm
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
