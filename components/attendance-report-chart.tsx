"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function AttendanceReportChart({ data }: { data: { name: string; present: number; late: number; absent: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-gray-400">No data</div>;
  }
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="present" fill="#22c55e" name="Present" />
          <Bar dataKey="late" fill="#eab308" name="Late" />
          <Bar dataKey="absent" fill="#ef4444" name="Absent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

