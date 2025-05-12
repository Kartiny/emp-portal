"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function AttendanceReportChart() {
  // Mock data - in a real app, this would come from an API
  const data = [
    {
      name: "Jul",
      present: 21,
      late: 2,
      absent: 0,
    },
    {
      name: "Aug",
      present: 22,
      late: 1,
      absent: 0,
    },
    {
      name: "Sep",
      present: 20,
      late: 2,
      absent: 1,
    },
    {
      name: "Oct",
      present: 21,
      late: 1,
      absent: 1,
    },
    {
      name: "Nov",
      present: 22,
      late: 0,
      absent: 0,
    },
    {
      name: "Dec",
      present: 19,
      late: 1,
      absent: 2,
    },
  ]

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

