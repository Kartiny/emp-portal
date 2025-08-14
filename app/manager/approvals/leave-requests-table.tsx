"use client";

import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Employee {
  id: number;
  name: string;
  department: string;
  avatar: string;
  email: string;
}

interface LeaveRequest {
  id: number;
  employee: Employee;
  leave_type: string;
  date_from: string;
  date_to: string;
  number_of_days: number;
  description: string;
  state: string;
  submitted_date: string;
  department: string;
}

type SortKey = 'employee.name' | 'department' | 'leave_type' | 'date_from' | 'state';

export default function LeaveRequestsTable({ searchTerm, statusFilter }: { searchTerm: string; statusFilter: string }) {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('Not logged in');
        router.push('/login');
        return;
      }

      let endpoint = '';
      if (statusFilter === 'Pending') {
        endpoint = `/api/odoo/approvals/leaves/pending?uid=${uid}`;
      } else if (statusFilter === 'Approved') {
        endpoint = `/api/odoo/approvals/leaves/approved?uid=${uid}`;
      } else if (statusFilter === 'Rejected') {
        endpoint = `/api/odoo/approvals/leaves/refused?uid=${uid}`;
      }

      if (endpoint) {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.success) {
          setRequests(data.data.leaves);
        } else {
          toast.error(data.error || 'Failed to fetch leave requests');
        }
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
  }, [searchTerm, statusFilter]); // Reload when filters change

  const filteredRequests = useMemo(() => {
    return requests.filter(req =>
      req.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.leave_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  const sortedRequests = useMemo(() => {
    let sortableItems = [...filteredRequests];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'employee.name') {
          aValue = a.employee.name;
          bValue = b.employee.name;
        } else {
          aValue = (a as any)[sortConfig.key];
          bValue = (b as any)[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRequests, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleApprove = async (id: number) => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('Not logged in');
        return;
      }

      const response = await fetch(`/api/odoo/approvals/leaves/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Leave request approved successfully');
        loadLeaveRequests(); // Refresh data
      } else {
        toast.error(result.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('Not logged in');
        return;
      }

      const response = await fetch(`/api/odoo/approvals/leaves/${id}/refuse`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid), comment: rejectionComment })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Leave request refused successfully');
        loadLeaveRequests(); // Refresh data
        setSelectedRequest(null);
        setRejectionComment('');
      } else {
        toast.error(result.error || 'Failed to refuse request');
      }
    } catch (error) {
      console.error('Error refusing request:', error);
      toast.error('Failed to refuse request');
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'confirm':
        return <Badge variant="secondary">Pending</Badge>;
      case 'validate':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'refuse':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const formatDateRange = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${fromDate.toLocaleDateString('en-US', options)} to ${toDate.toLocaleDateString('en-US', options)}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading leave requests...</div>;
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('employee.name')}>
                <Button variant="ghost">
                  Employee <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('department')}>
                <Button variant="ghost">
                  Department <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('leave_type')}>
                <Button variant="ghost">
                  Request Type <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('date_from')}>
                <Button variant="ghost">
                  Date Range <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('state')}>
                <Button variant="ghost">
                  Status <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              sortedRequests.map((request) => (
                <TableRow key={request.id} onClick={() => setSelectedRequest(request)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center">
                      <img src={request.employee.avatar} alt={request.employee.name} className="h-8 w-8 rounded-full mr-3" />
                      {request.employee.name}
                    </div>
                  </TableCell>
                  <TableCell>{request.department}</TableCell>
                  <TableCell>{request.leave_type}</TableCell>
                  <TableCell>{formatDateRange(request.date_from, request.date_to)}</TableCell>
                  <TableCell>{getStatusBadge(request.state)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(request.id);
                        }}
                        disabled={request.state !== 'confirm'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                        }}
                        disabled={request.state !== 'confirm'}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <p><strong>Employee:</strong> {selectedRequest.employee.name}</p>
              <p><strong>Department:</strong> {selectedRequest.department}</p>
              <p><strong>Request Type:</strong> {selectedRequest.leave_type}</p>
              <p><strong>Date Range:</strong> {formatDateRange(selectedRequest.date_from, selectedRequest.date_to)}</p>
              <p><strong>Number of Days:</strong> {selectedRequest.number_of_days}</p>
              <p><strong>Description:</strong> {selectedRequest.description}</p>
              <p><strong>Status:</strong> {getStatusBadge(selectedRequest.state)}</p>
              {/* Documents are not part of the current API response for leave requests */}
              <Textarea
                placeholder="Add comments for rejection..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button onClick={() => handleReject(selectedRequest?.id)} disabled={!rejectionComment}>
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 