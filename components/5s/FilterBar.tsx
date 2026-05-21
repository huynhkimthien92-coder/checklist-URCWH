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
    fromDate?: string
    toDate?: string
  }) => void
}

export function FilterBar({ onChange }: Props) {

  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  // ✅ date
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // ✅ assignee
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

  // ===== DATE HELPER =====
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // ===== PRESETS =====
  const setToday = () => {
    const today = formatDate(new Date())

    setFromDate(today)
    setToDate(today)

    apply(status, assignee, priority, today, today)
  }

  const setLast7Days = () => {
    const today = new Date()
    const last7 = new Date()
    last7.setDate(today.getDate() - 6)

    const from = formatDate(last7)
    const to = formatDate(today)

    setFromDate(from)
    setToDate(to)

    apply(status, assignee, priority, from, to)
  }

  // ===== APPLY =====
  const apply = (
    nextStatus = status,
    nextAssignee = assignee,
    nextPriority = priority,
    nextFrom = fromDate,
    nextTo = toDate
  ) => {
    onChange({
      status: nextStatus || undefined,
      assignee: nextAssignee || undefined,
      priority: nextPriority || undefined,
      fromDate: nextFrom || undefined,
      toDate: nextTo || undefined,
    })
  }

  // ===== RESET =====
  const reset = () => {
    setStatus('')
    setPriority('')
    setFromDate('')
    setToDate('')
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
            apply(e.target.value)
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
            apply(status, assignee, e.target.value)
          }}
        >
          <option value="">All Priority</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        {/* ASSIGNEE */}
        <div className="relative min-w-[150px]">

          <input
            className="border px-2 py-1 text-sm rounded w-full"
            placeholder="Assignee..."
            value={assigneeName}
            onChange={e => {
              setAssigneeName(e.target.value)
              setAssignee(undefined)
              setShowDropdown(true)
              apply(status, undefined, priority)
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
                    setAssignee(user.id)
                    setAssigneeName(user.name)
                    setShowDropdown(false)
                    apply(status, user.id, priority)
                  }}
                >
                  {user.name}
                </div>
              ))}

            </div>
          )}

        </div>

      </div>

      {/* ✅ ROW 2: DATE */}
      <div className="flex flex-wrap gap-2 items-center">

        <input
          type="date"
          className="border px-2 py-1 text-sm rounded"
          value={fromDate}
          onChange={e => {
            setFromDate(e.target.value)
            apply(status, assignee, priority, e.target.value, toDate)
          }}
        />

        <span className="text-sm text-gray-400">→</span>

        <input
          type="date"
          className="border px-2 py-1 text-sm rounded"
          value={toDate}
          onChange={e => {
            setToDate(e.target.value)
            apply(status, assignee, priority, fromDate, e.target.value)
          }}
        />

        {/* ✅ PRESET BUTTONS */}
        <button
          onClick={setToday}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
        >
          Today
        </button>

        <button
          onClick={setLast7Days}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
        >
          Last 7 days
        </button>

      </div>

      {/* ACTION */}
      <div className="flex justify-between items-center">

        <div className="text-xs text-gray-400">
          Filter theo trạng thái, ưu tiên, người phụ trách và thời gian
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
