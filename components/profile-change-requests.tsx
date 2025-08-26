'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProfileChangeRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  requested_changes: Record<string, any>;
  comment: string;
  request_date: string;
  state: string;
}

export function ProfileChangeRequests() {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ProfileChangeRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);

      const res = await fetch('/api/odoo/auth/profile/pending-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uid }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch requests');
      }

      const { data } = await res.json();
      setRequests(data);
    } catch (err: any) {
      console.error('❌ Failed to fetch requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);

      const res = await fetch(`/api/odoo/auth/profile/approve-changes/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uid, comment }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to approve request');
      }

      toast.success('Profile change request approved successfully');
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setComment('');
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      console.error('❌ Failed to approve request:', err);
      toast.error(err.message || 'Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);

      const res = await fetch(`/api/odoo/auth/profile/reject-changes/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uid, comment }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reject request');
      }

      toast.success('Profile change request rejected successfully');
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setComment('');
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      console.error('❌ Failed to reject request:', err);
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading profile change requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-red-600 p-6">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile Change Requests</h2>
          <p className="text-muted-foreground">Review and approve employee profile change requests</p>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No pending profile change requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.employee_name}</CardTitle>
                    <CardDescription>
                      Requested on {format(new Date(request.request_date), 'PPP')}
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.state)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.comment && (
                    <div>
                      <Label className="text-sm font-medium">Employee Comment:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{request.comment}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium">Requested Changes:</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(request.requested_changes).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-muted-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowApproveDialog(true);
                      }}
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectDialog(true);
                      }}
                      variant="destructive"
                      size="sm"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Profile Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve these profile changes for {selectedRequest?.employee_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-comment">Comment (Optional)</Label>
              <Textarea
                id="approve-comment"
                placeholder="Add a comment for the approval..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Profile Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject these profile changes for {selectedRequest?.employee_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-comment">Reason for Rejection</Label>
              <Textarea
                id="reject-comment"
                placeholder="Please provide a reason for rejecting these changes..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 