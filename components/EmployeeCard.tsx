'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Employee {
  id: number;
  name: string;
  work_email: string;
  work_phone: string;
  job_title: string;
  department_id: [number, string] | false;
}

interface EmployeeCardProps {
  employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg bg-white">
      <div className="relative">
        <img
          className="w-full h-40 object-cover"
          src={`/placeholder-user.jpg`}
          alt={`${employee.name} profile picture`}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-25"></div>
        <div className="absolute bottom-0 left-0 p-3">
          <h2 className="text-md font-bold text-white">{employee.name}</h2>
          <p className="text-xs text-gray-200">{employee.job_title}</p>
        </div>
      </div>
    </Card>
  );
}