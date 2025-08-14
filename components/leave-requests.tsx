'use client'
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { useRole } from '../context/RoleContext';
import { toast } from 'sonner';

interface LeaveRequest {
  id: number;
  employee_id: [number, string];
  holiday_status_id: [number, string];
  date_from: string;
  date_to: string;
  state: string;
}

export default function LeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { roles } = useRole();

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const uid = localStorage.getItem('uid');
        if (!uid) {
          setError('User ID not found');
          setLoading(false);
          return;
        }

        let url = `/api/odoo/leave/requests?uid=${uid}`;
        if (roles.includes('manager')) {
          url = `/api/odoo/leave/requests/manager/${uid}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch leave requests');
        }
        const data = await response.json();
        setLeaveRequests(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (roles.length > 0) {
      fetchLeaveRequests();
    }
  }, [roles]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/odoo/leave/request/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update leave request');
      }

      setLeaveRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === id ? { ...request, state: status } : request
        )
      );
      toast.success(`Leave request has been ${status === 'validate' ? 'approved' : 'rejected'}.`);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to update leave request.');
    }
  };

  const handleApprove = (id: number) => {
    handleUpdateStatus(id, 'validate');
  };

  const handleReject = (id: number) => {
    handleUpdateStatus(id, 'refuse');
  };

  if (loading) {
    return <div>Loading...</div>;
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
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaveRequests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{request.employee_id && request.employee_id[1] ? request.employee_id[1] : 'N/A'}</TableCell>
            <TableCell>{request.holiday_status_id && request.holiday_status_id[1] ? request.holiday_status_id[1] : 'N/A'}</TableCell>
            <TableCell>{request.date_from}</TableCell>
            <TableCell>{request.date_to}</TableCell>
            <TableCell>
              <Badge variant={request.state === 'validate' ? 'default' : 'secondary'}>
                {request.state}
              </Badge>
            </TableCell>
            <TableCell>
              <Button onClick={() => handleApprove(request.id)} size="sm" className="mr-2">
                Approve
              </Button>
              <Button onClick={() => handleReject(request.id)} size="sm" variant="destructive">
                Reject
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
