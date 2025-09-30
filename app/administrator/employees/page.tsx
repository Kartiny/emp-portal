'use client';

import { useEffect, useState } from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import EmployeeList from '../../../components/EmployeeList';
import EmployeeCard from '../../../components/EmployeeCard';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import CreateEmployeeDialog from '../../../components/CreateEmployeeDialog';
import FilterSidebar from '../../../components/FilterSidebar';
import EmployeeNavbar from '../../../components/EmployeeNavbar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner';

import { useRole } from '@/context/RoleContext';

interface Employee {
  id: number;
  name: string;
  work_phone: string;
  emp_status: string;
  rem_days: number;
  company_id: [number, string] | false;
  department_id: [number, string] | false;
}

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ departmentId?: number }>({}); // Removed companyId from local filters
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { selectedCompanyId } = useRole(); // Get selectedCompanyId from context

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const requestBody = {
        filters: {
          companyId: selectedCompanyId, // Use companyId from context
          departmentId: filters.departmentId,
        },
      };
      console.log('[DEBUG] Frontend fetchEmployees request body:', requestBody);
      const response = await fetch('/api/odoo/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
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

  useEffect(() => {
    fetchEmployees();
  }, [selectedCompanyId, filters.departmentId]); // Re-fetch when selectedCompanyId or departmentId changes

  const handleFilterChange = (newFilters: { departmentId?: number }) => {
    setFilters(newFilters);
  };

  const handleSelectionChange = (employeeId: number, isSelected: boolean) => {
    setSelectedEmployeeIds(prev => 
      isSelected ? [...prev, employeeId] : prev.filter(id => id !== employeeId)
    );
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('/api/odoo/employee', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedEmployeeIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete employees.');
      }

      toast.success('Employees deleted successfully!');
      setSelectedEmployeeIds([]);
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message);
    }
    setIsDeleteDialogOpen(false);
  };

  const filteredEmployees = employees
    .filter((employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((employee) => {
      // Company filtering is now handled by the API based on selectedCompanyId
      if (filters.departmentId && employee.department_id) {
        return employee.department_id[0] === filters.departmentId;
      }
      return true;
    });

  return (
    <RoleProtectedRoute allowedRole="hr">
      <EmployeeNavbar />
      <div className="flex">
        <FilterSidebar onFilterChange={handleFilterChange} />
        <div className="flex-1 p-6 bg-gray-100 min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">Employees</h1>
            <div className="flex items-center space-x-2">
              <CreateEmployeeDialog onEmployeeCreated={fetchEmployees} />
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={selectedEmployeeIds.length === 0}>
                Delete ({selectedEmployeeIds.length})
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="w-1/3">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant={view === 'list' ? "secondary" : "ghost"} onClick={() => setView('list')}>List</Button>
              <Button variant={view === 'card' ? "secondary" : "ghost"} onClick={() => setView('card')}>Card</Button>
            </div>
          </div>

          {isLoading ? (
            <p className="w-full text-center py-4">Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : view === 'list' ? (
            <EmployeeList employees={filteredEmployees} onSelectionChange={handleSelectionChange} selectedIds={selectedEmployeeIds} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredEmployees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          )}
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected employees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleProtectedRoute>
  );
}