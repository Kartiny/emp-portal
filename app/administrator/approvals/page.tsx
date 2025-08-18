'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, DollarSign, User, Filter, Search, Plus, Settings, List, BarChart3, Grid } from 'lucide-react';
import { toast } from 'sonner';

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
  type: 'leave';
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
  type: 'expense';
}

interface ApprovalData {
  leaves: LeaveRequest[];
  expenses: ExpenseRequest[];
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingData, setPendingData] = useState<ApprovalData>({ leaves: [], expenses: [] });
  const [approvedData, setApprovedData] = useState<ApprovalData>({ leaves: [], expenses: [] });
  const [refusedData, setRefusedData] = useState<ApprovalData>({ leaves: [], expenses: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(16);
  const [viewType, setViewType] = useState<'list' | 'chart' | 'grid'>('list');

  useEffect(() => {
    loadApprovalData();
  }, []);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      const uid = localStorage.getItem('uid');
      
      if (!uid) {
        toast.error('Not logged in');
        router.push('/login');
        return;
      }

      // Load pending requests
      const pendingResponse = await fetch(`/api/odoo/approvals/leaves/pending?uid=${uid}`);
      const pendingLeaves = await pendingResponse.json();
      
      const pendingExpensesResponse = await fetch(`/api/odoo/approvals/expenses/pending?uid=${uid}`);
      const pendingExpenses = await pendingExpensesResponse.json();

      if (pendingLeaves.success) {
        setPendingData({
          leaves: (pendingLeaves.data.leaves || []).map(l => ({...l, type: 'leave'})),
          expenses: (pendingExpenses.success ? pendingExpenses.data.expenses || [] : []).map(e => ({...e, type: 'expense'}))
        });
      }

      // TODO: Load approved and refused data from separate endpoints
      setApprovedData({ leaves: [], expenses: [] });
      setRefusedData({ leaves: [], expenses: [] });

    } catch (error) {
      console.error('Error loading approval data:', error);
      toast.error('Failed to load approval data');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (request: LeaveRequest | ExpenseRequest) => {
    if (request.type === 'leave') {
      router.push(`/administrator/approvals/leave/${request.id}`);
    } else {
      router.push(`/administrator/approvals/expense/${request.id}`);
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'confirm':
      case 'submit':
        return <Badge variant="secondary">Waiting Pre-Approval</Badge>;
      case 'validate':
      case 'approve':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'refuse':
      case 'cancel':
        return <Badge variant="destructive">Refused</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getCurrentData = () => {
    switch (statusFilter) {
      case 'pending':
        return pendingData;
      case 'approved':
        return approvedData;
      case 'refused':
        return refusedData;
      default:
        return pendingData;
    }
  };

  const filteredData = () => {
    const data = getCurrentData();
    let filtered = { ...data };

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered.leaves = filtered.leaves.filter(leave =>
        leave.employee.name.toLowerCase().includes(term) ||
        leave.description.toLowerCase().includes(term) ||
        leave.leave_type.toLowerCase().includes(term)
      );
      filtered.expenses = filtered.expenses.filter(expense =>
        expense.employee.name.toLowerCase().includes(term) ||
        expense.name.toLowerCase().includes(term)
      );
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered.leaves = filtered.leaves.filter(leave => leave.department === departmentFilter);
      filtered.expenses = filtered.expenses.filter(expense => expense.department === departmentFilter);
    }

    return filtered;
  };

  const currentData = filteredData();
  const allRequests = [...currentData.leaves, ...currentData.expenses];
  const totalItems = allRequests.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = allRequests.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Filter Sidebar */}
      <div className="w-64 bg-gray-50 border-r p-4 space-y-6">
        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3">STATUS</h3>
          <div className="space-y-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                statusFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                statusFilter === 'pending' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Waiting Pre-Approval
            </button>
            <button
              onClick={() => setStatusFilter('refused')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                statusFilter === 'refused' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Refused
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                statusFilter === 'approved' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Approved
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3">DEPARTMENT</h3>
          <div className="space-y-2">
            <button
              onClick={() => setDepartmentFilter('all')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                departmentFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <div className="pl-3">
              <button
                onClick={() => setDepartmentFilter('Management')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  departmentFilter === 'Management' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ▸ Management
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold">Time Off Analysis</h1>
              <Settings className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{startIndex + 1}-{Math.min(endIndex, totalItems)} / {totalItems}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / itemsPerPage), currentPage + 1))}
                disabled={endIndex >= totalItems}
              >
                ›
              </Button>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant={viewType === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewType === 'chart' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('chart')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewType === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Number of Days</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request: any) => (
                <TableRow key={`${request.type}-${request.id}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(request)}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={request.employee.avatar} />
                        <AvatarFallback>{request.employee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{request.employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.type === 'leave' ? 
                      `${request.number_of_days.toFixed(2)} days` : 
                      formatCurrency(request.total_amount, request.currency)
                    }
                  </TableCell>
                  <TableCell>{formatDate(request.date_from)}</TableCell>
                  <TableCell>{formatDate(request.date_to)}</TableCell>
                  <TableCell>{getStatusBadge(request.state)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {request.type === 'leave' ? request.description : request.name}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}