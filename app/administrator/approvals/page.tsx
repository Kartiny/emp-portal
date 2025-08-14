
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, DollarSign, User, Filter, Search } from 'lucide-react';
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

interface ApprovalData {
  leaves: LeaveRequest[];
  expenses: ExpenseRequest[];
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [pendingData, setPendingData] = useState<ApprovalData>({ leaves: [], expenses: [] });
  const [approvedData, setApprovedData] = useState<ApprovalData>({ leaves: [], expenses: [] });
  const [refusedData, setRefusedData] = useState<ApprovalData>({ leaves: [], expenses: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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
          leaves: pendingLeaves.data.leaves || [],
          expenses: pendingExpenses.success ? pendingExpenses.data.expenses || [] : []
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

  const handleApprove = async (type: 'leave' | 'expense', id: number, comment?: string) => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('Not logged in');
        return;
      }

      const endpoint = type === 'leave' 
        ? `/api/odoo/approvals/leaves/${id}/approve`
        : `/api/odoo/approvals/expenses/${id}/approve`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid), comment })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${type === 'leave' ? 'Leave' : 'Expense'} request approved successfully`);
        loadApprovalData(); // Refresh data
      } else {
        toast.error(result.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleRefuse = async (type: 'leave' | 'expense', id: number, comment: string) => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('Not logged in');
        return;
      }

      const endpoint = type === 'leave' 
        ? `/api/odoo/approvals/leaves/${id}/refuse`
        : `/api/odoo/approvals/expenses/${id}/refuse`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid), comment })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${type === 'leave' ? 'Leave' : 'Expense'} request refused successfully`);
        loadApprovalData(); // Refresh data
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
      case 'submit':
        return <Badge variant="secondary">Pending</Badge>;
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
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const filteredData = (data: ApprovalData) => {
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

    // Filter by type
    if (typeFilter === 'leaves') {
      filtered.expenses = [];
    } else if (typeFilter === 'expenses') {
      filtered.leaves = [];
    }

    return filtered;
  };

  const currentData = () => {
    switch (activeTab) {
      case 'pending':
        return filteredData(pendingData);
      case 'approved':
        return filteredData(approvedData);
      case 'refused':
        return filteredData(refusedData);
      default:
        return { leaves: [], expenses: [] };
    }
  };

  const renderLeaveCard = (leave: LeaveRequest) => (
    <Card key={`leave-${leave.id}`} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={leave.employee.avatar} />
              <AvatarFallback>{leave.employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{leave.employee.name}</h3>
              <p className="text-sm text-gray-500">{leave.employee.department}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(leave.state)}
            <Badge variant="outline">{leave.leave_type}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(leave.date_from)} - {formatDate(leave.date_to)}</span>
            <span className="text-gray-500">({leave.number_of_days} days)</span>
          </div>
          <p className="text-sm text-gray-600">{leave.description}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Submitted {formatDate(leave.submitted_date)}</span>
          </div>
        </div>
        
        {activeTab === 'pending' && (
          <div className="flex space-x-2 mt-4">
            <Button 
              size="sm" 
              onClick={() => handleApprove('leave', leave.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => {
                const comment = prompt('Please provide a reason for refusal:');
                if (comment) {
                  handleRefuse('leave', leave.id, comment);
                }
              }}
            >
              Refuse
            </Button>
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderExpenseCard = (expense: ExpenseRequest) => (
    <Card key={`expense-${expense.id}`} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={expense.employee.avatar} />
              <AvatarFallback>{expense.employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{expense.employee.name}</h3>
              <p className="text-sm text-gray-500">{expense.employee.department}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(expense.state)}
            <Badge variant="outline">Expense</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="font-medium">{expense.name}</h4>
          <div className="flex items-center space-x-2 text-sm">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold">{formatCurrency(expense.total_amount, expense.currency)}</span>
          </div>
          <div className="text-sm text-gray-600">
            {expense.expense_lines.length} expense line{expense.expense_lines.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Submitted {formatDate(expense.submitted_date)}</span>
          </div>
        </div>
        
        {activeTab === 'pending' && (
          <div className="flex space-x-2 mt-4">
            <Button 
              size="sm" 
              onClick={() => handleApprove('expense', expense.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => {
                const comment = prompt('Please provide a reason for refusal:');
                if (comment) {
                  handleRefuse('expense', expense.id, comment);
                }
              }}
            >
              Refuse
            </Button>
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const currentDataValue = currentData();
  const totalRequests = currentDataValue.leaves.length + currentDataValue.expenses.length;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Approval Dashboard</h1>
        <p className="text-gray-600">Review and manage pending leave and expense requests</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Request Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="leaves">Leave Requests</SelectItem>
                <SelectItem value="expenses">Expense Requests</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadApprovalData} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            To Approve ({pendingData.leaves.length + pendingData.expenses.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedData.leaves.length + approvedData.expenses.length})
          </TabsTrigger>
          <TabsTrigger value="refused">
            Refused ({refusedData.leaves.length + refusedData.expenses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {totalRequests === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">No pending requests to approve</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentDataValue.leaves.map(renderLeaveCard)}
              {currentDataValue.expenses.map(renderExpenseCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {totalRequests === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">No approved requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentDataValue.leaves.map(renderLeaveCard)}
              {currentDataValue.expenses.map(renderExpenseCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="refused" className="mt-6">
          {totalRequests === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">No refused requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentDataValue.leaves.map(renderLeaveCard)}
              {currentDataValue.expenses.map(renderExpenseCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
