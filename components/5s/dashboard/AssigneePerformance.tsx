"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface Task {
  id: string;
  assignee: string;
  status: "todo" | "in_progress" | "done";
  completedAt?: string;
  createdAt: string;
}

interface AssigneePerformanceProps {
  tasks: Task[];
}

interface AssigneeStats {
  assignee: string;
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  completionRate: number;
}

const AssigneePerformance: React.FC<AssigneePerformanceProps> = ({
  tasks,
}) => {
  const data: AssigneeStats[] = useMemo(() => {
    const map: Record<string, AssigneeStats> = {};

    tasks.forEach((task) => {
      if (!map[task.assignee]) {
        map[task.assignee] = {
          assignee: task.assignee,
          total: 0,
          done: 0,
          inProgress: 0,
          todo: 0,
          completionRate: 0,
        };
      }

      const stat = map[task.assignee];
      stat.total++;

      if (task.status === "done") stat.done++;
      if (task.status === "in_progress") stat.inProgress++;
      if (task.status === "todo") stat.todo++;
    });

    return Object.values(map).map((stat) => ({
      ...stat,
      completionRate:
        stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0,
    }));
  }, [tasks]);

  return (
    <div className="w-full p-4 bg-white rounded-2xl shadow-md space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold">Assignee Performance</h2>
        <p className="text-sm text-gray-500">
          Hiệu suất xử lý task theo từng người
        </p>
      </div>

      {/* Chart */}
      <div className="w-full h-80">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="assignee" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Bar dataKey="done" fill="#22c55e" name="Done" />
            <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
            <Bar dataKey="todo" fill="#ef4444" name="Todo" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2 text-left">Assignee</th>
              <th className="p-2 text-center">Total</th>
              <th className="p-2 text-center">Done</th>
              <th className="p-2 text-center">In Progress</th>
              <th className="p-2 text-center">Todo</th>
              <th className="p-2 text-center">Completion %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.assignee}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-2 font-medium">{row.assignee}</td>
                <td className="p-2 text-center">{row.total}</td>
                <td className="p-2 text-center text-green-600">
                  {row.done}
                </td>
                <td className="p-2 text-center text-yellow-600">
                  {row.inProgress}
                </td>
                <td className="p-2 text-center text-red-600">
                  {row.todo}
                </td>
                <td className="p-2 text-center font-semibold">
                  {row.completionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No data available
        </div>
      )}
    </div>
  );
};

export default AssigneePerformance;
