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

interface EmployeeProfile {
  id: number;
  name: string;
  image_1920: string | null;
  // Basic Info
  gender: Gender;
  birthday: string;
  marital: MaritalStatus;
  country_id: [number, string];
  // Contact Info
  work_email: string;
  work_phone: string;
  mobile_phone: string;
  private_street: string;
  emergency_contact: string;
  emergency_phone: string;
  // Job Info
  job_title: string;
  department_id: [number, string];
  parent_id: [number, string];
  start_date: [number, string];
  work_location_id: [number, string];
  // Other Details
  bank_account_id: [number, string];
  identification_id: string;
  lang: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<EmployeeProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

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

        const { user } = await res.json();
        if (!user) throw new Error('Malformed profile response');
        setProfile(user);
      } catch (err: any) {
        console.error('❌ Failed to load profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
      start_date: profile.start_date,
      lang: profile.lang,
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
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
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
                    src={profile.image_1920 ? `data:image/jpeg;base64,${profile.image_1920}` : undefined}
                    alt={profile.name}
                  />
                  <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
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
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact Info</TabsTrigger>
                <TabsTrigger value="job">Job Info</TabsTrigger>
                <TabsTrigger value="other">Other Details</TabsTrigger>
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
                      {/* Birthday */}
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
                      {/* Marital Status */}
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
                      {/* Nationality */}
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          value={profile.country_id?.[1] || ''}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="contact">
                {/* Contact Info Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>How to reach you</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Work Email</Label>
                      <Input value={profile.work_email || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile Phone</Label>
                      <Input value={profile.mobile_phone || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Name</Label>
                      <Input value={profile.emergency_contact || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Work Phone</Label>
                      <Input value={profile.work_phone || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Home Address</Label>
                      <Input value={profile.private_street || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Phone</Label>
                      <Input value={profile.emergency_phone || ''} readOnly className="bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="job">
                {/* Job Info Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Job Information</CardTitle>
                    <CardDescription>Your employment details</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input value={profile.job_title || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Manager/Supervisor</Label>
                      <Input value={profile.parent_id?.[1] || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input value={profile.department_id?.[1] || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Work Location</Label>
                      <Input value={profile.work_location_id?.[1] || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Employee ID</Label>
                      <Input value={profile.id || ''} readOnly className="bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="other">
                {/* Other Details Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Other Details</CardTitle>
                    <CardDescription>Additional information</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Account</Label>
                      <Input value={profile.bank_account_id?.[1] || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>IC Number</Label>
                      <Input value={profile.identification_id || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Input value={profile.lang || ''} readOnly className="bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}
