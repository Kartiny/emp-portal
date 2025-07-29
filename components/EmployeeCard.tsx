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
    <Card>
      <CardHeader>
        <CardTitle>{employee.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Email:</strong> {employee.work_email}</p>
        <p><strong>Phone:</strong> {employee.work_phone}</p>
        <p><strong>Job Title:</strong> {employee.job_title}</p>
        <p><strong>Department:</strong> {employee.department_id ? employee.department_id[1] : 'N/A'}</p>
      </CardContent>
    </Card>
  );
}
