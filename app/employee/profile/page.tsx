'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

const MARITAL_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'cohabitant', label: 'Legal Cohabitant' },
  { value: 'widower', label: 'Widower' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widow', label: 'Widow' },
] as const;

type Gender = typeof GENDER_OPTIONS[number]['value'] | false;
type MaritalStatus = typeof MARITAL_OPTIONS[number]['value'] | false;

// Extend EmployeeProfile with new fields for private info, bank details, and status history
interface EmployeeProfile {
  // 1. Basic Information
  id?: number;
  image_1920?: string | null;
  name: string;
  mobile_phone: string;
  work_phone: string;
  work_email: string;
  barcode: string;
  gender: Gender;
  birthday: string;
  age: number;
  place_of_birth: string;
  country_of_birth: [number, string];
  // 2. Work Information
  job_title: string;
  department_id: [number, string];
  parent_id: [number, string];
  expense_manager_id: [number, string];
  leave_manager_id: [number, string];
  attendance_manager_id: [number, string];
  contract_id: [number, string];
  // 3. Private Information
  private_street: string;
  private_street2: string;
  private_zip: string;
  private_state_id: [number, string];
  country_id: [number, string];
  permanent_resident: string;
  // 3.1 Family Status
  marital: MaritalStatus;
  children: number;
  // 3.2 Emergency
  emergency_contact: string;
  emergency_phone: string;
  // 3.3 Education
  certificate: string;
  study_field: string;
  study_school: string;
  // 3.4 Work permit
  visa_no: string;
  permit_no: string;
  visa_expire: string;
  work_permit_expiration_date: string;
  has_work_permit: boolean;
  // 3.5 Citizenship
  emp_country: string;
  emp_old_ic: string;
  identification_id: string;
  ssnid: string;
  passport_id: string;
  passport_exp_date: string;
  residence_status: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  // Add state for bank details and status history
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  // Add state for residency options
  const [residencyOptions, setResidencyOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const rawUid = localStorage.getItem('uid');
        if (!rawUid) throw new Error('Not logged in');
        const uid = Number(rawUid);

        const res = await fetch('/api/odoo/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ uid }),
        });

        if (!res.ok) {
          let errPayload: any;
          try {
            errPayload = await res.json();
          } catch {
            errPayload = await res.text();
          }
          console.error('❌ Profile API error payload:', errPayload);
          throw new Error(
            typeof errPayload === 'string'
              ? errPayload
              : errPayload.error || JSON.stringify(errPayload)
          );
        }

        const { user, bankDetails, statusHistory } = await res.json();
        if (!user) throw new Error('Malformed profile response');
        setProfile(user);
        setOriginalProfile(user); // Store original profile data
        setBankDetails(bankDetails || []);
        setStatusHistory(statusHistory || []);
      } catch (err: any) {
        console.error('❌ Failed to load profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    checkPendingRequest();
  }, []);

  // Check for pending profile change requests
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

  // Fetch residency options on mount
  useEffect(() => {
    const fetchResidencyOptions = async () => {
      const res = await fetch('/api/odoo/auth/profile/options?model=hr.employee&field=residence_status');
      if (res.ok) {
        const { options } = await res.json();
        setResidencyOptions(options);
      }
    };
    fetchResidencyOptions();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSendRequest = async () => {
    if (!profile || !originalProfile) return;
    
    try {
      setSaving(true);
      const uid = localStorage.getItem('uid');
      if (!uid) {
        toast.error('User not authenticated');
        return;
      }

      // Find what fields have changed by comparing with original profile
      const changes: any = {};
      Object.keys(profile).forEach(key => {
        const currentValue = profile[key as keyof EmployeeProfile];
        const originalValue = originalProfile[key as keyof EmployeeProfile];
        
        // Handle different data types properly
        if (currentValue !== originalValue) {
          // For arrays (like department_id, parent_id), compare the first element (ID)
          if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
            if (currentValue[0] !== originalValue[0]) {
              changes[key] = currentValue;
            }
          } else {
            changes[key] = currentValue;
          }
        }
      });

      console.log('🔍 Changes detected:', changes);

      if (Object.keys(changes).length === 0) {
        toast.error('No changes detected');
        return;
      }

      // Submit change request
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
        setIsEditing(false);
        checkPendingRequest();
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (err: any) {
      console.error('❌ Failed to submit profile change request:', err);
      toast.error(err.message || 'Failed to submit profile change request');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const rawUid = localStorage.getItem('uid');
        if (!rawUid) throw new Error('Not logged in');
        const uid = Number(rawUid);

        const res = await fetch('/api/odoo/auth/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ uid, updates: { image_1920: base64 } }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update profile image');
        }

        const { data } = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...data } : prev));
        toast.success('Profile image updated successfully');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('❌ Failed to update profile image:', err);
      toast.error(err.message || 'Failed to update profile image');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading profile...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="text-red-600 p-6">{error}</CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-6">Profile not found</CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Pending Request Alert */}
        {hasPendingRequest && pendingRequest && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="font-medium text-yellow-800">Profile Change Request Pending</h3>
                <p className="text-sm text-yellow-700">
                  Your profile change request is pending approval from {pendingRequest.approver_name}.
                  Requested on {pendingRequest.request_date_formatted}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Employee Profile</h1>
            <p className="text-gray-600">Manage your profile information</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2"
              disabled={hasPendingRequest}
            >
              <Edit className="h-4 w-4" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
            {isEditing && !hasPendingRequest && (
              <Button
                onClick={handleSendRequest}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Sending...' : 'Send Request'}
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="work">Work Information</TabsTrigger>
            <TabsTrigger value="private">Private Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader className="text-center">
                  <div className="relative inline-block">
                    <Avatar className="w-24 h-24 mx-auto">
                      <AvatarImage src={profile.image_1920 || undefined} />
                      <AvatarFallback className="text-lg">
                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <label htmlFor="image-upload">
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 cursor-pointer"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <CardTitle className="mt-4">{profile.name}</CardTitle>
                  <CardDescription>{profile.job_title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Employee ID</Label>
                    <p className="text-sm text-gray-600">{profile.barcode}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-sm text-gray-600">{profile.department_id?.[1] || 'Not assigned'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Manager</Label>
                    <p className="text-sm text-gray-600">{profile.parent_id?.[1] || 'Not assigned'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing || hasPendingRequest}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile_phone">Mobile Phone</Label>
                      <Input
                        id="mobile_phone"
                        value={profile.mobile_phone || ''}
                        onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
                        disabled={!isEditing || hasPendingRequest}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work_phone">Work Phone</Label>
                      <Input
                        id="work_phone"
                        value={profile.work_phone || ''}
                        onChange={(e) => handleInputChange('work_phone', e.target.value)}
                        disabled={!isEditing || hasPendingRequest}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work_email">Work Email</Label>
                      <Input
                        id="work_email"
                        value={profile.work_email || ''}
                        onChange={(e) => handleInputChange('work_email', e.target.value)}
                        disabled={!isEditing || hasPendingRequest}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={profile.gender || ''}
                        onValueChange={(value) => handleInputChange('gender', value)}
                        disabled={!isEditing || hasPendingRequest}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday">Birthday</Label>
                      <Input
                        id="birthday"
                        type="date"
                        value={profile.birthday ? format(new Date(profile.birthday), 'yyyy-MM-dd') : ''}
                        onChange={(e) => handleInputChange('birthday', e.target.value)}
                        disabled={!isEditing || hasPendingRequest}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact">Emergency Contact</Label>
                    <Input
                      id="emergency_contact"
                      value={profile.emergency_contact || ''}
                      onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                      disabled={!isEditing || hasPendingRequest}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Emergency Phone</Label>
                    <Input
                      id="emergency_phone"
                      value={profile.emergency_phone || ''}
                      onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                      disabled={!isEditing || hasPendingRequest}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="private_street">Street Address</Label>
                    <Input
                      id="private_street"
                      value={profile.private_street || ''}
                      onChange={(e) => handleInputChange('private_street', e.target.value)}
                      disabled={!isEditing || hasPendingRequest}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="private_street2">Street Address 2</Label>
                    <Input
                      id="private_street2"
                      value={profile.private_street2 || ''}
                      onChange={(e) => handleInputChange('private_street2', e.target.value)}
                      disabled={!isEditing || hasPendingRequest}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="private_zip">Postal Code</Label>
                    <Input
                      id="private_zip"
                      value={profile.private_zip || ''}
                      onChange={(e) => handleInputChange('private_zip', e.target.value)}
                      disabled={!isEditing || hasPendingRequest}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={profile.job_title || ''}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      disabled={!isEditing || hasPendingRequest}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profile.department_id?.[1] || ''}
                      disabled={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Input
                      id="manager"
                      value={profile.parent_id?.[1] || ''}
                      disabled={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Private Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marital">Marital Status</Label>
                    <Select
                      value={profile.marital || ''}
                      onValueChange={(value) => handleInputChange('marital', value)}
                      disabled={!isEditing || hasPendingRequest}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARITAL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="children">Number of Children</Label>
                    <Input
                      id="children"
                      type="number"
                      value={profile.children || 0}
                      onChange={(e) => handleInputChange('children', parseInt(e.target.value))}
                      disabled={!isEditing || hasPendingRequest}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Document management features will be added here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
