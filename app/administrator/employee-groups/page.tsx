
'use client';

import { useEffect, useState } from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EmployeeGroup {
  id: number;
  name: string;
  description: string;
  active: boolean;
  calendar_id: [number, string] | false;
  company_id: [number, string] | false;
}

export default function HREmployeeGroupsPage() {
  const [employeeGroups, setEmployeeGroups] = useState<EmployeeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployeeGroups = async () => {
      try {
        const response = await fetch('/api/odoo/employee-group');
        const data = await response.json();
        if (response.ok) {
          setEmployeeGroups(data.employeeGroups);
        } else {
          setError(data.error || 'Failed to fetch employee groups');
        }
      } catch (err) {
        setError('An error occurred while fetching employee groups.');
      }
      setIsLoading(false);
    };

    fetchEmployeeGroups();
  }, []);

  if (isLoading) {
    return <p>Loading employee groups...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <RoleProtectedRoute allowedRole="hr">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Employee Groups</h1>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Working Schedule</TableHead>
                  <TableHead>Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No employee groups found.</TableCell>
                  </TableRow>
                ) : (
                  employeeGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.description || 'N/A'}</TableCell>
                      <TableCell>{group.active ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{group.calendar_id ? group.calendar_id[1] : 'N/A'}</TableCell>
                      <TableCell>{group.company_id ? group.company_id[1] : 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </RoleProtectedRoute>
  );
}
