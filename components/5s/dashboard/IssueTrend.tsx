'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// ===== TYPES =====
type Issue = {
  created_at: string
  closed_at?: string
}

// ===== GROUP BY DATE =====
function groupByDate(issues: Issue[]) {
  const map: Record<string, { created: number; done: number }> = {}

  issues.forEach(i => {
    const createdDate = i.created_at.slice(0, 10)

    if (!map[createdDate]) {
      map[createdDate] = { created: 0, done: 0 }
    }

    map[createdDate].created++

    if (i.closed_at) {
      const closedDate = i.closed_at.slice(0, 10)

      if (!map[closedDate]) {
        map[closedDate] = { created: 0, done: 0 }
      }

      map[closedDate].done++
    }
  })

  // ✅ convert to array
  return Object.keys(map)
    .sort()
    .map(date => ({
      date,
      created: map[date].created,
      done: map[date].done
    }))
}

// ===== COMPONENT =====
export function IssueTrend({ issues }: { issues: Issue[] }) {

  const data = groupByDate(issues)

  return (
    <div className="bg-white border rounded p-3">

      <h3 className="text-sm font-semibold mb-2">
        Issue Trend (Created vs Completed)
      </h3>

      <div className="w-full h-[300px]">
        <ResponsiveContainer>

          <LineChart data={data}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
            />

            <YAxis allowDecimals={false} />

            <Tooltip />

            {/* CREATED */}
            <Line
              type="monotone"
              dataKey="created"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Created"
            />

            {/* DONE */}
            <Line
              type="monotone"
              dataKey="done"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Completed"
            />

          </LineChart>

        </ResponsiveContainer>
      </div>

    </div>
  )
}
