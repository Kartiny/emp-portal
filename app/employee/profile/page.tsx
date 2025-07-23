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
import { Camera } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<EmployeeProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEdit = () => {
    if (!profile) return;
    setIsEditing(true);
    setEditedProfile({
      gender: profile.gender,
      birthday: profile.birthday,
      marital: profile.marital,
      country_id: profile.country_id,
      work_email: profile.work_email,
      work_phone: profile.work_phone,
      mobile_phone: profile.mobile_phone,
      private_street: profile.private_street,
      emergency_contact: profile.emergency_contact,
      emergency_phone: profile.emergency_phone,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({});
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);

      const res = await fetch('/api/odoo/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uid, updates: editedProfile }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update profile');
      }

      const { data } = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...data } : prev));
      setIsEditing(false);
      setEditedProfile({});
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error('❌ Failed to update profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      
    );
  }

  if (error) {
    return (
      
    );
  }

  return (
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
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {/* Only render profile details if profile is loaded */}
        {profile && (
          <>
            {/* Profile Pic & Name */}
            <div className="flex flex-col items-center space-y-2 mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={profile?.image_1920 ? `data:image/jpeg;base64,${profile.image_1920}` : undefined}
                    alt={profile?.name || ''}
                  />
                  <AvatarFallback>{profile?.name?.charAt(0) || ''}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="avatar-upload">
                    <Button size="icon" variant="secondary" asChild disabled={isSaving}>
                      <div>
                        <Camera className="h-4 w-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                    </Button>
                  </label>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{profile.name}</h3>
              </div>
            </div>

            {/* Tabs for profile sections */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="work">Work Information</TabsTrigger>
                <TabsTrigger value="private">Private Information</TabsTrigger>
                <TabsTrigger value="bank">Bank Details</TabsTrigger>
                <TabsTrigger value="status">Status History</TabsTrigger>
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

                    {/* Family Status */}
                    <div>
                      <h4 className="font-semibold mb-3">Family Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="marital">Marital Status</Label>
                        {isEditing ? (
                          <Select
                            value={editedProfile.marital || ''}
                            onValueChange={(v) =>
                              setEditedProfile((p) => ({ ...p, marital: v as MaritalStatus }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                            <SelectContent>
                              {MARITAL_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="marital"
                            value={MARITAL_OPTIONS.find((o) => o.value === profile.marital)?.label || ''}
                            readOnly
                            className="bg-muted"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="children">Number of Dependent Children</Label>
                        <Input
                            id="children"
                            type="number"
                            value={profile.children || ''}
                            onChange={(e) => setEditedProfile((p) => ({ ...p, children: parseInt(e.target.value) || 0 }))}
                            readOnly={!isEditing}
                            className={!isEditing ? 'bg-muted' : ''}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Emergency */}
                    <div>
                      <h4 className="font-semibold mb-3">Emergency</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                          <Label htmlFor="emergency_contact">Contact Name</Label>
                          <Input
                            id="emergency_contact"
                            value={profile.emergency_contact || ''}
                            onChange={(e) => setEditedProfile((p) => ({ ...p, emergency_contact: e.target.value }))}
                            readOnly={!isEditing}
                            className={!isEditing ? 'bg-muted' : ''}
                          />
                    </div>
                    <div className="space-y-2">
                          <Label htmlFor="emergency_phone">Contact Phone</Label>
                          <Input
                            id="emergency_phone"
                            value={profile.emergency_phone || ''}
                            onChange={(e) => setEditedProfile((p) => ({ ...p, emergency_phone: e.target.value }))}
                            readOnly={!isEditing}
                            className={!isEditing ? 'bg-muted' : ''}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <h4 className="font-semibold mb-3">Education</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="certificate">Certificate Level</Label>
                          <Input
                            id="certificate"
                            value={profile.certificate || ''}
                            onChange={(e) => setEditedProfile((p) => ({ ...p, certificate: e.target.value }))}
                            readOnly={!isEditing}
                            className={!isEditing ? 'bg-muted' : ''}
                          />
                    </div>
                    <div className="space-y-2">
                          <Label htmlFor="study_field">Field of Study</Label>
                          <Input
                            id="study_field"
                            value={profile.study_field || ''}
                            onChange={(e) => setEditedProfile((p) => ({ ...p, study_field: e.target.value }))}
                            readOnly={!isEditing}
                            className={!isEditing ? 'bg-muted' : ''}
                          />
                    </div>
                    <div className="space-y-2">
                          <Label htmlFor="study_school">School</Label>
                          <Input
                            id="study_school"
                            value={profile.study_school || ''}
                            onChange={(e) => setEditedProfile((p) => ({ ...p, study_school: e.target.value }))}
                            readOnly={!isEditing}
                            className={!isEditing ? 'bg-muted' : ''}
                          />
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
            </Tabs>
          </>
        )}
      </div>
  );
}
