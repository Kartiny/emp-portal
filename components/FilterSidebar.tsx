'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterSidebarProps {
  onFilterChange: (filters: { departmentId?: number }) => void;
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/odoo/department');
        const data = await response.json();
        if (response.ok) {
          setDepartments(data.departments);
        }
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };

    fetchDepartments();
  }, []);

  const handleDepartmentChange = (departmentIdStr: string) => {
    const departmentId = departmentIdStr === 'all' ? undefined : Number(departmentIdStr);
    setSelectedDepartment(departmentId);
    onFilterChange({ departmentId });
  };

  return (
    <div className="w-56 bg-white p-4 shadow-md flex-shrink-0">
      <h2 className="text-md font-semibold mb-4">Filter by</h2>
      <div>
        <h3 className="font-semibold mb-2 text-sm">Department</h3>
        <Select onValueChange={handleDepartmentChange} value={selectedDepartment ? String(selectedDepartment) : 'all'}>
          <SelectTrigger>
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={String(department.id)}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}