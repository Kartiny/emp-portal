"use client";

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from 'lucide-react';

// Mock data - replace with actual API call
const leaveRequestsData = [
  {
    id: 1,
    employee: { name: 'John Doe', avatar: '/placeholder-user.jpg' },
    department: 'Engineering',
    requestType: 'Annual Leave',
    dateRange: '2024-08-15 to 2024-08-20',
    status: 'Pending',
    documents: [{ name: 'Doctor\'s Note.pdf', url: '#' }],
  },
  {
    id: 2,
    employee: { name: 'Jane Smith', avatar: '/placeholder-user.jpg' },
    department: 'Marketing',
    requestType: 'Sick Leave',
    dateRange: '2024-08-12 to 2024-08-12',
    status: 'Approved',
    documents: [],
  },
  {
    id: 3,
    employee: { name: 'Peter Jones', avatar: '/placeholder-user.jpg' },
    department: 'Engineering',
    requestType: 'Unpaid Leave',
    dateRange: '2024-09-01 to 2024-09-05',
    status: 'Rejected',
    documents: [],
  },
];

type SortKey = 'employee' | 'department' | 'requestType' | 'dateRange' | 'status';

export default function LeaveRequestsTable({ searchTerm, statusFilter }: { searchTerm: string; statusFilter: string }) {
  const [requests, setRequests] = useState(leaveRequestsData);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(req => statusFilter === 'All' || req.status === statusFilter)
      .filter(req =>
        req.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.dateRange.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [requests, searchTerm, statusFilter]);

  const sortedRequests = useMemo(() => {
    let sortableItems = [...filteredRequests];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRequests, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleApprove = (id: number) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: 'Approved' } : req));
  };

  const handleReject = (id: number) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: 'Rejected' } : req));
    setSelectedRequest(null);
    setRejectionComment('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'Approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('employee')}>
                <Button variant="ghost">
                  Employee <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('department')}>
                <Button variant="ghost">
                  Department <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('requestType')}>
                <Button variant="ghost">
                  Request Type <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('dateRange')}>
                <Button variant="ghost">
                  Date Range <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('status')}>
                <Button variant="ghost">
                  Status <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequests.map((request) => (
              <TableRow key={request.id} onClick={() => setSelectedRequest(request)} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center">
                    <img src={request.employee.avatar} alt={request.employee.name} className="h-8 w-8 rounded-full mr-3" />
                    {request.employee.name}
                  </div>
                </TableCell>
                <TableCell>{request.department}</TableCell>
                <TableCell>{request.requestType}</TableCell>
                <TableCell>{request.dateRange}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(request.id);
                      }}
                      disabled={request.status !== 'Pending'}
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
                      disabled={request.status !== 'Pending'}
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
              <p><strong>Request Type:</strong> {selectedRequest.requestType}</p>
              <p><strong>Date Range:</strong> {selectedRequest.dateRange}</p>
              <p><strong>Status:</strong> {getStatusBadge(selectedRequest.status)}</p>
              {selectedRequest.documents.length > 0 && (
                <div>
                  <strong>Documents:</strong>
                  <ul>
                    {selectedRequest.documents.map((doc: any, i: number) => (
                      <li key={i}>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {doc.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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