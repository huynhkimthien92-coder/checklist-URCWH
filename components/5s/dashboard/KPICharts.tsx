'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

// ===== TYPES =====
type Issue = {
  status: 'open' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
}

// ===== COLORS =====
const STATUS_COLORS = {
  open: '#ef4444',
  in_progress: '#f59e0b',
  done: '#22c55e'
}

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444'
}

// ===== COMPONENT =====
export function KPICharts({ issues }: { issues: Issue[] }) {

  // ===== STATUS DATA =====
  const statusData = [
    {
      name: 'Open',
      value: issues.filter(i => i.status === 'open').length,
      key: 'open'
    },
    {
      name: 'In Progress',
      value: issues.filter(i => i.status === 'in_progress').length,
      key: 'in_progress'
    },
    {
      name: 'Done',
      value: issues.filter(i => i.status === 'done').length,
      key: 'done'
    }
  ]

  // ===== PRIORITY DATA =====
  const priorityData = [
    {
      name: 'Low',
      value: issues.filter(i => i.priority === 'low').length,
      key: 'low'
    },
    {
      name: 'Medium',
      value: issues.filter(i => i.priority === 'medium').length,
      key: 'medium'
    },
    {
      name: 'High',
      value: issues.filter(i => i.priority === 'high').length,
      key: 'high'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* ===== PIE CHART ===== */}
      <div className="bg-white border rounded p-3">

        <h3 className="text-sm font-semibold mb-2">
          Issue Status Distribution
        </h3>

        <div className="w-full h-[260px]">
          <ResponsiveContainer>

            <PieChart>

              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={STATUS_COLORS[entry.key as keyof typeof STATUS_COLORS]}
                  />
                ))}
              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>
        </div>

      </div>

      {/* ===== BAR CHART ===== */}
      <div className="bg-white border rounded p-3">

        <h3 className="text-sm font-semibold mb-2">
          Priority Breakdown
        </h3>

        <div className="w-full h-[260px]">
          <ResponsiveContainer>

            <BarChart data={priorityData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Bar dataKey="value">
                {priorityData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={PRIORITY_COLORS[entry.key as keyof typeof PRIORITY_COLORS]}
                  />
                ))}
              </Bar>

            </BarChart>

          </ResponsiveContainer>
        </div>

      </div>

    </div>
  )
}
