'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  name?: string;
  mobile_phone?: string;
  work_phone?: string;
  work_email?: string;
  private_street?: string;
  private_street2?: string;
  private_zip?: string;
  private_state_id?: any;
  country_id?: any;
  emergency_contact?: string;
  emergency_phone?: string;
  [key: string]: any;
}

interface ProfileChangeFormProps {
  currentProfile: ProfileData;
  onRequestSubmitted?: () => void;
}

export default function ProfileChangeForm({ currentProfile, onRequestSubmitted }: ProfileChangeFormProps) {
  const [formData, setFormData] = useState<ProfileData>({});
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  useEffect(() => {
    // Initialize form with current profile data
    setFormData(currentProfile);
    
    // Check for pending requests
    checkPendingRequest();
  }, [currentProfile]);

  const checkPendingRequest = async () => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) return;

      const response = await fetch('/api/odoo/profile/my-requests', {
        headers: {
          'uid': uid,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHasPendingRequest(data.hasPendingRequest);
        
        if (data.hasPendingRequest) {
          const pending = data.requests.find((req: any) => req.status === 'pending');
          setPendingRequest(pending);
        }
      }
    } catch (error) {
      console.error('Error checking pending request:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getChangedFields = () => {
    const changes: ProfileData = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== currentProfile[key]) {
        changes[key] = formData[key];
      }
    });
    return changes;
  };

  const handleSubmitRequest = async () => {
    const changes = getChangedFields();
    
    if (Object.keys(changes).length === 0) {
      toast.error('No changes detected');
      return;
    }

    setIsSubmitting(true);

    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('User not authenticated');
        return;
      }

      const response = await fetch('/api/odoo/profile/request-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'uid': uid
        },
        body: JSON.stringify({ changes })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Profile change request submitted successfully. Awaiting approval from ${data.approver}`);
        setHasPendingRequest(true);
        onRequestSubmitted?.();
        checkPendingRequest();
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit profile change request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (label: string, field: string, type: string = 'text', placeholder?: string) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <Input
        id={field}
        type={type}
        value={formData[field] || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        disabled={hasPendingRequest || isSubmitting}
        className={formData[field] !== currentProfile[field] ? 'border-blue-500 bg-blue-50' : ''}
      />
      {formData[field] !== currentProfile[field] && (
        <div className="text-xs text-blue-600">
          Current: {currentProfile[field] || 'Not set'}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Pending Request Alert */}
      {hasPendingRequest && pendingRequest && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Profile Change Request Pending</AlertTitle>
          <AlertDescription>
            Your profile change request is pending approval from{' '}
            <span className="font-semibold">{pendingRequest.approver_name}</span>.
            <br />
            <span className="text-sm text-muted-foreground">
              Requested on {pendingRequest.request_date_formatted}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Changes Summary */}
      {Object.keys(getChangedFields()).length > 0 && !hasPendingRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requested Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(getChangedFields()).map(([field, newValue]) => (
                <div key={field} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{field.replace(/_/g, ' ').toUpperCase()}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 line-through text-sm">
                      {currentProfile[field] || 'Not set'}
                    </span>
                    <span className="text-green-600 font-semibold">
                      {newValue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Profile Information
            {hasPendingRequest && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Request Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Full Name', 'name', 'text', 'Enter your full name')}
            {renderField('Mobile Phone', 'mobile_phone', 'tel', '+60123456789')}
            {renderField('Work Phone', 'work_phone', 'tel', '+60123456789')}
            {renderField('Work Email', 'work_email', 'email', 'email@company.com')}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Street Address', 'private_street', 'text', 'Enter street address')}
              {renderField('Street Address 2', 'private_street2', 'text', 'Apartment, suite, etc.')}
              {renderField('Postal Code', 'private_zip', 'text', 'Enter postal code')}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Emergency Contact Name', 'emergency_contact', 'text', 'Emergency contact name')}
              {renderField('Emergency Contact Phone', 'emergency_phone', 'tel', '+60123456789')}
            </div>
          </div>

          {/* Submit Button */}
          {!hasPendingRequest && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmitRequest}
                disabled={isSubmitting || Object.keys(getChangedFields()).length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Change Request'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 