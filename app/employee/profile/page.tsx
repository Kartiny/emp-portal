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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

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
  const [editedProfile, setEditedProfile] = useState<Partial<EmployeeProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestComment, setRequestComment] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const rawUid = localStorage.getItem('uid');
        if (!rawUid) throw new Error('Not logged in');
        const uid = Number(rawUid);

        const res = await fetch('/api/odoo/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch profile');
        }

        const { user } = await res.json();
        setProfile(user);
        setOriginalProfile(user);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Failed to fetch profile:', err);
        toast.error(err.message || 'Failed to fetch profile');
        setLoading(false);
      }
    };

    const fetchRequestHistory = async () => {
      try {
        const rawUid = localStorage.getItem('uid');
        if (!rawUid) return;
        const uid = Number(rawUid);

        const res = await fetch('/api/odoo/profile/my-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });

        if (res.ok) {
          const data = await res.json();
          setRequestHistory(data.requests || []);
        }
      } catch (err) {
        console.error('Failed to fetch request history:', err);
      }
    };
    fetchProfile();
    fetchRequestHistory();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({});
    setRequestComment('');
    if (originalProfile) {
      setProfile(originalProfile);
    }
  };

  const handleRequestChanges = async () => {
    try {
      setIsRequesting(true);
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);

      const res = await fetch('/api/odoo/auth/profile/request-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          uid, 
          changes: editedProfile,
          comment: requestComment 
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit change request');
      }

      const { data } = await res.json();
      setIsEditing(false);
      setEditedProfile({});
      setRequestComment('');
      setShowRequestDialog(false);
      toast.success(`Change request submitted to ${data.manager_name}`);
    } catch (err: any) {
      console.error('❌ Failed to submit change request:', err);
      toast.error(err.message || 'Failed to submit change request');
    } finally {
      setIsRequesting(false);
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

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with Edit/Save buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Employee Profile</h1>
            <p className="text-muted-foreground">Manage your personal and work information</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <Button onClick={handleEdit} className="w-full sm:w-auto">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handleCancel} variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={() => setShowRequestDialog(true)} className="w-full sm:w-auto">
                  Request Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="work">Work Info</TabsTrigger>
            <TabsTrigger value="private">Private Info</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
            <TabsTrigger value="status">Status History</TabsTrigger>
            <TabsTrigger value="requests">Change Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 lg:h-24 lg:w-24">
                      {profile.image_1920 ? (
                        <AvatarImage src={`data:image/jpeg;base64,${profile.image_1920}`} alt={profile.name} />
                      ) : null}
                      <AvatarFallback className="text-lg lg:text-xl">
                        {profile.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer">
                        <Camera className="w-4 h-4 text-gray-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg lg:text-xl font-semibold">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">Employee ID: {profile.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profile.name || ''}
                      onChange={(e) => setEditedProfile((p) => ({ ...p, name: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                    />
                  </div>
                  {/* Mobile Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="mobile_phone">Mobile Phone</Label>
                    <Input
                      id="mobile_phone"
                      value={profile.mobile_phone || ''}
                      onChange={(e) => setEditedProfile((p) => ({ ...p, mobile_phone: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                    />
                  </div>
                  {/* Work Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="work_phone">Work Phone</Label>
                    <Input
                      id="work_phone"
                      value={profile.work_phone || ''}
                      onChange={(e) => setEditedProfile((p) => ({ ...p, work_phone: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                    />
                  </div>
                  {/* Work Email */}
                  <div className="space-y-2">
                    <Label htmlFor="work_email">Work Email</Label>
                    <Input
                      id="work_email"
                      value={profile.work_email || ''}
                      onChange={(e) => setEditedProfile((p) => ({ ...p, work_email: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                    />
                  </div>
                  {/* Badge ID */}
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Badge ID</Label>
                    <Input
                      id="barcode"
                      value={profile.barcode || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Input
                      id="gender"
                      value={GENDER_OPTIONS.find((o) => o.value === profile.gender)?.label || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="birthday">Date of Birth</Label>
                    <Input
                      id="birthday"
                      type="text"
                      value={profile.birthday ? format(new Date(profile.birthday), 'dd/MM/yyyy') : ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Age */}
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Place of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="place_of_birth">Place of Birth</Label>
                    <Input
                      id="place_of_birth"
                      value={profile.place_of_birth || ''}
                      onChange={(e) => setEditedProfile((p) => ({ ...p, place_of_birth: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                    />
                  </div>
                  {/* Country of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="country_of_birth">Country of Birth</Label>
                    <Input
                      id="country_of_birth"
                      value={profile.country_of_birth?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work">
            {/* Work Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Work Information</CardTitle>
                <CardDescription>Your employment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={profile.job_title || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department_id">Department</Label>
                    <Input
                      id="department_id"
                      value={profile.department_id?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Manager */}
                  <div className="space-y-2">
                    <Label htmlFor="parent_id">Manager</Label>
                    <Input
                      id="parent_id"
                      value={profile.parent_id?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Expense Manager */}
                  <div className="space-y-2">
                    <Label htmlFor="expense_manager_id">Expense Manager</Label>
                    <Input
                      id="expense_manager_id"
                      value={profile.expense_manager_id?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Leave Manager */}
                  <div className="space-y-2">
                    <Label htmlFor="leave_manager_id">Leave Manager</Label>
                    <Input
                      id="leave_manager_id"
                      value={profile.leave_manager_id?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Attendance Manager */}
                  <div className="space-y-2">
                    <Label htmlFor="attendance_manager_id">Attendance Manager</Label>
                    <Input
                      id="attendance_manager_id"
                      value={profile.attendance_manager_id?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Contract */}
                  <div className="space-y-2">
                    <Label htmlFor="contract_id">Contract</Label>
                    <Input
                      id="contract_id"
                      value={profile.contract_id?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private">
            {/* Private Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Private Information</CardTitle>
                <CardDescription>Your personal and family details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Address fields */}
                  <div className="space-y-2">
                    <Label htmlFor="private_street">Street Address</Label>
                    <Input
                      id="private_street"
                      value={profile.private_street || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="private_street2">Street Address 2</Label>
                    <Input
                      id="private_street2"
                      value={profile.private_street2 || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="private_zip">ZIP Code</Label>
                    <Input
                      id="private_zip"
                      value={profile.private_zip || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="private_state_id">State</Label>
                    <Input
                      id="private_state_id"
                      value={profile.private_state_id?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country_id">Country</Label>
                    <Input
                      id="country_id"
                      value={profile.country_id?.[1] || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permanent_resident">Permanent Resident</Label>
                    <Input
                      id="permanent_resident"
                      value={profile.permanent_resident || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Family Status */}
                  <div className="space-y-2">
                    <Label htmlFor="marital">Marital Status</Label>
                    <Input
                      id="marital"
                      value={MARITAL_OPTIONS.find((o) => o.value === profile.marital)?.label || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="children">Number of Children</Label>
                    <Input
                      id="children"
                      type="number"
                      value={profile.children || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {/* Emergency Contact */}
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact">Emergency Contact</Label>
                    <Input
                      id="emergency_contact"
                      value={profile.emergency_contact || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Emergency Phone</Label>
                    <Input
                      id="emergency_phone"
                      value={profile.emergency_phone || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            {/* Bank Details Section */}
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Your banking information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Bank details section - to be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            {/* Status History Section */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
                <CardDescription>Your employment status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Status history section - to be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            {/* Change Requests Section */}
            <Card>
              <CardHeader>
                <CardTitle>Change Requests</CardTitle>
                <CardDescription>Your profile change request history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requestHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No change requests found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requestHistory.map((request, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm lg:text-base">Request #{request.id}</h4>
                            {getStatusBadge(request.state)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs lg:text-sm">
                            <div>
                              <span className="font-medium">Submitted:</span> {format(new Date(request.create_date), 'dd/MM/yyyy HH:mm')}
                            </div>
                            <div>
                              <span className="font-medium">Manager:</span> {request.manager_name || 'N/A'}
                            </div>
                          </div>
                          {request.comment && (
                            <div className="mt-2">
                              <span className="font-medium text-xs lg:text-sm">Comment:</span>
                              <p className="text-xs lg:text-sm text-muted-foreground mt-1">{request.comment}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Request Changes Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-md lg:max-w-lg">
            <DialogHeader>
              <DialogTitle>Request Profile Changes</DialogTitle>
              <DialogDescription>
                Submit a request to your manager to approve the changes you've made to your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  value={requestComment}
                  onChange={(e) => setRequestComment(e.target.value)}
                  placeholder="Add any additional comments for your manager..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestChanges} disabled={isRequesting}>
                {isRequesting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
