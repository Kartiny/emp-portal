'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, Building, FileText, CheckCircle, XCircle, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface LeaveRequest {
  id: number;
  employee: {
    id: number;
    name: string;
    department: string;
    avatar: string;
    email: string;
    job_title: string;
  };
  leave_type: {
    id: number;
    name: string;
    color: string;
  };
  date_from: string;
  date_to: string;
  number_of_days: number;
  description: string;
  state: string;
  submitted_date: string;
  request_unit_hours: boolean;
  request_hour_from: string | false;
  request_hour_to: string | false;
  department: string;
}

export default function LeaveRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  
  const [request, setRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/odoo/leave/request/${requestId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leave request');
        }
        
        const data = await response.json();
        setRequest(data);
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load leave request details');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchLeaveRequest();
    }
  }, [requestId]);

  const handleAction = async (action: 'validate' | 'refuse' | 'draft') => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/odoo/leave/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update leave request');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Leave request ${action === 'validate' ? 'approved' : action === 'refuse' ? 'rejected' : 'marked as draft'} successfully`);
        // Refresh the request data
        const updatedResponse = await fetch(`/api/odoo/leave/request/${requestId}`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setRequest(updatedData);
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'confirm':
        return <Badge className="bg-blue-500 text-white">Waiting Pre-Approval</Badge>;
      case 'validate':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'refuse':
        return <Badge variant="destructive">Refused</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading leave request details...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Request</h1>
          <p className="text-gray-600">{error || 'Leave request not found'}</p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => router.back()} 
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {request.employee.name} on {request.leave_type.name}
            </h1>
            <p className="text-gray-600">
              {request.number_of_days} hours on {formatDate(request.date_from)}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          {request.state === 'confirm' && (
            <>
              <Button 
                onClick={() => handleAction('validate')}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button 
                onClick={() => handleAction('refuse')}
                disabled={actionLoading}
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Refuse
              </Button>
              <Button 
                onClick={() => handleAction('draft')}
                disabled={actionLoading}
                variant="outline"
              >
                <Edit className="w-4 h-4 mr-2" />
                Mark as Draft
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        {getStatusBadge(request.state)}
        {request.state === 'confirm' && (
          <Badge variant="outline" className="text-gray-500">Approved</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Request Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Mode</label>
                <p className="text-sm">By Employee</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Employee</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={request.employee.avatar} />
                    <AvatarFallback>{request.employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{request.employee.name}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Time Off Type</label>
              <p className="text-sm">{request.leave_type.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Dates</label>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {formatDate(request.date_from)}
                  {request.date_from !== request.date_to && (
                    <>
                      <span className="mx-2">→</span>
                      {formatDate(request.date_to)}
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Half Day</label>
                <p className="text-sm">Not available</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Custom Hours</label>
                <p className="text-sm">{request.request_unit_hours ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {request.request_unit_hours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">From</label>
                  <p className="text-sm">{request.request_hour_from ? formatTime(request.request_hour_from) : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">To</label>
                  <p className="text-sm">{request.request_hour_to ? formatTime(request.request_hour_to) : 'N/A'}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">Duration</label>
              <p className="text-sm">{request.number_of_days} Days ({request.number_of_days * 8} Hours)</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">
                {request.description || 'No description provided'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Supporting Document</label>
              {/* The original code had attachments, but the new interface doesn't include them.
                  Assuming attachments are no longer part of the LeaveRequest interface or are handled elsewhere.
                  For now, removing the attachments section as it's not directly related to the new interface. */}
              <p className="text-sm text-gray-500 mt-1">Attachments are not available in this version.</p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Employee & Department Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Employee Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={request.employee.avatar} />
                <AvatarFallback className="text-lg">{request.employee.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{request.employee.name}</h3>
                <p className="text-sm text-gray-600">{request.employee.job_title}</p>
                <p className="text-sm text-gray-500">{request.employee.email}</p>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Department</span>
              </label>
              <p className="text-sm mt-1">{request.department}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Year</span>
              </label>
              <p className="text-sm mt-1">{new Date(request.date_from).getFullYear()}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Submitted Date</label>
              <p className="text-sm mt-1">{formatDate(request.submitted_date)}</p>
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Leave Balance</h4>
              <p className="text-sm text-blue-700">
                This information would show the employee's current leave balance for {request.leave_type.name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}