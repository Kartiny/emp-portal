
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface Employee {
  id: number;
  name: string;
  work_phone: string;
  emp_status: string;
  rem_days: number;
}

interface EmployeeListProps {
  employees: Employee[];
  selectedIds: number[];
  onSelectionChange: (employeeId: number, isSelected: boolean) => void;
}

export default function EmployeeList({ employees, selectedIds, onSelectionChange }: EmployeeListProps) {
  const handleSelectAll = (isSelected: boolean) => {
    employees.forEach(employee => onSelectionChange(employee.id, isSelected));
  };

  const isAllSelected = employees.length > 0 && selectedIds.length === employees.length;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[50px] px-6">
              <Checkbox 
                checked={isAllSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
              />
            </TableHead>
            <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableHead>
            <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Phone</TableHead>
            <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Status</TableHead>
            <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Days</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {employees.map((employee) => (
            <TableRow key={employee.id} className="hover:bg-gray-50">
              <TableCell className="px-6">
                <Checkbox 
                  checked={selectedIds.includes(employee.id)}
                  onCheckedChange={(checked) => onSelectionChange(employee.id, Boolean(checked))}
                />
              </TableCell>
              <TableCell className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{employee.name}</TableCell>
              <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{employee.work_phone}</TableCell>
              <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{employee.emp_status}</TableCell>
              <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{employee.rem_days}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
