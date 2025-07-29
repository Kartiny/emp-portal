'use client';

import { useEffect, useState } from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import EmployeeList from '../../../components/EmployeeList';
import EmployeeCard from '../../../components/EmployeeCard';
import { Button } from "@/components/ui/button";

interface Employee {
  id: number;
  name: string;
  work_email: string;
  work_phone: string;
  job_title: string;
  department_id: [number, string] | false;
}

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/odoo/employee');
        const data = await response.json();
        if (response.ok) {
          setEmployees(data.employees);
        } else {
          setError(data.error || 'Failed to fetch employees');
        }
      } catch (err) {
        setError('An error occurred while fetching employees.');
      }
      setIsLoading(false);
    };

    fetchEmployees();
  }, []);

  return (
    <RoleProtectedRoute allowedRole="hr">
      <div className="p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Employees</h1>
          <div>
            <Button variant={view === 'list' ? "secondary" : "ghost"} onClick={() => setView('list')}>List</Button>
            <Button variant={view === 'card' ? "secondary" : "ghost"} onClick={() => setView('card')}>Card</Button>
          </div>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : view === 'list' ? (
          <EmployeeList employees={employees} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        )}
      </div>
    </RoleProtectedRoute>
  );
} 