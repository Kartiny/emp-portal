
'use client';

import { useEffect, useState } from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import { Card, CardContent } from '@/components/ui/card';
import ContractManagementTopbar from '../../../components/ContractManagementTopbar';
import ContractCard from '../../../components/ContractCard';
import CreateContractDialog from '../../../components/CreateContractDialog';
import EmployeeNavbar from '../../../components/EmployeeNavbar';

interface Contract {
  id: number;
  employee_id: [number, string];
  name: string; // Contract Reference
  department_id: [number, string] | false;
  job_id: [number, string] | false;
  date_start: string;
  date_end: string | false;
  resource_calendar_id: [number, string]; // Working Schedule
  state: 'draft' | 'open' | 'close' | 'cancel'; // Contract Status
}

export default function HRContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/odoo/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: { status: statusFilter === 'all' ? undefined : statusFilter } }),
      });
      const data = await response.json();
      if (response.ok) {
        setContracts(data.contracts);
      } else {
        setError(data.error || 'Failed to fetch contracts');
      }
    } catch (err) {
      setError('An error occurred while fetching contracts.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter]); // Re-fetch when statusFilter changes

  const getContractStatus = (state: string) => {
    switch (state) {
      case 'draft':
        return 'New';
      case 'open':
        return 'Running';
      case 'close':
        return 'Expired';
      case 'cancel':
        return 'Cancelled';
      default:
        return state;
    }
  };

  const filteredContracts = contracts.filter((contract) =>
    contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.employee_id[1].toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <p>Loading contracts...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <RoleProtectedRoute allowedRole="hr">
      <EmployeeNavbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Employee Contracts</h1>
        <ContractManagementTopbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        <CreateContractDialog onContractCreated={fetchContracts} />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
