'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Calendar,
  ArrowRight,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileRequest {
  id: number;
  employee_id: number[];
  requester_id: number[];
  approver_id: number[];
  request_type: string;
  current_data: any;
  requested_changes: any;
  status: string;
  request_date: string;
  approval_date?: string;
  approval_notes?: string;
  employee_name: string;
  requester_name: string;
  request_date_formatted: string;
  changes_count: number;
  status_color: string;
}

export default function PendingRequestsWidget() {
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ProfileRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('User not authenticated');
        return;
      }

      const response = await fetch('/api/odoo/profile/pending-requests', {
        headers: {
          'uid': uid,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch pending requests');
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!approvalNotes.trim()) {
      toast.error('Please provide approval notes');
      return;
    }

    setIsProcessing(true);
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('User not authenticated');
        return;
      }

      const response = await fetch(`/api/odoo/profile/approve-request/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'uid': uid
        },
        body: JSON.stringify({ notes: approvalNotes })
      });

      if (response.ok) {
        toast.success('Profile change request approved successfully');
        setSelectedRequest(null);
        setApprovalNotes('');
        fetchPendingRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!approvalNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    setIsProcessing(true);
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('User not authenticated');
        return;
      }

      const response = await fetch(`/api/odoo/profile/reject-request/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'uid': uid
        },
        body: JSON.stringify({ notes: approvalNotes })
      });

      if (response.ok) {
        toast.success('Profile change request rejected successfully');
        setSelectedRequest(null);
        setApprovalNotes('');
        fetchPendingRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Loading pending requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pending Profile Change Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>No Pending Requests</AlertTitle>
            <AlertDescription>
              There are no pending profile change requests requiring your approval.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pending Profile Change Requests ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <h3 className="font-semibold">{request.employee_name}</h3>
                        <p className="text-sm text-gray-600">
                          Requested by {request.requester_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Profile Change Request Review</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            {/* Request Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                              <div>
                                <Label className="text-sm font-medium">Employee</Label>
                                <p>{request.employee_name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Request Date</Label>
                                <p>{request.request_date_formatted}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Changes Requested</Label>
                                <p>{request.changes_count} field(s)</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(request.status)}
                                  {getStatusBadge(request.status)}
                                </div>
                              </div>
                            </div>

                            {/* Changes Comparison */}
                            <div className="space-y-3">
                              <h4 className="font-semibold">Requested Changes</h4>
                              {Object.entries(request.requested_changes).map(([field, newValue]) => (
                                <div key={field} className="p-3 border rounded">
                                  <div className="font-medium text-sm mb-2">
                                    {field.replace(/_/g, ' ').toUpperCase()}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="text-gray-600">Current:</div>
                                    <div className="text-red-600 line-through">
                                      {request.current_data[field] || 'Not set'}
                                    </div>
                                    <div></div>
                                    <div className="text-gray-600">New:</div>
                                    <div className="text-green-600 font-semibold">
                                      {newValue as string}
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Approval Notes */}
                            <div className="space-y-2">
                              <Label htmlFor="approval-notes">Approval/Rejection Notes</Label>
                              <Textarea
                                id="approval-notes"
                                placeholder="Provide notes for your decision..."
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                rows={3}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(null);
                                  setApprovalNotes('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                disabled={isProcessing || !approvalNotes.trim()}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleApprove(request.id)}
                                disabled={isProcessing || !approvalNotes.trim()}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {request.request_date_formatted}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{request.changes_count} change(s)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 