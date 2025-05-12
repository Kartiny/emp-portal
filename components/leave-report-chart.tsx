"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export function LeaveReportChart() {
  // Mock data - in a real app, this would come from an API
  const data = [
    { name: "Annual Leave", value: 8, color: "#3b82f6" },
    { name: "Sick Leave", value: 3, color: "#ef4444" },
    { name: "Personal Leave", value: 1, color: "#22c55e" },
    { name: "Remaining", value: 18, color: "#d1d5db" },
  ]

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

