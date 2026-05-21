'use client'

type Issue = {
  status: 'open' | 'in_progress' | 'done'
  due_date?: string
  created_at?: string
  closed_at?: string
}

// ===== HELPER =====
const isOverdue = (issue: Issue) => {
  return (
    issue.status !== 'done' &&
    issue.due_date &&
    new Date() > new Date(issue.due_date)
  )
}

// ===== COMPONENT =====
export function SummaryCards({ issues }: { issues: Issue[] }) {

  // ===== CALCULATE =====
  const total = issues.length

  const open = issues.filter(i => i.status === 'open').length
  const progress = issues.filter(i => i.status === 'in_progress').length
  const done = issues.filter(i => i.status === 'done').length

  const overdue = issues.filter(i => isOverdue(i)).length

  const completionRate = total > 0
    ? Math.round((done / total) * 100)
    : 0

  // ===== AVG RESOLUTION TIME =====
  const resolvedIssues = issues.filter(
    i => i.status === 'done' && i.closed_at && i.created_at
  )

  const avgResolution =
    resolvedIssues.length > 0
      ? Math.round(
          resolvedIssues.reduce((acc, cur) => {
            const start = new Date(cur.created_at!).getTime()
            const end = new Date(cur.closed_at!).getTime()
            return acc + (end - start)
          }, 0) /
          resolvedIssues.length /
          1000 /
          60 /
          60 // giờ
        )
      : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

      {/* OPEN */}
      <Card
        title="Open"
        value={open}
        color="bg-red-100 text-red-700"
      />

      {/* IN PROGRESS */}
      <Card
        title="In Progress"
        value={progress}
        color="bg-yellow-100 text-yellow-700"
      />

      {/* DONE */}
      <Card
        title="Done"
        value={done}
        color="bg-green-100 text-green-700"
      />

      {/* OVERDUE */}
      <Card
        title="Overdue"
        value={overdue}
        color="bg-orange-100 text-orange-700"
      />

      {/* COMPLETION */}
      <Card
        title="Completion %"
        value={`${completionRate}%`}
        color="bg-blue-100 text-blue-700"
        highlight
      />

      {/* AVG RESOLUTION */}
      <Card
        title="Avg Time (h)"
        value={avgResolution}
        color="bg-purple-100 text-purple-700"
      />

    </div>
  )
}

// ===== CARD COMPONENT =====
function Card({
  title,
  value,
  color,
  highlight
}: {
  title: string
  value: string | number
  color?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`
        rounded-lg p-3 border shadow-sm
        ${color || 'bg-white text-gray-700'}
        ${highlight ? 'ring-2 ring-blue-400' : ''}
      `}
    >
      <div className="text-xs opacity-70">{title}</div>

      <div className="text-xl font-semibold mt-1">
        {value}
      </div>
    </div>
  )
}
