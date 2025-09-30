
'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface LeaveBalance {
  id: number;
  employee_id: [number, string];
  number_of_days: number;
  holiday_status_id: [number, string];
}

export default function LeaveBalances() {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveBalances = async () => {
      try {
        const response = await fetch('/api/odoo/leave/balances');
        if (!response.ok) {
          throw new Error('Failed to fetch leave balances');
        }
        const data = await response.json();
        setLeaveBalances(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch leave balances');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveBalances();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center w-full py-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Leave Type</TableHead>
          <TableHead>Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaveBalances.map((balance) => (
          <TableRow key={balance.id}>
            <TableCell>{balance.employee_id && balance.employee_id[1] ? balance.employee_id[1] : 'N/A'}</TableCell>
            <TableCell>{balance.holiday_status_id && balance.holiday_status_id[1] ? balance.holiday_status_id[1] : 'N/A'}</TableCell>
            <TableCell>{balance.number_of_days}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
