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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<EmployeeProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestComment, setRequestComment] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);

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

        console.log('🔍 Fetching profile for UID:', uid);
        const res = await fetch('/api/odoo/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ uid }),
        });

        console.log('🔍 Profile API response status:', res.status);
        
        if (!res.ok) {
          let errPayload: any;
          try {
            errPayload = await res.json();
          } catch {
            errPayload = await res.text();
          }
          console.error('❌ Profile API error payload:', errPayload);
          console.error('❌ Profile API response status:', res.status);
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
  }, []);

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

  // Fetch request history on mount
  useEffect(() => {
    const fetchRequestHistory = async () => {
      try {
        const rawUid = localStorage.getItem('uid');
        if (!rawUid) return;
        const uid = Number(rawUid);

        const res = await fetch('/api/odoo/auth/profile/request-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ uid }),
        });

        if (res.ok) {
          const { data } = await res.json();
          setRequestHistory(data);
        }
      } catch (err) {
        console.error('Failed to fetch request history:', err);
      }
    };
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
        {/* Header with Edit/Save buttons */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Profile Information</h2>
            <p className="text-muted-foreground">View and update your personal information</p>
          </div>
          {!isEditing ? (
            <Button onClick={handleEdit} disabled={!profile}>Edit Profile</Button>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving || isRequesting}>
                Cancel
              </Button>
              <Button onClick={() => setShowRequestDialog(true)} disabled={isSaving || isRequesting}>
                {isRequesting ? 'Submitting...' : 'Request Changes'}
              </Button>
            </div>
          )}
        </div>

        {/* Tabs for profile sections */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="work">Work Information</TabsTrigger>
            <TabsTrigger value="private">Private Information</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
            <TabsTrigger value="status">Status History</TabsTrigger>
            <TabsTrigger value="requests">Change Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            {/* Basic Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {/* Work Mobile */}
                  <div className="space-y-2">
                    <Label htmlFor="mobile_phone">Work Mobile</Label>
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
                      onChange={(e) => setEditedProfile((p) => ({ ...p, barcode: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                    />
                  </div>
                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    {isEditing ? (
                      <Select
                        value={editedProfile.gender || ''}
                        onValueChange={(v) =>
                          setEditedProfile((p) => ({ ...p, gender: v as Gender }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="gender"
                        value={GENDER_OPTIONS.find((o) => o.value === profile.gender)?.label || ''}
                        readOnly
                        className="bg-muted"
                      />
                    )}
                  </div>
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="birthday">Date of Birth</Label>
                    <Input
                      id="birthday"
                      type={isEditing ? 'date' : 'text'}
                      value={
                        isEditing
                          ? editedProfile.birthday || ''
                          : profile.birthday
                          ? format(new Date(profile.birthday), 'dd/MM/yyyy')
                          : ''
                      }
                      onChange={(e) =>
                        setEditedProfile((p) => ({ ...p, birthday: e.target.value }))
                      }
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                    />
                  </div>
                  {/* Age */}
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age || ''}
                      onChange={(e) => setEditedProfile((p) => ({ ...p, age: parseInt(e.target.value) || 0 }))}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={profile.job_title || ''}
                      onChange={(e) => setEditedProfile((p) => ({ ...p, job_title: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
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
                  {/* Direct Manager */}
                  <div className="space-y-2">
                    <Label htmlFor="parent_id">Direct Manager</Label>
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
                  {/* Current Contract */}
                  <div className="space-y-2">
                    <Label htmlFor="contract_id">Current Contract</Label>
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
            {/* Private Information Section with sub-sections */}
            <Card>
              <CardHeader>
                <CardTitle>Private Information</CardTitle>
                <CardDescription>Personal and family details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Private Address */}
                <div>
                  <h4 className="font-semibold mb-3">Private Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="private_street">Private Street</Label>
                      <Input
                        id="private_street"
                        value={`${profile.private_street || ''}${profile.private_street2 ? `, ${profile.private_street2}` : ''}`}
                        onChange={(e) => {
                          const value = e.target.value;
                          const parts = value.split(', ');
                          setEditedProfile((p) => ({ 
                            ...p, 
                            private_street: parts[0] || '',
                            private_street2: parts.slice(1).join(', ') || ''
                          }));
                        }}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="private_zip">Private ZIP</Label>
                      <Input
                        id="private_zip"
                        value={profile.private_zip || ''}
                        onChange={(e) => setEditedProfile((p) => ({ ...p, private_zip: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="private_state_id">Private State</Label>
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
                      <Label htmlFor="residence_status">Residency</Label>
                      {isEditing ? (
                        <Select
                          value={editedProfile.residence_status || ''}
                          onValueChange={(v) => setEditedProfile((p) => ({ ...p, residence_status: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select residency" />
                          </SelectTrigger>
                          <SelectContent>
                            {residencyOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="residence_status"
                          value={residencyOptions.find(opt => opt.value === profile.residence_status)?.label || ''}
                          readOnly
                          className="bg-muted"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Work Permit */}
                <div>
                  <h4 className="font-semibold mb-3">Work Permit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visa_no">Visa No</Label>
                      <Input
                        id="visa_no"
                        value={profile.visa_no || ''}
                        onChange={(e) => setEditedProfile((p) => ({ ...p, visa_no: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="permit_no">Work Permit No</Label>
                      <Input
                        id="permit_no"
                        value={profile.permit_no || ''}
                        onChange={(e) => setEditedProfile((p) => ({ ...p, permit_no: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visa_expire">Visa Expiration Date</Label>
                      <Input
                        id="visa_expire"
                        type={isEditing ? 'date' : 'text'}
                        value={
                          isEditing
                            ? editedProfile.visa_expire || ''
                            : profile.visa_expire
                            ? format(new Date(profile.visa_expire), 'dd/MM/yyyy')
                            : ''
                        }
                        onChange={(e) =>
                          setEditedProfile((p) => ({ ...p, visa_expire: e.target.value }))
                        }
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work_permit_expiration_date">Work Permit Expiration Date</Label>
                      <Input
                        id="work_permit_expiration_date"
                        type={isEditing ? 'date' : 'text'}
                        value={
                          isEditing
                            ? editedProfile.work_permit_expiration_date || ''
                            : profile.work_permit_expiration_date
                            ? format(new Date(profile.work_permit_expiration_date), 'dd/MM/yyyy')
                            : ''
                        }
                        onChange={(e) =>
                          setEditedProfile((p) => ({ ...p, work_permit_expiration_date: e.target.value }))
                        }
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="has_work_permit">Work Permit</Label>
                      <Input
                        id="has_work_permit"
                        value={profile.has_work_permit ? 'Yes' : 'No'}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Citizenship */}
                <div>
                  <h4 className="font-semibold mb-3">Citizenship</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emp_country">Nationality</Label>
                      <Input
                        id="emp_country"
                        value={profile.emp_country || ''}
                        onChange={(e) => setEditedProfile((p) => ({ ...p, emp_country: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp_old_ic">Old Identification No</Label>
                      <Input
                        id="emp_old_ic"
                        value={profile.emp_old_ic || ''}
                        onChange={(e) => setEditedProfile((p) => ({ ...p, emp_old_ic: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="identification_id">Identification No</Label>
                      <Input
                        id="identification_id"
                        value={profile.identification_id || ''}
                        onChange={(e) => setEditedProfile((p) => ({ ...p, identification_id: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ssnid">SSN No</Label>
                      <Input
                        id="ssnid"
                        value={profile.ssnid || ''}
                        onChange={(e) => setEditedProfile((p) => ({ ...p, ssnid: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passport_id">Passport No</Label>
                      <Input
                        id="passport_id"
                        value={profile.passport_id || ''}
                        onChange={(e) => setEditedProfile((p) => ({ ...p, passport_id: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passport_exp_date">Passport Expiry Date</Label>
                      <Input
                        id="passport_exp_date"
                        type={isEditing ? 'date' : 'text'}
                        value={
                          isEditing
                            ? editedProfile.passport_exp_date || ''
                            : profile.passport_exp_date
                            ? format(new Date(profile.passport_exp_date), 'dd/MM/yyyy')
                            : ''
                        }
                        onChange={(e) =>
                          setEditedProfile((p) => ({ ...p, passport_exp_date: e.target.value }))
                        }
                        readOnly={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bank">
            {/* Bank Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Your bank accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-center w-1/4">Name of Bank</th>
                      <th className="px-4 py-2 text-center w-1/4">Bank Code</th>
                      <th className="px-4 py-2 text-center w-1/4">Bank Account No</th>
                      <th className="px-4 py-2 text-center w-1/4">Beneficiary Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankDetails.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted-foreground py-4">No records found</td>
                      </tr>
                    ) : (
                      bankDetails.map((b, i) => (
                        <tr key={b.id || i}>
                          <td className="px-4 py-2 text-center">{b.bank_name}</td>
                          <td className="px-4 py-2 text-center">{b.bank_code}</td>
                          <td className="px-4 py-2 text-center">{b.bank_ac_no}</td>
                          <td className="px-4 py-2 text-center">{b.beneficiary_name}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="status">
            {/* Status History Table */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
                <CardDescription>Employment status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-center w-1/4">Stage</th>
                      <th className="px-4 py-2 text-center w-1/4">Start Date</th>
                      <th className="px-4 py-2 text-center w-1/4">End Date</th>
                      <th className="px-4 py-2 text-center w-1/4">Duration (Days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted-foreground py-4">No records found</td>
                      </tr>
                    ) : (
                      statusHistory.map((s, i) => (
                        <tr key={s.id || i}>
                          <td className="px-4 py-2 text-center">{s.state}</td>
                          <td className="px-4 py-2 text-center">{s.start_date ? format(new Date(s.start_date), 'dd/MM/yyyy') : ''}</td>
                          <td className="px-4 py-2 text-center">{s.end_date ? format(new Date(s.end_date), 'dd/MM/yyyy') : ''}</td>
                          <td className="px-4 py-2 text-center">{s.duration}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="requests">
            {/* Change Requests History */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Change Requests</CardTitle>
                <CardDescription>History of your profile change requests</CardDescription>
              </CardHeader>
              <CardContent>
                {requestHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No change requests found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requestHistory.map((request) => (
                      <Card key={request.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold">Request #{request.id}</h4>
                              <p className="text-sm text-muted-foreground">
                                Submitted on {format(new Date(request.request_date), 'PPP')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Manager: {request.manager_name}
                              </p>
                            </div>
                            {getStatusBadge(request.state)}
                          </div>
                          
                          {request.comment && (
                            <div className="mb-3">
                              <Label className="text-sm font-medium">Your Comment:</Label>
                              <p className="text-sm text-muted-foreground mt-1">{request.comment}</p>
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <Label className="text-sm font-medium">Requested Changes:</Label>
                            <div className="mt-2 space-y-1">
                              {Object.entries(request.requested_changes).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center text-sm">
                                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span className="text-muted-foreground">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {request.state === 'approved' && request.approval_comment && (
                            <div className="mb-3">
                              <Label className="text-sm font-medium">Manager's Approval Comment:</Label>
                              <p className="text-sm text-muted-foreground mt-1">{request.approval_comment}</p>
                            </div>
                          )}
                          
                          {request.state === 'rejected' && request.rejection_comment && (
                            <div className="mb-3">
                              <Label className="text-sm font-medium">Manager's Rejection Reason:</Label>
                              <p className="text-sm text-muted-foreground mt-1">{request.rejection_comment}</p>
                            </div>
                          )}
                          
                          {request.state === 'approved' && (
                            <p className="text-sm text-green-600 font-medium">
                              ✓ Approved on {format(new Date(request.approved_date), 'PPP')}
                            </p>
                          )}
                          
                          {request.state === 'rejected' && (
                            <p className="text-sm text-red-600 font-medium">
                              ✗ Rejected on {format(new Date(request.rejected_date), 'PPP')}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Profile Change Request Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Profile Changes</DialogTitle>
              <DialogDescription>
                Your changes will be sent to your direct manager for approval. Please add a comment explaining the reason for these changes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="request-comment">Comment (Optional)</Label>
                <Textarea
                  id="request-comment"
                  placeholder="Explain the reason for these changes..."
                  value={requestComment}
                  onChange={(e) => setRequestComment(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Changes to be requested:</p>
                <ul className="space-y-1">
                  {Object.entries(editedProfile).map(([key, value]) => (
                    <li key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-mono text-xs">{String(value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRequestDialog(false)} disabled={isRequesting}>
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
