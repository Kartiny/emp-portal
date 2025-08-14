
"use client";

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from 'lucide-react';
import ApprovalButtons from './components/approval-buttons';

const expenseClaimsData = [
  {
    id: 1,
    employee: { name: 'Alice Johnson', avatar: '/placeholder-user.jpg' },
    department: 'Sales',
    requestType: 'Travel',
    amount: '$250.00',
    status: 'Pending',
    receipts: [{ name: 'Flight_Receipt.pdf', url: '#' }],
  },
  {
    id: 2,
    employee: { name: 'Bob Williams', avatar: '/placeholder-user.jpg' },
    department: 'Sales',
    requestType: 'Meals',
    amount: '$75.50',
    status: 'Approved',
    receipts: [{ name: 'Dinner_Receipt.jpg', url: '#' }],
  },
  {
    id: 3,
    employee: { name: 'Charlie Brown', avatar: '/placeholder-user.jpg' },
    department: 'Marketing',
    requestType: 'Software',
    amount: '$120.00',
    status: 'Rejected',
    receipts: [],
  },
];

type SortKey = 'employee' | 'department' | 'requestType' | 'amount' | 'status';

export default function ExpenseClaimsTable({ searchTerm, statusFilter }) {
  const [claims, setClaims] = useState(expenseClaimsData);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

  const filteredClaims = useMemo(() => {
    return claims
      .filter(claim => statusFilter === 'All' || claim.status === statusFilter)
      .filter(claim =>
        claim.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.amount.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [claims, searchTerm, statusFilter]);

  const sortedClaims = useMemo(() => {
    let sortableItems = [...filteredClaims];
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
  }, [filteredClaims, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleApprove = (id) => {
    setClaims(claims.map(claim => claim.id === id ? { ...claim, status: 'Approved' } : claim));
  };

  const handleReject = (id) => {
    setClaims(claims.map(claim => claim.id === id ? { ...claim, status: 'Rejected' } : claim));
    setSelectedClaim(null);
    setRejectionComment('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <Badge variant="secondary">Pending</Badge>;
      case 'Approved': return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
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
                  Expense Type <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('amount')}>
                <Button variant="ghost">
                  Amount <ArrowUpDown className="ml-2 h-4 w-4" />
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
            {sortedClaims.map((claim) => (
              <TableRow key={claim.id} onClick={() => setSelectedClaim(claim)} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center">
                    <img src={claim.employee.avatar} alt={claim.employee.name} className="h-8 w-8 rounded-full mr-3" />
                    {claim.employee.name}
                  </div>
                </TableCell>
                <TableCell>{claim.department}</TableCell>
                <TableCell>{claim.requestType}</TableCell>
                <TableCell>{claim.amount}</TableCell>
                <TableCell>{getStatusBadge(claim.status)}</TableCell>
                <TableCell>
                  <ApprovalButtons
                    onApprove={() => handleApprove(claim.id)}
                    onReject={() => setSelectedClaim(claim)}
                    status={claim.status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Expense Claim Details</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="grid gap-4 py-4">
              <p><strong>Employee:</strong> {selectedClaim.employee.name}</p>
              <p><strong>Department:</strong> {selectedClaim.department}</p>
              <p><strong>Expense Type:</strong> {selectedClaim.requestType}</p>
              <p><strong>Amount:</strong> {selectedClaim.amount}</p>
              <p><strong>Status:</strong> {getStatusBadge(selectedClaim.status)}</p>
              {selectedClaim.receipts.length > 0 && (
                <div>
                  <strong>Receipts:</strong>
                  <ul>
                    {selectedClaim.receipts.map((receipt, i) => (
                      <li key={i}><a href={receipt.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{receipt.name}</a></li>
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
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>Cancel</Button>
            <Button onClick={() => handleReject(selectedClaim.id)} disabled={!rejectionComment}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
