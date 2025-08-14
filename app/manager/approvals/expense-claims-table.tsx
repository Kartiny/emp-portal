
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

interface ExpenseRequest {
  id: number;
  employee: Employee;
  name: string;
  total_amount: number;
  currency: string;
  state: string;
  submitted_date: string;
  expense_lines: Array<{
    id: number;
    description: string;
    product: string;
    unit_amount: number;
    quantity: number;
    total_amount: number;
    date: string;
    has_attachment: boolean;
  }>;
  department: string;
}

type SortKey = 'employee.name' | 'department' | 'name' | 'total_amount' | 'state';

export default function ExpenseClaimsTable({ searchTerm, statusFilter }: { searchTerm: string; statusFilter: string }) {
  const router = useRouter();
  const [claims, setClaims] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ExpenseRequest | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const loadExpenseClaims = async () => {
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
        endpoint = `/api/odoo/approvals/expenses/pending?uid=${uid}`;
      } else if (statusFilter === 'Approved') {
        endpoint = `/api/odoo/approvals/expenses/approved?uid=${uid}`;
      } else if (statusFilter === 'Rejected') {
        endpoint = `/api/odoo/approvals/expenses/refused?uid=${uid}`;
      }

      if (endpoint) {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.success) {
          setClaims(data.data.expenses);
        } else {
          toast.error(data.error || 'Failed to fetch expense claims');
        }
      }
    } catch (error) {
      console.error('Error loading expense claims:', error);
      toast.error('Failed to load expense claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenseClaims();
  }, [searchTerm, statusFilter]); // Reload when filters change

  const filteredClaims = useMemo(() => {
    return claims.filter(claim =>
      claim.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [claims, searchTerm]);

  const sortedClaims = useMemo(() => {
    let sortableItems = [...filteredClaims];
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
  }, [filteredClaims, sortConfig]);

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

      const response = await fetch(`/api/odoo/approvals/expenses/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Expense claim approved successfully');
        loadExpenseClaims(); // Refresh data
      } else {
        toast.error(result.error || 'Failed to approve claim');
      }
    } catch (error) {
      console.error('Error approving claim:', error);
      toast.error('Failed to approve claim');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('Not logged in');
        return;
      }

      const response = await fetch(`/api/odoo/approvals/expenses/${id}/refuse`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid), comment: rejectionComment })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Expense claim refused successfully');
        loadExpenseClaims(); // Refresh data
        setSelectedClaim(null);
        setRejectionComment('');
      } else {
        toast.error(result.error || 'Failed to refuse claim');
      }
    } catch (error) {
      console.error('Error refusing claim:', error);
      toast.error('Failed to refuse claim');
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'submit':
      case 'reported':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'refused':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-8">Loading expense claims...</div>;
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
              <TableHead onClick={() => requestSort('name')}>
                <Button variant="ghost">
                  Expense Type <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => requestSort('total_amount')}>
                <Button variant="ghost">
                  Amount <ArrowUpDown className="ml-2 h-4 w-4" />
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
            {sortedClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No expense claims found.
                </TableCell>
              </TableRow>
            ) : (
              sortedClaims.map((claim) => (
                <TableRow key={claim.id} onClick={() => setSelectedClaim(claim)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center">
                      <img src={claim.employee.avatar} alt={claim.employee.name} className="h-8 w-8 rounded-full mr-3" />
                      {claim.employee.name}
                    </div>
                  </TableCell>
                  <TableCell>{claim.department}</TableCell>
                  <TableCell>{claim.name}</TableCell>
                  <TableCell>{formatCurrency(claim.total_amount, claim.currency)}</TableCell>
                  <TableCell>{getStatusBadge(claim.state)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(claim.id);
                        }}
                        disabled={claim.state !== 'submit' && claim.state !== 'reported'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClaim(claim);
                        }}
                        disabled={claim.state !== 'submit' && claim.state !== 'reported'}
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

      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Expense Claim Details</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="grid gap-4 py-4">
              <p><strong>Employee:</strong> {selectedClaim.employee.name}</p>
              <p><strong>Department:</strong> {selectedClaim.department}</p>
              <p><strong>Expense Type:</strong> {selectedClaim.name}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedClaim.total_amount, selectedClaim.currency)}</p>
              <p><strong>Status:</strong> {getStatusBadge(selectedClaim.state)}</p>
              {/* Documents are not part of the current API response for expense claims */}
              <Textarea
                placeholder="Add comments for rejection..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>
              Cancel
            </Button>
            <Button onClick={() => handleReject(selectedClaim?.id)} disabled={!rejectionComment}>
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
